'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FormulaireCompte({ pseudoInitial, bioInitiale, avatarUrlInitiale }) {
  const supabase = createClient()
  const fileInputRef = useRef(null)

  const [avatarUrl, setAvatarUrl] = useState(avatarUrlInitiale)
  const [statutAvatar, setStatutAvatar] = useState('repos') // repos | envoi | erreur

  const [pseudo, setPseudo] = useState(pseudoInitial)
  const [bio, setBio] = useState(bioInitiale || '')
  const [statutProfil, setStatutProfil] = useState('repos')

  const [nouveauMdp, setNouveauMdp] = useState('')
  const [statutMdp, setStatutMdp] = useState('repos')

  async function changerAvatar(e) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    if (fichier.size > 4 * 1024 * 1024) {
      setStatutAvatar('erreur')
      return
    }
    setStatutAvatar('envoi')

    const { data: { user } } = await supabase.auth.getUser()
    const extension = fichier.name.split('.').pop()
    const chemin = `${user.id}/avatar.${extension}`

    const { error: erreurUpload } = await supabase.storage.from('avatars').upload(chemin, fichier, { upsert: true })
    if (erreurUpload) {
      setStatutAvatar('erreur')
      return
    }

    const { data: urlPublique } = supabase.storage.from('avatars').getPublicUrl(chemin)
    const urlAvecCache = `${urlPublique.publicUrl}?t=${Date.now()}`

    const { error: erreurProfil } = await supabase.from('profiles').update({ avatar_url: urlAvecCache }).eq('id', user.id)
    if (erreurProfil) {
      setStatutAvatar('erreur')
      return
    }

    setAvatarUrl(urlAvecCache)
    setStatutAvatar('repos')
  }

  async function enregistrerProfil(e) {
    e.preventDefault()
    if (!pseudo.trim()) return
    setStatutProfil('enregistrement')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ pseudo: pseudo.trim(), bio: bio.trim() || null }).eq('id', user.id)
    setStatutProfil(error ? 'erreur' : 'ok')
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

  const initiale = (pseudo || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      {/* Photo de profil */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 bg-encreClair border border-ligne flex items-center justify-center group"
        >
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-bold text-2xl text-papier/30">{initiale}</span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[0.6rem] font-mono uppercase">{statutAvatar === 'envoi' ? '…' : 'Changer'}</span>
          </div>
        </button>
        <div>
          <p className="text-papier text-sm font-medium">Photo de profil</p>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-or text-xs font-mono uppercase tracking-wide hover:underline">
            {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          {statutAvatar === 'erreur' && <p className="text-grenat text-xs mt-1">Image trop lourde (max 4 Mo) ou erreur d'envoi.</p>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={changerAvatar} className="hidden" />
      </div>

      <form onSubmit={enregistrerProfil} className="space-y-4">
        <div>
          <label className="block font-mono text-[0.65rem] uppercase tracking-widest text-papier/40 mb-2">
            Nom affiché
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => { setPseudo(e.target.value); setStatutProfil('repos') }}
            className="w-full bg-encreClair border border-ligne rounded-full px-4 py-2.5 text-papier focus:outline-none focus:border-or"
            maxLength={40}
          />
        </div>

        <div>
          <label className="block font-mono text-[0.65rem] uppercase tracking-widest text-papier/40 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); setStatutProfil('repos') }}
            placeholder="Quelques mots sur toi..."
            rows={3}
            maxLength={280}
            className="w-full bg-encreClair border border-ligne rounded-2xl px-4 py-3 text-papier placeholder:text-papier/30 focus:outline-none focus:border-or resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={statutProfil === 'enregistrement'}
          className="font-mono text-xs uppercase tracking-wide bg-or text-encre rounded-full px-5 py-2.5 disabled:opacity-50"
        >
          {statutProfil === 'enregistrement' ? '…' : 'Enregistrer'}
        </button>
        {statutProfil === 'ok' && <p className="text-or text-xs">Profil mis à jour.</p>}
        {statutProfil === 'erreur' && <p className="text-grenat text-xs">Ce nom est peut-être déjà pris.</p>}
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
