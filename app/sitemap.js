import { createAdminClient } from '@/lib/supabase/admin'

const BASE = 'https://life-changers.vercel.app'

export default async function sitemap() {
  const admin = createAdminClient()
  const { data: livres } = await admin.from('livres').select('slug, updated_at').eq('statut', 'publie')

  const pagesStatiques = ['', '/login'].map((chemin) => ({
    url: `${BASE}${chemin}`,
    changeFrequency: 'daily',
    priority: chemin === '' ? 1 : 0.7,
  }))

  const versLivres = (livres || []).map((item) => ({
    url: `${BASE}/livres/${item.slug}`,
    lastModified: item.updated_at || undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...pagesStatiques, ...versLivres]
}
