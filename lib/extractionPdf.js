// Extraction du texte, des images et des tableaux d'un PDF, structurés en sections de lecture.
// Utilisé à la fois par l'admin (à l'upload, une seule fois) et par le lecteur public (pour les
// livres plus anciens pas encore passés par le nouveau flux d'upload).
import { niveauTitre, decouperEnSections, ressembleACitationAutonome } from './extractionCommune'

// Un nom de police interne à un PDF ("BAAAAA+DejaVuSerif-Bold") indique le gras dans son nom
// dans l'écrasante majorité des cas — y compris les sous-titres embarqués dans une police
// à peine plus grande que le corps (voir estGras) que la seule taille ne suffit pas à repérer.
function estGras(page, fontName) {
  try {
    const fontObj = page.commonObjs.get(fontName)
    if (!fontObj) return false
    if (fontObj.bold) return true
    const nom = fontObj.name || fontObj.fallbackName || ''
    return /bold|black|heavy|semibold/i.test(nom)
  } catch {
    return false
  }
}

function estItalique(page, fontName) {
  try {
    const fontObj = page.commonObjs.get(fontName)
    if (!fontObj) return false
    if (fontObj.italic) return true
    const nom = fontObj.name || fontObj.fallbackName || ''
    return /italic|oblique/i.test(nom)
  } catch {
    return false
  }
}

function extraireLignes(items, page) {
  if (!items.length) return []

  const seuilMemeLigne = 2
  const lignesTmp = []
  for (const item of items) {
    const y = item.transform[5]
    const x = item.transform[4]
    const taille = Math.abs(item.transform[3]) || item.height || 10
    const gras = !!(item.str.trim() && page && estGras(page, item.fontName))
    const italique = !!(item.str.trim() && page && estItalique(page, item.fontName))
    let ligne = lignesTmp.find((l) => Math.abs(l.y - y) < seuilMemeLigne)
    if (!ligne) {
      ligne = { y, morceaux: [], tailles: [], caracteresGras: 0, caracteresTotal: 0 }
      lignesTmp.push(ligne)
    }
    ligne.morceaux.push({ x, texte: item.str, largeur: item.width || 0, gras, italique })
    if (item.str.trim()) {
      ligne.tailles.push(taille)
      const nbCar = item.str.trim().length
      ligne.caracteresTotal += nbCar
      if (gras) ligne.caracteresGras += nbCar
    }
  }

  lignesTmp.sort((a, b) => b.y - a.y)

  // État porté sur TOUTE LA PAGE (pas remis à zéro à chaque ligne) : une emphase en gras ou en
  // italique qui continue au-delà d'un simple retour à la ligne (très courant, une phrase mise
  // en avant tient rarement sur une seule ligne) ne doit pas se refermer puis se rouvrir à
  // chaque ligne — ça produirait des marqueurs ** collés (`** **`) que le rendu interpréterait
  // mal, perdant l'emphase de la suite du texte.
  let grasCourant = false
  let italiqueCourant = false

  const lignesFinales = lignesTmp.map((l) => {
    l.morceaux.sort((a, b) => a.x - b.x)
    const taille = l.tailles.length ? l.tailles.reduce((a, b) => a + b, 0) / l.tailles.length : 10
    // Gras : la MAJORITÉ des caractères de la ligne, pas un seul mot en emphase au milieu
    // d'une phrase normale (fréquent dans le corps du texte et sans rapport avec un titre).
    const gras = l.caracteresTotal > 0 && l.caracteresGras / l.caracteresTotal > 0.7

    let texte = ''
    let finPrecedent = null
    for (const m of l.morceaux) {
      const espaceNecessaire = finPrecedent !== null && m.x - finPrecedent > 1 && texte && !texte.endsWith(' ') && !m.texte.startsWith(' ')
      // Une ligne ENTIÈREMENT en gras est un titre potentiel (géré par `gras` plus haut, pas
      // ici) : pas de marqueur inline dans ce cas, sinon le texte du titre contiendrait des **
      // littéraux. Seule une emphase PARTIELLE (une portion de ligne normale) est marquée.
      // Fermeture collée au texte qui se termine (avant l'espace) ; ouverture collée au texte
      // qui commence (après l'espace) — sinon le marqueur atterrit du mauvais côté du mot.
      if (!gras && m.texte.trim()) {
        if (grasCourant && !m.gras) { texte += '**'; grasCourant = false }
        if (italiqueCourant && !m.italique) { texte += '*'; italiqueCourant = false }
      }
      if (espaceNecessaire) texte += ' '
      if (!gras && m.texte.trim()) {
        if (!grasCourant && m.gras) { texte += '**'; grasCourant = true }
        if (!italiqueCourant && m.italique) { texte += '*'; italiqueCourant = true }
      }
      texte += m.texte
      finPrecedent = m.x + m.largeur
    }
    return { type: 'texte', y: l.y, texte: texte.trim().replace(/\s+/g, ' '), taille, gras, morceaux: l.morceaux }
  })

  // Referme un marqueur resté ouvert en toute fin de page (rare, évite un ** ou * orphelin).
  if (grasCourant || italiqueCourant) {
    for (let i = lignesFinales.length - 1; i >= 0; i--) {
      if (lignesFinales[i].texte) {
        lignesFinales[i].texte += (italiqueCourant ? '*' : '') + (grasCourant ? '**' : '')
        break
      }
    }
  }

  return lignesFinales
    .filter((l) => l.texte.length > 0)
    .filter((l) => !/^\d{1,4}$/.test(l.texte))
}

