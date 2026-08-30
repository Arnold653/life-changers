'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

export default function SiteHeader() {
  const [tiroirOuvert, setTiroirOuvert] = useState(false)
  const [statut, setStatut] = useState({ loading: true, user: null, isAdmin: false })

  const supabase = createClient()

  async function chargerStatut() {
    const res = await fetch('/api/me')
    const data = await res.json()
    setStatut({ loading: false, user: data.user, isAdmin: data.isAdmin })
  }

  useEffect(() => {
    chargerStatut()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => chargerStatut())
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.body.style.overflow = tiroirOuvert ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [tiroirOuvert])

  async function deconnexion() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const connecte = !statut.loading && !!statut.user

  const liensNav = [
    { href: '/', label: 'Catalogue' },
    ...(connecte ? [{ href: '/bibliotheque', label: 'Ma bibliothèque' }] : []),
    ...(connecte ? [{ href: '/compte', label: 'Mon compte' }] : []),
    ...(statut.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-encre/85 border-b border-ligne">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Life Changers" className="h-6 sm:h-7 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-[0.8rem] text-papier/55 font-mono uppercase tracking-wide">
            {liensNav.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-or transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle className="mr-1" />
            {connecte ? (
              <a href="/bibliotheque" className="hidden sm:block text-papier border border-papier/20 rounded-full px-4 py-1.5 hover:border-or hover:text-or transition-colors text-sm">
                Ma bibliothèque
              </a>
            ) : (
              !statut.loading && (
                <a href="/login" className="hidden sm:block text-papier border border-papier/20 rounded-full px-4 py-1.5 hover:border-or hover:text-or transition-colors text-sm">
                  Se connecter
                </a>
              )
            )}

            <button
              onClick={() => setTiroirOuvert(true)}
              aria-label="Menu"
              className="p-1.5 ml-2 text-papier/80 hover:text-or transition-colors"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${tiroirOuvert ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setTiroirOuvert(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-[82%] max-w-xs bg-encreClair border-l border-ligne flex flex-col transition-transform duration-300 ${tiroirOuvert ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-ligne shrink-0">
            <span className="font-display text-lg text-papier">Menu</span>
            <button onClick={() => setTiroirOuvert(false)} aria-label="Fermer" className="p-1.5 text-papier/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {connecte && (
            <a href="/compte" onClick={() => setTiroirOuvert(false)} className="block px-5 py-5 border-b border-ligne hover:bg-encre/40 transition-colors">
              <p className="font-display text-lg text-papier truncate">{statut.user?.email}</p>
              <p className="text-papier/40 text-xs font-mono uppercase tracking-wide mt-1">Voir mon compte</p>
            </a>
          )}

          <nav className="flex-1 overflow-y-auto py-3">
            {liensNav.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setTiroirOuvert(false)} className="flex items-center px-5 py-3.5 text-papier/75 hover:bg-encre/40 hover:text-or transition-colors text-[0.95rem]">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="px-5 py-5 border-t border-ligne shrink-0">
            {connecte ? (
              <button onClick={deconnexion} className="w-full text-encre bg-or rounded-full px-4 py-3 text-center font-medium text-sm hover:brightness-110 transition-all">
                Se déconnecter
              </button>
            ) : (
              !statut.loading && (
                <a href="/login" onClick={() => setTiroirOuvert(false)} className="block w-full text-encre bg-or rounded-full px-4 py-3 text-center font-medium text-sm hover:brightness-110 transition-all">
                  Se connecter
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
