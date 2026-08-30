import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminDashboard() {
  const admin = createAdminClient()
  const { data: livres } = await admin.from('livres').select('statut, mode_monetisation')

  const total = livres?.length || 0
  const publies = livres?.filter((l) => l.statut === 'publie').length || 0
  const payants = livres?.filter((l) => ['payant', 'bonus'].includes(l.mode_monetisation)).length || 0

  return (
    <div className="px-6 pt-16 pb-24 max-w-2xl mx-auto lever">
      <h1 className="font-display text-4xl text-papier mb-10">Administration</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          ['Livres au catalogue', total],
          ['Publiés', publies],
          ['Payants / bonus', payants],
        ].map(([label, valeur]) => (
          <div key={label} className="border border-ligne rounded-2xl p-4">
            <p className="font-display text-3xl text-papier">{valeur}</p>
            <p className="text-papier/40 text-xs font-mono uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      <a
        href="/admin/livres"
        className="block w-full text-center bg-or text-encre rounded-full px-4 py-3.5 font-medium hover:brightness-110 transition-all"
      >
        Gérer les livres
      </a>
    </div>
  )
}