function decouperEnCellules(morceaux, seuil) {
  return decouperEnCellulesPos(morceaux, seuil).map((c) => c.texte)
}

// Comme decouperEnCellules, mais garde la position x0 de chaque cellule — nécessaire pour
// réaligner les cellules de plusieurs lignes sur les bonnes colonnes (voir construireTableau).
function decouperEnCellulesPos(morceaux, seuil) {
  if (!morceaux.length) return []
  const cellules = []
  let texte = morceaux[0].texte
  let x0 = morceaux[0].x
  let finPrecedent = morceaux[0].x + morceaux[0].largeur
  for (let i = 1; i < morceaux.length; i++) {
    const m = morceaux[i]
    if (m.x - finPrecedent > seuil) {
      cellules.push({ texte: texte.trim(), x0 })
      texte = m.texte
      x0 = m.x
    } else {
      texte += (m.x - finPrecedent > 1 && !texte.endsWith(' ') && !m.texte.startsWith(' ') ? ' ' : '') + m.texte
    }
    finPrecedent = m.x + m.largeur
  }
  cellules.push({ texte: texte.trim(), x0 })
  return cellules.filter((c) => c.texte)
}

function ressembleATableau(bloc, tailleCorps) {
  if (bloc.length < 2 || bloc.some((l) => l.type !== 'texte')) return false
  const seuil = tailleCorps * 1.5
  const comptes = bloc.map((l) => decouperEnCellules(l.morceaux, seuil).length)
  if (comptes.filter((c) => c >= 2).length / bloc.length < 0.7) return false
  const freq = {}
  comptes.forEach((c) => { freq[c] = (freq[c] || 0) + 1 })
  return Math.max(...Object.values(freq)) / bloc.length >= 0.6
}

