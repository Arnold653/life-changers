import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function verifierAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && user.email === process.env.ADMIN_EMAIL
}

// Pendant du /api/livres/[slug]/image public, mais côté admin : pas de restriction "déjà mis
// en cache" puisque c'est l'admin qui déclenche l'extraction, une seule fois, avant même que
// le livre existe en base (on utilise le slug prévu comme chemin de stockage).
export async function POST(request) {
  if (!(await verifierAdmin())) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  if (!body?.dataUrl || !body?.nom || !body?.slug) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const admin = createAdminClient()
  const base64 = body.dataUrl.split(',')[1] || ''
  const bytes = Buffer.from(base64, 'base64')
  const chemin = `${body.slug}/images/${body.nom}.jpg`

  // Bucket 'illustrations' : PUBLIC, volontairement distinct du bucket privé 'livres' (celui du
  // fichier source protégé). Une image isolée à l'intérieur du texte n'a pas de valeur de
  // lecture par elle-même (contrairement au fichier entier) et doit rester accessible sans
  // expiration pour que la lecture hors-ligne (page mise en cache) continue de l'afficher des
  // mois plus tard — une URL signée expirerait bien avant.
  const { error: erreurUpload } = await admin.storage.from('illustrations').upload(chemin, bytes, { contentType: 'image/jpeg', upsert: true })
  if (erreurUpload) return NextResponse.json({ error: erreurUpload.message }, { status: 400 })

  const { data: urlPublique } = admin.storage.from('illustrations').getPublicUrl(chemin)
  return NextResponse.json({ url: urlPublique.publicUrl })
}
