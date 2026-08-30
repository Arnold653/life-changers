import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { urlSigneeTelechargement } from '@/lib/fichiersLivres'
import { NextResponse } from 'next/server'

// Revérifie l'accès EXACTEMENT comme la page de lecture (jamais confiance dans le fait que le
// client soit arrivé jusqu'ici légitimement) avant de générer une URL signée de téléchargement.
export async function GET(request, { params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const admin = createAdminClient()
  const { data: livre } = await admin.from('livres').select('*').eq('slug', params.slug).single()
  if (!livre) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const estAdmin = user.email === process.env.ADMIN_EMAIL

  if (!estAdmin) {
    if (livre.mode_monetisation === 'gratuit') {
      return NextResponse.json({ error: 'Le téléchargement n\'est pas proposé pour ce livre.' }, { status: 403 })
    }

    if (livre.mode_monetisation === 'payant' || livre.mode_monetisation === 'bonus') {
      const { data: deblocage } = await admin
        .from('deblocages')
        .select('id')
        .eq('user_id', user.id)
        .eq('livre_id', livre.id)
        .eq('statut', 'reussi')
        .eq('type', 'deblocage')
        .maybeSingle()
      if (!deblocage) return NextResponse.json({ error: 'Ce livre doit être acheté avant téléchargement.' }, { status: 403 })
    }

    if (livre.mode_monetisation === 'pourboire') {
      const { data: pourboire } = await admin
        .from('deblocages')
        .select('id')
        .eq('user_id', user.id)
        .eq('livre_id', livre.id)
        .eq('statut', 'reussi')
        .eq('type', 'pourboire')
        .maybeSingle()
      if (!pourboire) return NextResponse.json({ error: 'Le téléchargement est réservé à ceux qui laissent un pourboire.' }, { status: 403 })
    }
  }

  try {
    const nomFichier = `${livre.slug}.${livre.fichier_type || 'pdf'}`
    const url = await urlSigneeTelechargement(admin, livre.fichier_url, nomFichier)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Téléchargement indisponible pour le moment.' }, { status: 500 })
  }
}
