import { createAdminClient } from '@/lib/supabase/admin'
import { verifierSignatureWebhook } from '@/lib/fedapay'
import { NextResponse } from 'next/server'

// Webhook appelé par FedaPay (à configurer dans Workbench → Webhooks avec cette URL).
// C'est le filet de sécurité : si le lecteur ferme son navigateur juste après avoir payé,
// avant que /api/paiement/confirmer n'ait pu partir, c'est ce webhook qui débloque quand même.
// On identifie le déblocage via `custom_metadata.deblocageId`, passé à FedaPay.init côté client
// (voir components/BoutonDeblocage.js) — c'est l'id de la ligne `deblocages`.
export async function POST(request) {
  const payloadBrut = await request.text()
  const signature = request.headers.get('x-fedapay-signature')

  let event
  try {
    event = verifierSignatureWebhook(payloadBrut, signature)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  const transaction = event?.entity
  const deblocageId = transaction?.custom_metadata?.deblocageId

  if (!deblocageId || !['transaction.approved', 'transaction.canceled', 'transaction.declined'].includes(event?.name)) {
    // Rien à rapprocher — on répond 200 quand même pour éviter que FedaPay ne réessaie en boucle.
    return NextResponse.json({ ok: true, ignore: true })
  }

  const admin = createAdminClient()

  const { data: deblocage } = await admin
    .from('deblocages')
    .select('id, montant_fcfa, statut')
    .eq('id', deblocageId)
    .maybeSingle()

  if (!deblocage || deblocage.statut !== 'en_attente') {
    return NextResponse.json({ ok: true, ignore: true })
  }

  const paiementValide = event.name === 'transaction.approved' && Number(transaction.amount) === deblocage.montant_fcfa

  await admin
    .from('deblocages')
    .update({ statut: paiementValide ? 'reussi' : 'echoue', transaction_id: String(transaction.id) })
    .eq('id', deblocageId)
    .eq('statut', 'en_attente')

  return NextResponse.json({ ok: true })
}
