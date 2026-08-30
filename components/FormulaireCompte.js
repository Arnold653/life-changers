'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FormulaireCompte({ pseudoInitial }) {
  const supabase = createClient()
  const [pseudo, setPseudo] = useState(pseudoInitial)
  const [statutPseudo, setStatutPseudo] = useState('repos') // repos | enregistrement | ok | erreur

  const [nouveauMdp, setNouveauMdp] = useState('')
  const [statutMdp, setStatutMdp] = useState('repos')

  async function enregistrerPseudo(e) {
    e.preventDefault()
    if (!pseudo.trim()) return
    setStatutPseudo('enregistrement')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ pseudo: pseudo.trim() }).eq('id', user.id)
    setStatutPseudo(error ? 'erreur' : 'ok')
  }

  async function changerMotDePasse(e) {
    e.preventDefault()
    if (nouveauMdp.length < 6) {
      setStatutMdp('erreur')
      return
    }
    setStatutMdp('enregistrement')
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp })
    setStatutMdp(error ? 'erreur' : 'ok')
    if (!error) setNouveauMdp('')
  }

  return (
    <div className="space-y-8">
      <form onSubmit={enregistrerPseudo}>
        <label className="block font-mono text-[0.65rem] uppercase tracking-widest text-papier/40 mb-2">
          Nom affiché
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pseudo}
            onChange={(e) => { setPseudo(e.target.value); setStatutPseudo('repos') }}
            className="flex-1 bg-encreClair border border-ligne rounded-full px-4 py-2.5 text-papier focus:outline-none focus:border-or"
            maxLength={40}
          />
          <button
            type="submit"
            disabled={statutPseudo === 'enregistrement'}
            className="font-mono text-xs uppercase tracking-wide bg-or text-encre rounded-full px-5 disabled:opacity-50"
          >
            {statutPseudo === 'enregistrement' ? '…' : 'Enregistrer'}
          </button>
        </div>
        {statutPseudo === 'ok' && <p className="text-or text-xs mt-2">Enregistré.</p>}
        {statutPseudo === 'erreur' && <p className="text-grenat text-xs mt-2">Ce nom est peut-être déjà pris.</p>}
      </form>

      <form onSubmit={changerMotDePasse}>
        <label className="block font-mono text-[0.65rem] uppercase tracking-widest text-papier/40 mb-2">
          Nouveau mot de passe
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={nouveauMdp}
            onChange={(e) => { setNouveauMdp(e.target.value); setStatutMdp('repos') }}
            placeholder="Minimum 6 caractères"
            className="flex-1 bg-encreClair border border-ligne rounded-full px-4 py-2.5 text-papier focus:outline-none focus:border-or"
          />
          <button
            type="submit"
            disabled={statutMdp === 'enregistrement'}
            className="font-mono text-xs uppercase tracking-wide border border-papier/20 text-papier rounded-full px-5 hover:border-or hover:text-or transition-colors disabled:opacity-50"
          >
            {statutMdp === 'enregistrement' ? '…' : 'Changer'}
          </button>
        </div>
        {statutMdp === 'ok' && <p className="text-or text-xs mt-2">Mot de passe mis à jour.</p>}
        {statutMdp === 'erreur' && <p className="text-grenat text-xs mt-2">Minimum 6 caractères.</p>}
      </form>
    </div>
  )
}
