'use client'

import { useState } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

const MONTANTS_SUGGERES = [100, 250, 500, 1000]

// Le livre/conte est déjà gratuit et le reste — ce bouton ne débloque rien, c'est un pur soutien à
// l'auteur, montant choisi librement par le lecteur. Une seule des trois props doit être fournie.
export default function BoutonPourboire({ livreId }) {
  const [montant, setMontant] = useState(250)
  const [montantPerso, setMontantPerso] = useState('')
  const [statut, setStatut] = useState('repos') // repos | ouverture | verification | merci | erreur
  const [scriptPret, setScriptPret] = useState(false)

  const montantFinal = montantPerso ? parseInt(montantPerso, 10) : montant

  async function confirmer(deblocageId, transactionId) {
    setStatut('verification')
    try {
      const res = await fetch('/api/paiement/confirmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deblocageId, transactionId }),
      })
      if (!res.ok) throw new Error('echec')
      setStatut('merci')
    } catch {
      setStatut('erreur')
    }
  }

  async function envoyer() {
    if (!scriptPret || typeof window === 'undefined' || !window.FedaPay) return
    if (!montantFinal || montantFinal < 100) {
      setStatut('erreur')
      return
    }
    setStatut('ouverture')
    try {
      const res = await fetch('/api/paiement/creer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livreId, pourboire: true, montant: montantFinal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'echec')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const widget = window.FedaPay.init({
        public_key: data.publicKey,
        environment: data.environment,
        transaction: {
          amount: data.montant,
          description: 'Pourboire sur Life Changers',
          custom_metadata: { deblocageId: data.deblocageId },
        },
        customer: { email: user?.email || 'lecteur@lifechangers.app', lastname: 'Lecteur' },
        onComplete: (reponse) => {
          if (reponse?.transaction?.status === 'approved') {
            confirmer(data.deblocageId, reponse.transaction.id)
          } else {
            setStatut('erreur')
          }
        },
      })
      widget.open()
      setStatut('repos')
    } catch {
      setStatut('erreur')
    }
  }

  if (statut === 'merci') {
    return (
      <div className="border border-or/30 rounded-2xl p-8 text-center my-10">
        <p className="text-papier/80">Merci pour ton soutien 🙏</p>
      </div>
    )
  }

  return (
    <div className="border border-ligne rounded-2xl p-8 text-center my-10">
      <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="afterInteractive" onLoad={() => setScriptPret(true)} />
      <p className="font-mono text-xs uppercase tracking-widest text-papier/40 mb-3">Ce livre est gratuit</p>
      <p className="text-papier/60 mb-6">Si vous l'avez aimé, vous pouvez soutenir l'auteur.</p>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {MONTANTS_SUGGERES.map((m) => (
          <button
            key={m}
            onClick={() => { setMontant(m); setMontantPerso('') }}
            className={`font-mono text-xs rounded-full px-3 py-2 border transition-colors ${
              !montantPerso && montant === m ? 'border-or text-or' : 'border-papier/15 text-papier/40 hover:border-papier/35'
            }`}
          >
            {m} FCFA
          </button>
        ))}
        <input
          type="number"
          min="100"
          placeholder="Autre"
          value={montantPerso}
          onChange={(e) => setMontantPerso(e.target.value)}
          className="w-24 bg-encreClair border border-ligne rounded-full px-3 py-2 text-papier text-xs text-center focus:outline-none focus:border-or"
        />
      </div>

      <button
        onClick={envoyer}
        disabled={statut === 'ouverture' || statut === 'verification'}
        className="font-mono text-sm uppercase tracking-widest bg-or text-encre rounded-full px-6 py-3 disabled:opacity-50 transition-opacity"
      >
        {statut === 'verification' ? 'Vérification…' : `Envoyer ${montantFinal || 0} FCFA`}
      </button>
      {statut === 'erreur' && (
        <p className="text-grenat text-sm mt-4">Le paiement n'a pas abouti. Réessayez.</p>
      )}
    </div>
  )
}