// Reconstruit un tableau en RANGÉES logiques à partir d'un bloc déjà repéré comme tabulaire.
// Traiter naïvement "une ligne = une rangée" casse tout tableau dont une cellule déborde sur
// plusieurs lignes (très fréquent — une seule cellule un peu longue décale toutes les
// suivantes). On regroupe d'abord les lignes en rangées via le même écart adaptatif que pour
// les paragraphes (l'écart entre deux rangées y est nettement plus grand qu'entre deux lignes
// d'une même cellule qui déborde), puis on réaligne les cellules de chaque ligne sur les
// colonnes de référence — celles de la ligne du bloc qui compte le plus de cellules, en
// général l'en-tête — en comparant leur position x de départ.
function construireTableau(bloc, tailleCorps) {
  const seuil = tailleCorps * 1.5

  const ecarts = []
  for (let i = 1; i < bloc.length; i++) ecarts.push(bloc[i - 1].y - bloc[i].y)
  const frequence = {}
  for (const e of ecarts) { const a = Math.round(e); frequence[a] = (frequence[a] || 0) + 1 }
  let interligneNormal = 14
  let meilleurCompte = 0
  for (const cle of Object.keys(frequence)) {
    if (frequence[cle] > meilleurCompte) { meilleurCompte = frequence[cle]; interligneNormal = Number(cle) }
  }
  const seuilRangee = Math.max(interligneNormal * 1.12, interligneNormal + 3)

  const rangeesLignes = []
  let courante = [bloc[0]]
  for (let i = 1; i < bloc.length; i++) {
    const ecart = bloc[i - 1].y - bloc[i].y
    if (ecart > seuilRangee) { rangeesLignes.push(courante); courante = [bloc[i]] }
    else courante.push(bloc[i])
  }
  rangeesLignes.push(courante)

  const cellulesParLigne = bloc.map((l) => decouperEnCellulesPos(l.morceaux, seuil))
  let indexReference = 0
  for (let i = 1; i < bloc.length; i++) {
    if (cellulesParLigne[i].length > cellulesParLigne[indexReference].length) indexReference = i
  }
  const colonnesX = cellulesParLigne[indexReference].map((c) => c.x0)
  if (colonnesX.length === 0) return []

  const indexParLigne = new Map(bloc.map((l, i) => [l, i]))

  return rangeesLignes.map((lignesRangee) => {
    const cellulesRangee = colonnesX.map(() => [])
    for (const ligne of lignesRangee) {
      const idx = indexParLigne.get(ligne)
      for (const cellule of cellulesParLigne[idx]) {
        let meilleureColonne = 0
        let meilleureDistance = Infinity
        colonnesX.forEach((x, c) => {
          const d = Math.abs(cellule.x0 - x)
          if (d < meilleureDistance) { meilleureDistance = d; meilleureColonne = c }
        })
        cellulesRangee[meilleureColonne].push(cellule.texte)
      }
    }
    return cellulesRangee.map((morceaux) => morceaux.join(' '))
  })
}

function ressembleAUnTitre(texte, taille, tailleCorps, gras = false) {
  if (!texte || texte.length > 80) return false
  // Un vrai sous-titre est parfois à peine plus gros que le corps du texte (parfois pas du
  // tout) — c'est le GRAS qui le distingue visuellement, pas la taille. On exige alors une
  // marge de taille minimale (pour ne pas confondre avec un simple mot en emphase au milieu
  // d'une phrase normale), mais bien plus faible que pour un titre repéré par la taille seule.
  const grande = taille >= tailleCorps * 1.12 || (gras && taille >= tailleCorps * 1.02)
  const toutMajuscules = texte === texte.toUpperCase() && /[A-ZÀ-Ü]/.test(texte) && texte.length <= 70
  return grande || toutMajuscules
}

// Un bloc de plusieurs lignes peut être un titre qui a simplement été replié sur plusieurs
// lignes à cause d'une police plus grande (ex. le titre d'un chapitre sur 2-3 lignes) — on
// l'accepte si TOUTES ses lignes ont individuellement l'air d'un titre.
function blocRessembleAUnTitre(bloc, tailleCorps) {
  if (bloc.length < 1 || bloc.length > 4) return false
  return bloc.every((l) => ressembleAUnTitre(l.texte, l.taille, tailleCorps, l.gras))
}

