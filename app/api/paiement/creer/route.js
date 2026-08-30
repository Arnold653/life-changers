import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Crée un déblocage "en_attente" pour un livre payant, un bonus, ou un pourboire libre — et
// renvoie tout ce dont le widget FedaPay a besoin côté client.
export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { livreId, pourboire, montant } = await request.json()

  if (!livreId) {
    return NextResponse.json({ error: 'Livre manquant' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Pourboire libre : montant choisi par le lecteur, ne débloque rien, ne vérifie aucun prix en base.
  if (pourboire) {
    const montantValide = Number.isInteger(montant) && montant >= 100 && montant <= 1000000
    if (!montantValide) {
      return NextResponse.json({ error: 'Montant invalide (minimum 100 FCFA)' }, { status: 400 })
    }
    const { data: livre } = await admin.from('livres').select('id, mode_monetisation').eq('id', livreId).single()
    if (!livre || livre.mode_monetisation !== 'pourboire') {
      return NextResponse.json({ error: "Ce livre n'accepte pas les pourboires" }, { status: 400 })
    }

    const { data: deblocage, error } = await admin
      .from('deblocages')
      .insert({ user_id: user.id, livre_id: livreId, montant_fcfa: montant, statut: 'en_attente', type: 'pourboire' })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: 'Erreur création du paiement' }, { status: 500 })

    return NextResponse.json({
      deblocageId: deblocage.id,
      montant,
      publicKey: process.env.FEDAPAY_PUBLIC_KEY,
      environment: process.env.FEDAPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
    })
  }

  // Achat (mode 'payant') ou bonus (mode 'bonus') — prix_fcfa fait foi, jamais un montant client.
  const { data: livre } = await admin.from('livres').select('id, prix_fcfa, mode_monetisation').eq('id', livreId).single()

  if (!livre) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }
  if (!['payant', 'bonus'].includes(livre.mode_monetisation)) {
    return NextResponse.json({ error: "Ce livre n'est pas payant" }, { status: 400 })
  }
  if (!livre.prix_fcfa || livre.prix_fcfa <= 0) {
    return NextResponse.json({ error: "Ce livre n'est pas payant" }, { status: 400 })
  }

  const { data: dejaDebloque } = await admin
    .from('deblocages')
    .select('id')
    .eq('user_id', user.id)
    .eq('livre_id', livreId)
    .eq('statut', 'reussi')
    .eq('type', 'deblocage')
    .maybeSingle()

  if (dejaDebloque) {
    return NextResponse.json({ error: 'Déjà débloqué' }, { status: 409 })
  }

  const { data: deblocage, error } = await admin
    .from('deblocages')
    .insert({
      user_id: user.id,
      livre_id: livreId,
      montant_fcfa: livre.prix_fcfa,
      statut: 'en_attente',
      type: 'deblocage',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erreur création du paiement' }, { status: 500 })
  }

  return NextResponse.json({
    deblocageId: deblocage.id,
    montant: livre.prix_fcfa,
    publicKey: process.env.FEDAPAY_PUBLIC_KEY,
    environment: process.env.FEDAPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
  })
}
