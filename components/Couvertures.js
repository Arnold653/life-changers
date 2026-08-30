// Couverture par défaut d'un livre, tant qu'aucune vraie couverture n'a été uploadée
// depuis l'admin (Admin → Livres → bouton "Ajouter" sur la miniature). Volontairement simple
// et lisible plutôt que décorative — c'est un état d'attente, pas un design fini.
export function CouvertureLivre({ titre, couvertureUrl }) {
  const initiale = (titre || '?').trim().charAt(0).toUpperCase()
  if (couvertureUrl) {
    return <img src={couvertureUrl} alt={titre} className="absolute inset-0 w-full h-full object-cover" />
  }
  return (
    <div className="absolute inset-0 bg-[#0b1526] flex items-center justify-center">
      <span className="font-display font-bold text-white/25 select-none text-6xl sm:text-7xl" aria-hidden="true">
        {initiale}
      </span>
    </div>
  )
}