// Variante de niveauTitre() qui sait qu'on est déjà sûr (grâce à la taille de police réelle du
// PDF) d'être face à un titre : contrairement à niveauTitre(), qui doit se méfier d'un chiffre
// romain isolé sur une ligne de texte brut (souvent une initiale), ici un simple "I" ou "V" en
// gros caractères, seul sur sa ligne, est bien un numéro de chapitre.
// Un PDF ne porte aucune balise de titre (contrairement à DOCX/EPUB) : la seule information
// disponible pour approximer la profondeur d'un sous-titre (3 à 6) est sa taille de police
// relative au corps de texte — plus c'est gros, plus c'est haut dans la hiérarchie. Forcément
// approximatif ; à ajuster si des livres réels donnent des paliers mal calés.
function niveauTitrePdf(texte, taille, tailleCorps) {
  const t = texte.trim()
  if (/^[ivxlcdm]{1,4}\s*[.\-–—:]?\s*$/i.test(t) || /^\d{1,4}\s*[.\-–—:]?\s*$/.test(t)) return 2
  const n = niveauTitre(t)
  if (n <= 2 || !taille || !tailleCorps) return n
  const ratio = taille / tailleCorps
  if (ratio >= 1.5) return 3
  if (ratio >= 1.35) return 4
  if (ratio >= 1.2) return 5
  return 6
}

function regrouperEnParagraphes(lignes, tailleCorps) {
  if (lignes.length === 0) return []

  const ecarts = []
  for (let i = 1; i < lignes.length; i++) ecarts.push(lignes[i - 1].y - lignes[i].y)

  // L'interligne "normal" (à l'intérieur d'un même paragraphe) varie très peu d'une ligne à
  // l'autre dans un PDF propre (souvent +/- 1px) — on le repère comme le MODE (valeur la plus
  // fréquente, arrondie au pixel) plutôt qu'un ratio fixe : le rapport entre l'écart d'un
  // paragraphe et l'interligne normal change d'un logiciel à l'autre (~1.24x observé sur un
  // export LibreOffice, ~1.4x sur un export Google Docs) — aucun multiplicateur unique ne colle
  // à tous, alors qu'un pourcentage de marge modeste au-dessus du mode fonctionne dans les deux cas.
  const frequence = {}
  for (const e of ecarts) {
    const arrondi = Math.round(e)
    frequence[arrondi] = (frequence[arrondi] || 0) + 1
  }
  let interligneNormal = 14
  let meilleurCompte = 0
  for (const cle of Object.keys(frequence)) {
    if (frequence[cle] > meilleurCompte) { meilleurCompte = frequence[cle]; interligneNormal = Number(cle) }
  }
  // +12% (plancher de 3px pour les très petites tailles de police) : nettement au-dessus du
  // bruit habituel entre lignes d'un même paragraphe (1-3% observés), nettement en-dessous du
  // plus petit écart de paragraphe réellement rencontré jusqu'ici (~24%).
  const seuilParagraphe = Math.max(interligneNormal * 1.12, interligneNormal + 3)

  const blocs = []
  let courant = [lignes[0]]
  for (let i = 1; i < lignes.length; i++) {
    const imagePresente = lignes[i].type === 'image' || lignes[i - 1].type === 'image'
    const ecart = lignes[i - 1].y - lignes[i].y
    if (imagePresente || ecart > seuilParagraphe) {
      blocs.push(courant)
      courant = [lignes[i]]
    } else {
      courant.push(lignes[i])
    }
  }
  blocs.push(courant)

  return blocs
    .map((bloc) => {
      if (bloc.length === 1 && bloc[0].type === 'image') {
        return { type: 'image', url: bloc[0].url, texte: '', titre: false, niveau: null }
      }
      if (ressembleATableau(bloc, tailleCorps)) {
        const lignesTableau = construireTableau(bloc, tailleCorps)
        return { type: 'tableau', lignes: lignesTableau, texte: '', titre: false, niveau: null }
      }
      const texte = bloc.map((l) => l.texte).join(' ').replace(/\s+/g, ' ').trim()
      const tailleMoyenne = bloc.reduce((a, l) => a + l.taille, 0) / bloc.length
      // "Page N" (storybooks) : repère purement textuel, pas forcément plus gros que le corps —
      // reconnu par son contenu, indépendamment de la taille de police (contrairement à
      // ressembleAUnTitre, qui ne juge que sur l'apparence visuelle).
      const estRepereDePage = bloc.length === 1 && /^page\s+\d{1,4}\s*$/i.test(texte)
      const titre = estRepereDePage || (bloc.length === 1 && ressembleAUnTitre(texte, tailleMoyenne, tailleCorps, bloc[0].gras)) || blocRessembleAUnTitre(bloc, tailleCorps)
      // Encadré : un fond coloré détecté (voir detecterCouleursFond) derrière la quasi-totalité
      // des lignes du bloc — un encart/citation mis en valeur visuellement dans le PDF d'origine,
      // qu'on reproduit à la lecture plutôt que de le laisser fondu dans le texte courant.
      const couleursBloc = bloc.map((l) => l.couleurFond).filter(Boolean)
      const encadre = !titre && couleursBloc.length >= bloc.length * 0.7 && new Set(couleursBloc).size === 1
      // Un PDF ne conserve pas l'info de style (italique, retrait) au niveau où on la lit ici,
      // donc pas de <blockquote> à détecter comme pour DOCX/EPUB — on retombe sur l'heuristique
      // guillemets + attribution, uniquement si le bloc n'a pas déjà été reconnu comme titre.
      const citation = !titre && !encadre && ressembleACitationAutonome(texte)
      return { type: 'texte', texte, titre, niveau: titre ? niveauTitrePdf(texte, tailleMoyenne, tailleCorps) : null, citation, encadre }
    })
    .filter((p) => p.type !== 'texte' || p.texte.length > 0)
}

