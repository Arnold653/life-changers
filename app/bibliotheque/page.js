import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CouvertureLivre } from '@/components/Couvertures'

export default async function BibliothequePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?suite=/bibliotheque')

  const [{ data: enCours }, { data: achats }, { data: favoris }] = await Promise.all([
    supabase
      .from('lecture_progress_livres')
      .select('derniere_section, updated_at, livres(id, titre, slug, couverture_url)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('deblocages')
      .select('livres(id, titre, slug, couverture_url)')
      .eq('user_id', user.id)
      .eq('statut', 'reussi')
      .eq('type', 'deblocage'),
    supabase
      .from('favoris')
      .select('created_at, livres(id, titre, slug, couverture_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const sections = [
    { titre: 'Reprendre la lecture', items: (enCours ?? []).map((r) => r.livres).filter(Boolean) },
    { titre: 'Mes achats', items: (achats ?? []).map((r) => r.livres).filter(Boolean) },
    { titre: 'Mes favoris', items: (favoris ?? []).map((r) => r.livres).filter(Boolean) },
  ].filter((s) => s.items.length > 0)

  return (
    <div className="px-6 pt-16 pb-24 max-w-2xl mx-auto lever">
      <h1 className="font-display text-4xl text-papier mb-3">Ma bibliothèque</h1>
      <p className="text-papier/50 mb-12 leading-relaxed">
        Tes lectures en cours, tes achats et tes favoris, au même endroit.
      </p>

      {sections.length === 0 ? (
        <p className="text-papier/30 text-sm font-mono">
          Rien pour l'instant — explore le catalogue pour commencer.
        </p>
      ) : (
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.titre}>
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-or/70 mb-4">{section.titre}</p>
              <ul className="divide-y divide-ligne">
                {section.items.map((livre) => (
                  <li key={livre.id}>
                    <a href={`/livres/${livre.slug}`} className="flex items-center gap-3 py-3 group min-w-0">
                      <div className="relative overflow-hidden rounded-md w-11 h-14 shrink-0">
                        <CouvertureLivre id={livre.id} titre={livre.titre} couvertureUrl={livre.couverture_url} />
                      </div>
                      <p className="text-papier font-display text-base truncate group-hover:text-or transition-colors flex-1 min-w-0">
                        {livre.titre}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
