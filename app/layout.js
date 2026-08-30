import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import BandeauHorsLigne from '@/components/BandeauHorsLigne'

export const metadata = {
  title: 'Life Changers — Bibliothèque numérique',
  description: 'Les livres Life Changers, à lire en ligne ou hors connexion.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.png', apple: '/apple-icon.png' },
}

export const viewport = {
  themeColor: '#0a1930',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <ServiceWorkerRegister />
        <BandeauHorsLigne />
        <SiteHeader />

        <main className="flex-1">{children}</main>

        <footer className="relative border-t border-ligne mt-24 overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(247,148,29,0.6), transparent)' }}
          />
          <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
            <div className="grid sm:grid-cols-2 gap-10 mb-12">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Life Changers" className="h-6 w-auto mb-3" />
                <p className="text-papier/45 text-[0.95rem] leading-relaxed max-w-xs mt-3">
                  La bibliothèque numérique Life Changers — à lire en ligne ou hors connexion.
                </p>
              </div>
              <div className="font-mono text-xs uppercase tracking-wide sm:text-right">
                <p className="text-papier/30 mb-4">Explorer</p>
                <ul className="space-y-3 text-papier/55">
                  <li><a href="/" className="hover:text-or transition-colors">Catalogue</a></li>
                  <li><a href="/bibliotheque" className="hover:text-or transition-colors">Ma bibliothèque</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-ligne pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-papier/30 font-mono">
              <span>© {new Date().getFullYear()} Life Changers</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
