import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormulaireCompte from '@/components/FormulaireCompte'

export default async function CompteePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?suite=/compte')

  const { data: profil } = await supabase.from('profiles').select('pseudo, bio, avatar_url').eq('id', user.id).single()

  const [{ count: nbAchats }, { count: nbFavoris }] = await Promise.all([
    supabase.from('deblocages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('statut', 'reussi').eq('type', 'deblocage'),
    supabase.from('favoris').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <div className="px-6 pt-16 pb-24 max-w-xl mx-auto lever">
      <h1 className="font-display text-4xl text-papier mb-3">Mon compte</h1>
      <p className="text-papier/50 mb-12">{user.email}</p>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="border border-ligne rounded-2xl p-4">
          <p className="font-display text-3xl text-papier">{nbAchats || 0}</p>
          <p className="text-papier/40 text-xs font-mono uppercase tracking-wide mt-1">Livres achetés</p>
        </div>
        <div className="border border-ligne rounded-2xl p-4">
          <p className="font-display text-3xl text-papier">{nbFavoris || 0}</p>
          <p className="text-papier/40 text-xs font-mono uppercase tracking-wide mt-1">Favoris</p>
        </div>
      </div>

      <FormulaireCompte pseudoInitial={profil?.pseudo || ''} bioInitiale={profil?.bio || ''} avatarUrlInitiale={profil?.avatar_url || ''} />

      <a href="/bibliotheque" className="block text-center border border-ligne rounded-full px-4 py-3 mt-4 text-papier/70 hover:border-or hover:text-or transition-colors">
        Voir ma bibliothèque
      </a>
    </div>
  )
}
