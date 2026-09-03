import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && user.email === process.env.ADMIN_EMAIL
}

// Génère une URL de televersement signée pour le bucket privé 'livres' : le fichier part
// directement du navigateur vers Supabase Storage, sans transiter par cette fonction Vercel.
// Nécessaire car les routes API (fonctions serverless Vercel) ont une limite de taille de
// requête d'environ 4,5 Mo — bloquant pour un PDF ou EPUB volumineux. Au-delà, Vercel renvoie
// une page d'erreur texte au lieu de JSON, d'où le "Unexpected token 'R', Request En..." côté
// admin. Ici on ne fait que générer un chemin + jeton, jamais transiter les octets du fichier.
export async function POST(request) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { slug, extension } = await request.json()
  if (!slug || !extension) {
    return NextResponse.json({ error: 'slug et extension requis' }, { status: 400 })
  }

  const admin = createAdminClient()
  const chemin = `${slug}-${Date.now()}.${extension}`
  const { data, error } = await admin.storage.from('livres').createSignedUploadUrl(chemin)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ chemin, token: data.token })
}
