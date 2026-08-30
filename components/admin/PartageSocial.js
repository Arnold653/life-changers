'use client'

import { useEffect, useRef, useState } from 'react'
import { genererVisuelPartage, telechargerCanvas } from '@/lib/visuelPartage'

const CHEMIN_PAR_TYPE = {
  roman: 'roman',
  livre: 'livres',
  'conte-africain': 'contes-africains',
  'conte-enfant': 'contes-enfants',
}

function tronquer(texte, max) {
  if (!texte) return ''
  return texte.length > max ? texte.slice(0, max - 1).trim() + '…' : texte
}

// Nettoie le texte brut d'un chapitre/section pour une publication (extrait ou intégral) :
// retire les titres internes et les marqueurs de mise en forme (§TABLEAU§, §LISTE§...) que
// Facebook ne sait pas afficher, en gardant les paragraphes et les lignes de dialogue intactes.
function nettoyerPourPost(texteBrut) {
  if (!texteBrut) return ''
  return texteBrut
    .split(/\n\s*\n/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => {
      if (/^§(TABLEAU|LISTE)§/.test(bloc)) return null // pas de rendu texte brut satisfaisant sur Facebook
      if (/^§CITATION§/.test(bloc)) return bloc.slice('§CITATION§'.length).trim()
      if (/^§ENCADRE§/.test(bloc)) {
        try { return JSON.parse(bloc.slice('§ENCADRE§'.length)).texte || null } catch { return null }
      }
      if (/^#{1,6}\s/.test(bloc)) return null // titre interne, pas utile hors contexte de l'app
      return bloc
    })
    .filter(Boolean)
    .join('\n\n')
    .replace(/[*_#]/g, '')
    .trim()
}

// Extrait-accroche : les premières phrases, coupées proprement à une fin de phrase (pas au
// milieu d'un mot) — un vrai avant-goût plutôt qu'une ligne neutre, sans livrer tout le texte.
function extraitAccroche(texteBrut, max = 420) {
  const propre = nettoyerPourPost(texteBrut).replace(/\s+/g, ' ')
  if (!propre) return ''
  if (propre.length <= max) return propre
  const tranche = propre.slice(0, max)
  const dernierePonctuation = Math.max(tranche.lastIndexOf('. '), tranche.lastIndexOf('! '), tranche.lastIndexOf('? '))
  return dernierePonctuation > max * 0.5 ? tranche.slice(0, dernierePonctuation + 1) : tranche.trim() + '…'
}

function genererLegende({ type, titre, resume, genre, region, tranche_age, chapitreLabel, texteBrut, texteComplet }) {
  const accroche = chapitreLabel ? `${chapitreLabel} de « ${titre} »` : titre

  const intros = {
    roman: `📖 ${accroche}`,
    livre: `📘 ${accroche}`,
    'conte-africain': `🌍 ${accroche}${region ? ` — un conte du ${region}` : ''}`,
    'conte-enfant': `✨ ${accroche}${tranche_age ? ` — une histoire pour les ${tranche_age}` : ''}`,
  }

  if (texteComplet) {
    // Le texte intégral EST le post : pas de résumé/extrait redondant au-dessus, juste
    // l'accroche puis le chapitre en entier, pensé pour être lu tel quel sur le feed.
    const corps = nettoyerPourPost(texteBrut)
    return `${intros[type]}\n\n${corps}\n\n📖 Life Changers — pour ne rater aucune prochaine sortie 👇`
  }

  // Le résumé décrit l'ensemble du titre, pas un chapitre précis — l'afficher pour un partage de
  // chapitre donnerait la même légende, mot pour mot, quel que soit le chapitre choisi. On lui
  // préfère un vrai extrait du chapitre (avant-goût) quand le texte est disponible.
  const corps = chapitreLabel
    ? (texteBrut ? extraitAccroche(texteBrut) : 'Nouveau passage à découvrir.')
    : tronquer(resume, 200)

  return `${intros[type]}\n\n${corps}\n\n📖 Disponible sur Life Changers — lien juste en dessous, en commentaire 👇\n\n#LifeChangers`
}

// Bouton "Partager" : génère un vrai visuel téléchargeable (titre + genre + éventuel chapitre
// incrustés dans l'image, avec l'appel à l'action) plus une légende assortie — rien n'est publié
// automatiquement, Life télécharge et poste elle-même sur Facebook/Instagram.
export default function PartageSocial({ type, titre, resume, genre, region, tranche_age, slug, couvertureUrl, chapitreLabel, texteBrut, compact }) {
  const [ouvert, setOuvert] = useState(false)
  const [texteComplet, setTexteComplet] = useState(false)
  const [copie, setCopie] = useState(false)
  const [commentaireCopie, setCommentaireCopie] = useState(false)
  const [pret, setPret] = useState(false)
  const canvasRef = useRef(null)

  const lien = typeof window !== 'undefined' ? `${window.location.origin}/${CHEMIN_PAR_TYPE[type]}/${slug}` : ''
  const legende = genererLegende({ type, titre, resume, genre, region, tranche_age, chapitreLabel, texteBrut, texteComplet })
  const commentaire = chapitreLabel
    ? `📖 L'histoire complète est juste ici, en accès libre :\n${lien}`
    : `📖 À lire directement ici :\n${lien}`

  useEffect(() => {
    if (!ouvert || !canvasRef.current) return
    setPret(false)
    genererVisuelPartage(canvasRef.current, { type, titre, genre, couvertureUrl, chapitreLabel }).then(() => setPret(true))
  }, [ouvert, type, titre, genre, couvertureUrl, chapitreLabel])

  async function copier() {
    try {
      await navigator.clipboard.writeText(legende)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // le texte reste sélectionnable manuellement dans le champ
    }
  }

  async function copierCommentaire() {
    try {
      await navigator.clipboard.writeText(commentaire)
      setCommentaireCopie(true)
      setTimeout(() => setCommentaireCopie(false), 2000)
    } catch {
      // rien de bloquant
    }
  }

  function telecharger() {
    telechargerCanvas(canvasRef.current, `encre-${slug}${chapitreLabel ? '-' + chapitreLabel.toLowerCase().replace(/\s+/g, '-') : ''}.jpg`)
  }

  return (
    <div className="shrink-0">
      <button
        onClick={() => setOuvert((v) => !v)}
        className={compact ? 'text-papier/40 hover:text-or transition-colors' : 'text-papier/50 hover:text-or transition-colors'}
        title="Partager sur Facebook/Instagram"
      >
        {compact ? '🔗' : 'Partager'}
      </button>
      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setOuvert(false)}>
          <div
            className="bg-encreClair border border-ligne rounded-lg p-4 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs uppercase tracking-wide text-papier/40">
              Visuel {chapitreLabel ? `— ${chapitreLabel}` : ''}
            </p>
            <div className="rounded-md overflow-hidden border border-ligne bg-encre aspect-[4/5] relative">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              {!pret && (
                <div className="absolute inset-0 flex items-center justify-center text-papier/30 text-xs font-mono">
                  Génération…
                </div>
              )}
            </div>
            <button
              onClick={telecharger}
              disabled={!pret}
              className="w-full text-sm border border-or/40 text-or rounded-full py-2 disabled:opacity-40"
            >
              Télécharger le visuel
            </button>

            {chapitreLabel && texteBrut && (
              <div className="flex rounded-full border border-ligne p-0.5 text-xs font-mono">
                <button
                  onClick={() => setTexteComplet(false)}
                  className={`flex-1 rounded-full py-1.5 transition-colors ${!texteComplet ? 'bg-or text-encre' : 'text-papier/50'}`}
                >
                  Extrait
                </button>
                <button
                  onClick={() => setTexteComplet(true)}
                  className={`flex-1 rounded-full py-1.5 transition-colors ${texteComplet ? 'bg-or text-encre' : 'text-papier/50'}`}
                >
                  Texte complet
                </button>
              </div>
            )}
            {texteComplet && (
              <p className="text-[0.7rem] text-papier/40 leading-relaxed -mt-1">
                Pensé pour un post long directement sur ton feed — certains lecteurs préfèrent lire comme ça sur Facebook.
              </p>
            )}

            <p className="font-mono text-xs uppercase tracking-wide text-papier/40 pt-1">Texte du post</p>
            <textarea
              readOnly
              value={legende}
              rows={texteComplet ? 14 : 7}
              className="w-full bg-encre border border-ligne rounded-md p-3 text-sm text-papier/80 font-sans resize-none"
              onFocus={(e) => e.target.select()}
            />
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => setOuvert(false)} className="text-xs font-mono text-papier/40 hover:text-papier/70 px-2 py-1.5">
                Fermer
              </button>
              <button onClick={copier} className="text-xs font-mono border border-or/40 text-or rounded-full px-3 py-1.5">
                {copie ? 'Copié ✓' : 'Copier le texte du post'}
              </button>
            </div>

            <p className="font-mono text-xs uppercase tracking-wide text-papier/40 pt-2">
              Commentaire — à poster juste après, en 1er commentaire
            </p>
            <textarea
              readOnly
              value={commentaire}
              rows={2}
              className="w-full bg-encre border border-ligne rounded-md p-3 text-xs text-papier/70 font-sans resize-none"
              onFocus={(e) => e.target.select()}
            />
            <button onClick={copierCommentaire} className="w-full text-xs font-mono border border-or/40 text-or rounded-full py-2">
              {commentaireCopie ? 'Copié ✓' : 'Copier le commentaire'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
