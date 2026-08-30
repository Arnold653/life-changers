// Le bucket de stockage 'livres' est privé : la colonne livres.fichier_url ne contient qu'un
// CHEMIN d'objet (ex. "mon-livre-172839.pdf"), jamais une URL directement accessible. Toute
// lecture ou téléchargement doit passer par une URL signée générée ici, côté serveur, après
// vérification de l'achat — jamais exposée sans ce contrôle.

const DUREE_LECTURE = 60 * 60 // 1h, largement suffisant pour charger/lire un livre
const DUREE_TELECHARGEMENT = 60 // 1 minute, juste le temps de démarrer le téléchargement

export async function urlSigneeLecture(admin, cheminFichier) {
  const { data, error } = await admin.storage.from('livres').createSignedUrl(cheminFichier, DUREE_LECTURE)
  if (error) throw error
  return data.signedUrl
}

export async function urlSigneeTelechargement(admin, cheminFichier, nomTelecharge) {
  const { data, error } = await admin.storage
    .from('livres')
    .createSignedUrl(cheminFichier, DUREE_TELECHARGEMENT, { download: nomTelecharge || true })
  if (error) throw error
  return data.signedUrl
}
