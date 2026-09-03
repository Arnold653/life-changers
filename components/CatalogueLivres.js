'use client'

import { useMemo, useState } from 'react'
import { CouvertureLivre } from '@/components/Couvertures'

// Le livre lui-même n'est verrouillé (accès payant) qu'en mode 'payant' — en 'pourboire' et
// 'bonus', la lecture reste entièrement gratuite (seul un pourboire ou un bonus annexe est
// payant), donc le badge catalogue doit rester "Gratuit" dans ces deux cas.
function BadgePaiement({ livre }) {
  const estPayant = livre.mode_monetisation === 'payant'
  return (
    <span
      className={`font-mono text-[0.6rem] uppercase tracking-widest rounded-full px-2 py-0.5 backdrop-blur-sm ${
        estPayant ? 'text-encre bg-or' : 'text-white border border-white/30 bg-black/20'
      }`}
    >
      {estPayant ? `Payant${livre.prix_fcfa ? ` · ${livre.prix_fcfa} FCFA` : ''}` : 'Gratuit'}
    </span>
  )
}

function Stat({ glyphe, valeur, suffixe = '' }) {
  if (!valeur) return null
  return (
    <span className="inline-flex items-center gap-1 text-papier/45 text-xs font-mono">
      <span>{glyphe}</span>{valeur}{suffixe}
    </span>
  )
}

function CarteLivre({ livre, vedette = false }) {
  if (vedette) {
    return (
      <a href={`/livres/${livre.slug}`} className="group flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        {/* Couverture à son ratio naturel (portrait), jamais recadrée — contrairement à un
            bandeau large qui coupait le haut/bas d'une vraie couverture verticale. */}
        <div className="relative w-40 sm:w-52 shrink-0 mx-auto sm:mx-0 aspect-[3/4.2] overflow-hidden rounded-md shadow-[6px_6px_0_0_rgb(var(--papier)/0.15)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[10px_10px_0_0_rgb(var(--papier)/0.15)]">
          <CouvertureLivre titre={livre.titre} couvertureUrl={livre.couverture_url} />
          <div className="absolute inset-0 p-2.5 flex items-start gap-1.5 flex-wrap">
            <BadgePaiement livre={livre} />
            {livre.genre && (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-white border border-white/30 rounded-full px-2 py-0.5 bg-black/20 backdrop-blur-sm">
                {livre.genre}
              </span>
            )}
            {livre.nouveau && (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-encre bg-or rounded-full px-2 py-0.5">
                Nouveau
              </span>
            )}
          </div>
          {livre.sectionEnCours && livre.nbSections > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
              <div className="h-full bg-or" style={{ width: `${Math.min(100, (livre.sectionEnCours / livre.nbSections) * 100)}%` }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="w-6 h-[1.5px] bg-or mb-3 mx-auto sm:mx-0" />
          <h2 className="font-display font-bold text-papier leading-tight text-2xl md:text-4xl mb-1.5">
            {livre.titre}
          </h2>
          {livre.auteur && <p className="text-papier/45 text-xs font-mono mb-3">{livre.auteur}</p>}
          <p className="text-papier/45 leading-relaxed text-base max-w-2xl mb-3">{livre.description}</p>
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <span className="text-or text-sm font-mono uppercase tracking-wide">
              {livre.sectionEnCours ? 'Reprendre →' : 'Découvrir →'}
            </span>
            <Stat glyphe="👥" valeur={livre.nbLecteurs} suffixe=" lecteur" />
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={`/livres/${livre.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-md mb-4 shadow-[6px_6px_0_0_rgb(var(--papier)/0.15)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[10px_10px_0_0_rgb(var(--papier)/0.15)] aspect-[3/4.2]">
        {/* La couverture (réelle ou placeholder) reste toujours sombre par construction (voir
            Couvertures.js) — le texte posé dessus est donc toujours blanc fixe, jamais lié au
            thème clair/sombre du site : il resterait invisible sur une couverture sombre sinon. */}
        <CouvertureLivre titre={livre.titre} couvertureUrl={livre.couverture_url} />

        <div className="absolute inset-0 p-4 flex items-start gap-2 flex-wrap">
          <BadgePaiement livre={livre} />
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

        {livre.sectionEnCours && livre.nbSections > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div className="h-full bg-or" style={{ width: `${Math.min(100, (livre.sectionEnCours / livre.nbSections) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Titre/auteur hors de la carte : lisibilité garantie quels que soient le thème et la
          couverture (réelle photo, n'importe quelle couleur), pas de superposition risquée. */}
      <h2 className="font-display font-semibold text-papier leading-snug text-lg mb-0.5">{livre.titre}</h2>
      {livre.auteur && <p className="text-papier/45 text-xs font-mono mb-2">{livre.auteur}</p>}

      <p className="text-papier/45 leading-relaxed text-sm line-clamp-2 mb-2">{livre.description}</p>

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

export default function CatalogueLivres({ livres, pseudo, connecte = true }) {
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
    <>
      {connecte && vedetteValide?.couverture_url && (
        <section className="relative overflow-hidden bg-[#050810] min-h-[70vh] sm:min-h-[78vh] flex items-end -mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vedetteValide.couverture_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.1) 0%, rgba(5,8,16,0.55) 55%, #050810 96%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #050810 0%, rgba(5,8,16,0.5) 32%, transparent 62%)' }} />

          <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-10 pb-14 sm:pb-20 pt-28">
            {salutation && <p className="text-white/55 font-mono text-sm mb-4">{salutation}</p>}
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-or mb-4 flex items-center gap-2">
              <span className="w-5 h-[3px] bg-or inline-block" /> {enCours ? 'Reprendre la lecture' : 'Le plus lu'}
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-5xl text-white mb-5 leading-[1.05] tracking-tight max-w-2xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              {vedetteValide.titre}
            </h1>
            {vedetteValide.description && (
              <p className="text-white/65 leading-relaxed text-base max-w-lg mb-8 line-clamp-3">{vedetteValide.description}</p>
            )}
            <a
              href={`/livres/${vedetteValide.slug}`}
              className="inline-block text-encre bg-or rounded-full px-8 py-3.5 font-semibold hover:brightness-110 transition-all"
            >
              {enCours ? 'Reprendre →' : 'Découvrir →'}
            </a>
          </div>
        </section>
      )}

      <div id="catalogue" className="px-6 pt-16 pb-24 max-w-6xl mx-auto scroll-mt-16">
        {!connecte && (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-papier/40 mb-8 pt-4">Le catalogue</p>
        )}
        {connecte && !vedetteValide?.couverture_url && (
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
        )}

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
    </>
  )
}
