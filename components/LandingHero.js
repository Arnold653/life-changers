export default function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-ligne">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{ background: 'radial-gradient(circle at 20% 20%, rgb(var(--or)) 0%, transparent 45%)' }}
      />
      <div className="relative max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-or mb-5 flex items-center justify-center gap-2">
          <span className="w-5 h-[3px] bg-or inline-block" /> Life Changers Library
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-papier mb-6 leading-[1.05] tracking-tight max-w-3xl mx-auto">
          Le savoir a le pouvoir de transformer des vies.
        </h1>
        <p className="text-papier/55 leading-relaxed text-lg max-w-xl mx-auto mb-10">
          Des livres écrits sans détour pour former des hommes et des femmes capables d'impacter
          leur société — à lire en ligne ou hors connexion, où que tu sois.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <a
            href="/login"
            className="w-full sm:w-auto text-encre bg-or rounded-full px-7 py-3.5 font-medium hover:brightness-110 transition-all"
          >
            Créer un compte gratuit
          </a>
          <a
            href="#catalogue"
            className="w-full sm:w-auto text-papier border border-papier/20 rounded-full px-7 py-3.5 font-medium hover:border-or hover:text-or transition-colors"
          >
            Explorer le catalogue
          </a>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap font-mono text-xs uppercase tracking-wide text-papier/40">
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Vérifié par des experts</span>
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Lecture hors connexion</span>
          <span className="flex items-center gap-2"><span className="text-or">✓</span> Écrit sans détour</span>
        </div>
      </div>
    </section>
  )
}
