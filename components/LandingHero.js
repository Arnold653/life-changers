// Bannière immersive façon Netflix/Audible : la couverture d'un vrai livre du catalogue en
// fond plein cadre plutôt qu'un visuel générique — l'affiche EST déjà la meilleure image dont
// on dispose, pas besoin d'en inventer une autre. Toujours sombre (contrairement au reste du
// site, clair par défaut) : un fond photo a besoin de son propre voile sombre pour rester
// lisible, indépendamment du thème choisi par le visiteur pour la lecture.
export default function LandingHero({ livre }) {
  return (
    <section className="relative overflow-hidden bg-[#050810] min-h-[86vh] sm:min-h-[92vh] flex items-end">
      {livre?.couverture_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={livre.couverture_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,8,16,0.15) 0%, rgba(5,8,16,0.55) 55%, #050810 96%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #050810 0%, rgba(5,8,16,0.55) 32%, transparent 62%)' }} />
        </>
      )}
      {!livre?.couverture_url && (
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 25% 25%, rgb(var(--or)) 0%, transparent 50%), radial-gradient(circle at 75% 70%, #0a2d7a 0%, transparent 50%)' }}
        />
      )}

      <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24 pt-32">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-or mb-5 flex items-center gap-2">
          <span className="w-5 h-[3px] bg-or inline-block" /> Life Changers Library
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl text-white mb-6 leading-[1.02] tracking-tight max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          Le savoir a le pouvoir de transformer des vies.
        </h1>
        <p className="text-white/70 leading-relaxed text-lg max-w-lg mb-10">
          Des livres écrits sans détour pour former des hommes et des femmes capables d'impacter
          leur société — à lire en ligne ou hors connexion, où que tu sois.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-3 mb-14">
          <a
            href="/login"
            className="w-full sm:w-auto text-center text-encre bg-or rounded-full px-8 py-3.5 font-semibold hover:brightness-110 transition-all"
          >
            Créer un compte gratuit
          </a>
          <a
            href="#catalogue"
            className="w-full sm:w-auto text-center text-white bg-white/10 border border-white/25 rounded-full px-8 py-3.5 font-medium backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            Explorer le catalogue
          </a>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 flex-wrap font-mono text-xs uppercase tracking-wide text-white/45">
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Vérifié par des experts</span>
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Lecture hors connexion</span>
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Écrit sans détour</span>
        </div>
      </div>
    </section>
  )
}
