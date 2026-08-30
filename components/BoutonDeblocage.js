'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

// Paywall pour un chapitre ou un livre payant. Affiche le prix + un bouton qui ouvre le widget
// FedaPay ; au succès, confirme côté serveur puis rafraîchit la page pour révéler le contenu
// (le contenu verrouillé n'est de toute façon jamais envoyé au navigateur avant déblocage).
export default function BoutonDeblocage({ livreId, prixFcfa, libelle }) {
  const router = useRouter()
  const [statut, setStatut] = useState('repos') // repos | ouverture | verification | erreur
  const [scriptPret, setScriptPret] = useState(false)

  async function confirmer(deblocageId, transactionId) {
    setStatut('verification')
    try {
      const res = await fetch('/api/paiement/confirmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deblocageId, transactionId }),
      })
      if (!res.ok) throw new Error('echec')
      router.refresh()
      setStatut('repos')
    } catch {
      setStatut('erreur')
    }
  }

  async function payer() {
    if (!scriptPret || typeof window === 'undefined' || !window.FedaPay) return
    setStatut('ouverture')
    try {
      const res = await fetch('/api/paiement/creer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livreId }),
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
          description: libelle || 'Achat sur Life Changers',
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

  return (
    <div className="border border-ligne rounded-2xl p-8 text-center my-10">
      <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="afterInteractive" onLoad={() => setScriptPret(true)} />
      <p className="font-mono text-xs uppercase tracking-widest text-papier/40 mb-3">Contenu verrouillé</p>
      <p className="text-papier/60 mb-2">Débloquez {libelle || 'ce livre'} pour y accéder.</p>
      <button
        onClick={payer}
        disabled={statut === 'ouverture' || statut === 'verification'}
        className="font-mono text-sm uppercase tracking-widest bg-or text-encre rounded-full px-6 py-3 disabled:opacity-50 transition-opacity"
      >
        {statut === 'verification' ? 'Vérification…' : `Débloquer — ${prixFcfa.toLocaleString('fr-FR')} FCFA`}
      </button>
      {statut === 'erreur' && (
        <p className="text-grenat text-sm mt-4">Le paiement n'a pas abouti. Réessayez.</p>
      )}
    </div>
  )
}