function fusionnerPages(paragraphesParPage) {
  const finPhrase = /[.!?…»"'”)\]]\s*$/
  const resultat = []

  for (const page of paragraphesParPage) {
    for (const p of page) {
      const precedent = resultat[resultat.length - 1]
      const fusionnable =
        p.type === 'texte' && !p.titre && !p.citation && !p.encadre &&
        precedent?.type === 'texte' && !precedent.titre && !precedent.citation && !precedent.encadre &&
        !finPhrase.test(precedent.texte)
      if (fusionnable) {
        resultat[resultat.length - 1] = { ...precedent, texte: precedent.texte + ' ' + p.texte }
      } else {
        resultat.push(p)
      }
    }
  }
  return resultat
}

// Rend une page en canvas (une seule fois par page) — partagé entre extraireImagesPage (rogner
// les images) et detecterCouleursFond (échantillonner les couleurs derrière le texte), pour ne
// pas payer le coût du rendu deux fois.
async function rendrePage(page, echelle = 1.5) {
  const viewport = page.getViewport({ scale: echelle })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return { canvas, ctx, viewport }
}

async function extraireImagesPage(page, pdfjsLib, canvas, viewport) {
  const { OPS } = pdfjsLib

  const opList = await page.getOperatorList()

  function multiplier(m1, m2) {
    return [
      m1[0] * m2[0] + m1[1] * m2[2],
      m1[0] * m2[1] + m1[1] * m2[3],
      m1[2] * m2[0] + m1[3] * m2[2],
      m1[2] * m2[1] + m1[3] * m2[3],
      m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
      m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
    ]
  }

  let ctm = [1, 0, 0, 1, 0, 0]
  const pile = []
  const rectangles = []

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i]
    const args = opList.argsArray[i]
    if (fn === OPS.save) {
      pile.push(ctm)
    } else if (fn === OPS.restore) {
      ctm = pile.pop() || [1, 0, 0, 1, 0, 0]
    } else if (fn === OPS.transform) {
      ctm = multiplier(args, ctm)
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintImageMaskXObject) {
      const coins = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [
        ctm[0] * x + ctm[2] * y + ctm[4],
        ctm[1] * x + ctm[3] * y + ctm[5],
      ])
      const xs = coins.map((c) => c[0])
      const ys = coins.map((c) => c[1])
      rectangles.push({ xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) })
    }
  }

  const images = []
  for (const rect of rectangles) {
    const [px1, py1] = viewport.convertToViewportPoint(rect.xMin, rect.yMax)
    const [px2, py2] = viewport.convertToViewportPoint(rect.xMax, rect.yMin)
    const largeur = Math.round(px2 - px1)
    const hauteur = Math.round(py2 - py1)
    if (largeur < 40 || hauteur < 40) continue

    const decoupe = document.createElement('canvas')
    decoupe.width = largeur
    decoupe.height = hauteur
    decoupe.getContext('2d').drawImage(canvas, px1, py1, largeur, hauteur, 0, 0, largeur, hauteur)
    // ratioPage : fraction de la surface de la page occupée par cette image — sert à repérer une
    // image de couverture en pleine page (voir COUVERTURE_RATIO_MIN dans extrairePdfDepuisUrl).
    const ratioPage = (largeur * hauteur) / (viewport.width * viewport.height)
    images.push({ y: rect.yMin, dataUrl: decoupe.toDataURL('image/jpeg', 0.85), ratioPage })
  }

  return images
}

