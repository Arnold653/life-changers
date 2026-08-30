'use client'

import { useState } from 'react'

// N'affiche que ce bouton : le contrôle d'accès réel se fait côté serveur dans la route
// /api/livres/[slug]/telecharger (vérifie l'achat avant de générer l'URL signée).
export default function BoutonTelecharger({ slug }) {
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function telecharger() {
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch(`/api/livres/${slug}/telecharger`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErreur(data.error || 'Téléchargement impossible.')
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setErreur('Téléchargement impossible.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div>
      <button
        onClick={telecharger}
        disabled={chargement}
        className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-papier border border-ligne rounded-full px-4 py-2 hover:border-or hover:text-or transition-colors disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {chargement ? 'Préparation...' : 'Télécharger le PDF'}
      </button>
      {erreur && <p className="text-grenat text-xs font-mono mt-2">{erreur}</p>}
    </div>
  )
}
