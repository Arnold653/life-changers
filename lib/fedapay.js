import { FedaPay, Transaction, Webhook } from 'fedapay'

// Client serveur FedaPay. À utiliser UNIQUEMENT dans des routes API (jamais côté navigateur) —
// il embarque la clé secrète, qui permet de consulter des transactions sur le compte.
function configurer() {
  FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY)
  FedaPay.setEnvironment(process.env.FEDAPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox')
}

// Vérifie une transaction directement auprès de FedaPay (jamais faire confiance au montant/statut
// renvoyé par le navigateur ou par le corps du webhook sans cette vérification serveur-à-serveur).
// Retourne { reussi, montant, statutBrut } ou lève une erreur si l'appel échoue.
export async function verifierTransaction(transactionId) {
  configurer()
  const transaction = await Transaction.retrieve(transactionId)

  return {
    reussi: transaction.wasPaid(),
    montant: Number(transaction.amount ?? 0),
    statutBrut: transaction.status,
    brut: transaction,
  }
}

// Vérifie la signature du webhook (header X-FEDAPAY-SIGNATURE) et retourne l'évènement décodé,
// ou lève une erreur si la signature ne correspond pas au secret configuré.
export function verifierSignatureWebhook(payloadBrut, signature) {
  return Webhook.constructEvent(payloadBrut, signature, process.env.FEDAPAY_WEBHOOK_SECRET)
}