// Échantillonne, pour chaque ligne de texte, la couleur de fond juste à gauche de son premier
// mot (un peu avant le début du texte, mais dans la marge d'un éventuel encadré qui déborderait
// légèrement) — permet de repérer les encarts à fond coloré (citations mises en avant,
// exemples...) même si le PDF ne les distingue par aucune autre information que ce fond. Un
// fond quasi blanc est considéré comme "pas d'encadré" ; sinon, la couleur est quantifiée
// (tranches de 12) pour regrouper les lignes d'un même encart malgré l'anti-aliasing.
function detecterCouleursFond(lignes, ctx, viewport, canvas) {
  for (const ligne of lignes) {
    if (ligne.type !== 'texte' || !ligne.morceaux?.length) continue
    const xGauche = Math.min(...ligne.morceaux.map((m) => m.x))
    const [px, py] = viewport.convertToViewportPoint(xGauche - 10, ligne.y)
    const x = Math.round(px)
    const y = Math.round(py)
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    if (r > 246 && g > 246 && b > 246) continue
    ligne.couleurFond = `${Math.round(r / 12)}_${Math.round(g / 12)}_${Math.round(b / 12)}`
  }
}

// Reçoit une fonction de téléversement (nom, dataUrl) => url|null : permet à l'appelant de
// choisir où stocker les images (route publique pour le lecteur, route admin pour l'upload).
// Une image occupant au moins cette fraction de la page 1 est considérée comme LA couverture du
// livre plutôt qu'une illustration de contenu (les couvertures conçues en pleine page avoisinent
// en général 90-100% ; on descend jusqu'à 55% pour couvrir les mises en page avec une petite
// marge blanche autour de l'image).
// Une image occupant au moins cette fraction de la page 1 est considérée comme LA couverture du
// livre plutôt qu'une illustration de contenu. En pratique, les vraies couvertures ont souvent
// une marge blanche tout autour plutôt que d'être en plein bord (ratios réels observés : 0.40,
// 0.49, 0.58) — largement au-dessus d'une illustration de contenu classique (~0.20-0.25) mais
// nettement en-dessous des 0.55 utilisés initialement, qui ratait les couvertures avec marge.
const COUVERTURE_RATIO_MIN = 0.35

