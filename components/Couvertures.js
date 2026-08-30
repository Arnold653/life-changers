// Couverture par défaut d'un livre, tant qu'aucune vraie couverture n'a été uploadée
// depuis l'admin (Admin → Livres → bouton "Ajouter" sur la miniature).
export function CouvertureLivre({ titre, couvertureUrl }) {
  const initiale = (titre || '?').trim().charAt(0).toUpperCase()
  if (couvertureUrl) {
    return <img src={couvertureUrl} alt={titre} className="absolute inset-0 w-full h-full object-cover" />
  }
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #16233d 0%, #0f1a2e 60%, #0b1526 100%)' }} />
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-or/60" />
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)', backgroundSize: '3px 3px' }} />
      <span className="font-display absolute right-4 top-4 text-[2.4rem] leading-none text-papier/[0.16] select-none pointer-events-none" aria-hidden="true">
        {initiale}
      </span>
      <div className="absolute inset-[6px] border border-papier/[0.1] pointer-events-none" />
    </>
  )
}
