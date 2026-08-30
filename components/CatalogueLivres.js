'use client'

import { useMemo, useState } from 'react'
import { CouvertureLivre } from '@/components/Couvertures'

function Stat({ glyphe, valeur, suffixe = '' }) {
  if (!valeur) return null
  return (
    <span className="inline-flex items-center gap-1 text-papier/45 text-xs font-mono">
      <span>{glyphe}</span>{valeur}{suffixe}
    </span>
  )
}

function CarteLivre({ livre, vedette = false }) {
  return (
    <a href={`/livres/${livre.slug}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-md mb-4 shadow-[6px_6px_0_0_rgb(var(--papier)/0.15)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[10px_10px_0_0_rgb(var(--papier)/0.15)] ${
          vedette ? 'aspect-[16/8.5] sm:aspect-[16/7]' : 'aspect-[3/4.2]'
        }`}
      >
        {/* La couverture (réelle ou placeholder) reste toujours sombre par construction (voir
            Couvertures.js) — le texte posé dessus est donc toujours blanc fixe, jamais lié au
            thème clair/sombre du site : il resterait invisible sur une couverture sombre sinon. */}
        <CouvertureLivre titre={livre.titre} couvertureUrl={livre.couverture_url} />

        <div className="absolute inset-0 p-4 flex items-start gap-2">
          {livre.genre && (
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-white border border-white/30 rounded-full px-2.5 py-1 bg-black/20 backdrop-blur-sm">
              {livre.genre}
            </span>
          )}
          {livre.nouveau && (
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-encre bg-or rounded-full px-2.5 py-1">
              Nouveau
            </span>
          )}
        </div>

        {vedette && (
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="w-6 h-[1.5px] bg-or mb-3" />
            <h2 className="font-display font-bold text-white leading-tight text-2xl md:text-4xl max-w-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              {livre.titre}
            </h2>
            {livre.auteur && <p className="text-white/75 text-xs mt-1.5 font-mono">{livre.auteur}</p>}
          </div>
        )}

        {livre.sectionEnCours && livre.nbSections > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div className="h-full bg-or" style={{ width: `${Math.min(100, (livre.sectionEnCours / livre.nbSections) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Titre/auteur hors de la carte : lisibilité garantie quels que soient le thème et la
          couverture (réelle photo, n'importe quelle couleur), pas de superposition risquée. */}
      {!vedette && (
        <>
          <h2 className="font-display font-semibold text-papier leading-snug text-lg mb-0.5">{livre.titre}</h2>
          {livre.auteur && <p className="text-papier/45 text-xs font-mono mb-2">{livre.auteur}</p>}
        </>
      )}

      <p className={`text-papier/45 leading-relaxed ${vedette ? 'text-base max-w-2xl mb-2' : 'text-sm line-clamp-2 mb-2'}`}>{livre.description}</p>

      <div className="flex items-center gap-3 flex-wrap">
        {livre.sectionEnCours ? (
          <span className="text-or text-xs font-mono">Reprendre →</span>
        ) : livre.nbSections > 0 ? (
          <span className="text-papier/35 text-xs font-mono">{livre.nbSections} partie{livre.nbSections > 1 ? 's' : ''}</span>
        ) : null}
        <Stat glyphe="👥" valeur={livre.nbLecteurs} suffixe={livre.nbLecteurs > 1 ? ' lecteurs' : ' lecteur'} />
      </div>
    </a>
  )
}

export default function CatalogueLivres({ livres, pseudo }) {
  const [recherche, setRecherche] = useState('')
  const [genreActif, setGenreActif] = useState(null)
  const [tri, setTri] = useState('recents') // 'recents' | 'lus' | 'encours'

  const salutation = useMemo(() => {
    if (!pseudo) return null
    const heure = new Date().getHours()
    const moment = heure < 5 ? 'Bonsoir' : heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
    return `${moment}, ${pseudo}.`
  }, [pseudo])

  const genres = useMemo(
    () => [...new Set(livres.map((l) => l.genre).filter(Boolean))].sort(),
    [livres]
  )

  const filtres = useMemo(() => {
    let liste = livres.filter((l) => l.titre.toLowerCase().includes(recherche.toLowerCase()))
    if (genreActif) liste = liste.filter((l) => l.genre === genreActif)
    if (tri === 'lus') liste = [...liste].sort((a, b) => b.nbLecteurs - a.nbLecteurs)
    else if (tri === 'encours') liste = liste.filter((l) => l.sectionEnCours)
    else liste = [...liste].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return liste
  }, [livres, recherche, genreActif, tri])

  const enCours = livres.find((l) => l.sectionEnCours > 0) || null
  const vedette = !recherche && !genreActif && tri === 'recents'
    ? enCours || [...livres].sort((a, b) => b.nbLecteurs - a.nbLecteurs)[0]
    : null
  const vedetteValide = vedette && (enCours || vedette.nbLecteurs > 0) ? vedette : null
  const reste = vedetteValide ? filtres.filter((l) => l.id !== vedetteValide.id) : filtres

  return (
    <div className="px-6 pt-16 pb-24 max-w-6xl mx-auto">
      <div className="lever max-w-2xl mb-12">
        {salutation && (
          <p className="text-papier/50 font-mono text-sm mb-4">{salutation}</p>
        )}
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-or mb-4 flex items-center gap-2">
          <span className="w-5 h-[3px] bg-or inline-block" /> Life Changers
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-papier mb-5 leading-[1.05] tracking-tight">
          Des livres qui changent des vies.
        </h1>
        <p className="text-papier/60 leading-relaxed text-lg">
          Des ouvrages complets, écrits sans détour, à lire en ligne ou hors connexion.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un titre..."
          className="bg-encreClair border border-ligne rounded-full px-4 py-2.5 text-sm text-papier placeholder:text-papier/30 focus:outline-none focus:border-or/50 w-full sm:w-64"
        />
        <div className="flex gap-2 font-mono text-xs uppercase tracking-wide shrink-0">
          {[
            ['recents', 'Récents'],
            ['lus', 'Les plus lus'],
            ['encours', 'En cours'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTri(val)}
              className={`rounded-full px-3 py-1.5 border transition-colors ${
                tri === val ? 'border-or text-or' : 'border-ligne text-papier/45 hover:border-papier/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {genres.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-12 font-mono text-xs uppercase tracking-wide">
          <button
            onClick={() => setGenreActif(null)}
            className={`rounded-full px-3 py-1.5 border transition-colors ${!genreActif ? 'border-or text-or' : 'border-ligne text-papier/45 hover:border-papier/30'}`}
          >
            Tous
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreActif(g)}
              className={`rounded-full px-3 py-1.5 border transition-colors ${genreActif === g ? 'border-or text-or' : 'border-ligne text-papier/45 hover:border-papier/30'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {vedetteValide && (
        <div className="mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-papier/40 mb-4">
            {enCours ? 'Reprendre la lecture' : 'Le plus lu'}
          </p>
          <CarteLivre livre={vedetteValide} vedette />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {reste.map((livre) => (
          <CarteLivre key={livre.id} livre={livre} />
        ))}
      </div>

      {filtres.length === 0 && (
        <p className="text-papier/35 text-sm font-mono">
          {tri === 'encours' ? "Rien en cours pour l'instant — choisis un livre pour commencer." : 'Aucun livre ne correspond.'}
        </p>
      )}
    </div>
  )
}