export async function extrairePdfDepuisUrl(url, televerserImage, onProgression) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`

  const doc = await pdfjsLib.getDocument(url).promise

  let couvertureDetectee = null
  const lignesParPage = []
  const toutesLesTailles = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const contenu = await page.getTextContent()
    const lignes = extraireLignes(contenu.items, page)

    if (televerserImage) {
      const { canvas, ctx, viewport } = await rendrePage(page)

      let images = await extraireImagesPage(page, pdfjsLib, canvas, viewport)

      // Page 1 seulement : si une image couvre l'essentiel de la page, c'est la couverture du
      // livre, pas une illustration de contenu — on la sort du flux de lecture (elle ne doit
      // pas réapparaître comme image "dans" le texte) et on la renvoie séparément pour que
      // l'appelant (admin) puisse l'utiliser comme couverture_url du livre.
      if (i === 1 && images.length > 0) {
        const plusGrande = images.reduce((a, b) => (b.ratioPage > a.ratioPage ? b : a))
        if (plusGrande.ratioPage >= COUVERTURE_RATIO_MIN) {
          couvertureDetectee = plusGrande.dataUrl
          images = images.filter((img) => img !== plusGrande)
        }
      }

      for (const img of images) {
        const nom = `p${i}-${Math.round(img.y)}-${Math.random().toString(36).slice(2, 7)}`
        const url2 = await televerserImage(nom, img.dataUrl)
        if (url2) lignes.push({ type: 'image', y: img.y, url: url2 })
      }
      lignes.sort((a, b) => b.y - a.y)

      detecterCouleursFond(lignes, ctx, viewport, canvas)
    }

    lignesParPage.push(lignes)
    for (const l of lignes) if (l.type === 'texte') toutesLesTailles.push(l.taille)
    onProgression?.(Math.round((i / doc.numPages) * 50))
  }

  const taillesTriees = [...toutesLesTailles].sort((a, b) => a - b)
  const tailleCorps = taillesTriees[Math.floor(taillesTriees.length / 2)] || 10

  const paragraphesParPage = lignesParPage.map((lignes, i) => {
    onProgression?.(50 + Math.round(((i + 1) / lignesParPage.length) * 50))
    return regrouperEnParagraphes(lignes, tailleCorps)
  })

  const paragraphesFusionnes = fusionnerPages(paragraphesParPage)

  // Repère un éventuel bloc de métadonnées technique en tête de document (genre, tranche
  // d'âge/région, résumé) — le pendant PDF de l'en-tête ".md" (cf. lib/parseEnTete.js), pour
  // les documents (notamment les storybooks assemblés en PDF) qui embarquent ces informations
  // en toutes lettres, écrites en petit sous le titre de couverture, plutôt que de les laisser
  // à ressaisir à la main dans l'admin. Cherché uniquement dans les tout premiers blocs, avant
  // le début du texte réel — jamais plus loin, pour ne prendre aucun risque de faux positif.
  const metadonnees = { genre: '', region: '', trancheAge: '', description: '' }
  const indicesMetadonnees = []
  for (let i = 0; i < Math.min(paragraphesFusionnes.length, 10); i++) {
    const p = paragraphesFusionnes[i]
    if (i === 0 && p.type === 'texte' && p.titre) continue // le tout premier bloc, s'il est un titre, est le titre de l'ouvrage lui-même
    if (p.type !== 'texte') continue // image de couverture (ou autre) entre le titre et les métadonnées : on continue de chercher après
    const t = p.texte.trim()
    // Les 3 champs peuvent être 3 blocs séparés (une ligne chacun) OU avoir été fusionnés en un
    // seul paragraphe par l'extraction PDF (lignes rapprochées) — on gère les deux à la fois en
    // repérant chaque label présent dans le bloc et en découpant le texte entre labels successifs.
    const motifs = [
      ['genre', /genre\s*:/i],
      ['region', /r[ée]gion\s*:/i],
      ['trancheAge', /tranche\s*d.?[âa]ge\s*:/i],
      ['description', /(r[ée]sum[ée]|description)\s*:/i],
    ]
    const occurrences = []
    for (const [cle, regex] of motifs) {
      const m = t.match(regex)
      if (m) occurrences.push({ cle, index: m.index, fin: m.index + m[0].length })
    }
    if (occurrences.length === 0) break // ni le titre, ni une métadonnée reconnue : le texte réel commence
    occurrences.sort((a, b) => a.index - b.index)
    for (let k = 0; k < occurrences.length; k++) {
      const debut = occurrences[k].fin
      const fin = k + 1 < occurrences.length ? occurrences[k + 1].index : t.length
      metadonnees[occurrences[k].cle] = t.slice(debut, fin).trim()
    }
    indicesMetadonnees.push(i)
  }
  const paragraphesUtiles = indicesMetadonnees.length > 0
    ? paragraphesFusionnes.filter((_, i) => !indicesMetadonnees.includes(i))
    : paragraphesFusionnes

  const tableMatieres = paragraphesUtiles
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.titre)
    .map((p) => ({ texte: p.texte, niveau: p.niveau, index: p.i }))

  return { sections: decouperEnSections(paragraphesUtiles), tableMatieres, metadonnees, couvertureDetectee }
}
