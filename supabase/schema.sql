-- ============================================================================
-- Schéma complet — Life Changers (bibliothèque numérique)
-- À exécuter en une fois dans Supabase → SQL Editor → New query → Run
-- (projet neuf et vide : rien à migrer, tout est créé directement dans son état final)
-- ============================================================================

-- Profils lecteurs (lié à auth.users de Supabase)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  pseudo text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data->>'pseudo', 'Lecteur' || substr(new.id::text, 1, 4)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Livres
create table livres (
  id uuid default gen_random_uuid() primary key,
  titre text not null,
  sous_titre text,
  slug text unique not null,
  auteur text,
  description text,
  genre text,
  couverture_url text,
  -- Chemin de l'objet dans le bucket privé 'livres' (jamais une URL publique — voir
  -- lib/fichiersLivres.js pour la génération d'URL signées, après vérification d'achat).
  fichier_url text not null,
  fichier_type text not null default 'pdf' check (fichier_type in ('pdf', 'epub', 'docx', 'text', 'md')),
  -- Cache du résultat de l'extraction (sections + table des matières), calculé une seule fois
  -- à l'upload plutôt qu'à chaque ouverture de l'app.
  contenu_extrait jsonb,
  contenu_extrait_le timestamptz,
  genere_par_ia boolean default false,
  verifie_par text,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  -- 'gratuit'   → rien à payer
  -- 'pourboire' → livre 100% gratuit + bouton "Soutenir l'auteur" (montant libre)
  -- 'payant'    → le livre entier est payant (prix_fcfa fait foi)
  -- 'bonus'     → le livre reste gratuit, un contenu bonus (postface, notes...) est payant à côté
  mode_monetisation text not null default 'gratuit' check (mode_monetisation in ('gratuit', 'pourboire', 'payant', 'bonus')),
  prix_fcfa integer not null default 0 check (prix_fcfa >= 0),
  bonus_contenu text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Progression de lecture
create table lecture_progress_livres (
  user_id uuid references profiles(id) on delete cascade,
  livre_id uuid references livres(id) on delete cascade,
  derniere_section int default 0,
  updated_at timestamptz default now(),
  primary key (user_id, livre_id)
);

-- Déblocages (achats et pourboires) — un déblocage = une tentative de paiement pour un livre.
create table deblocages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  livre_id uuid references livres(id) on delete cascade not null,
  -- 'deblocage' → achat qui débloque le livre entier (mode 'payant') ou le bonus (mode 'bonus')
  -- 'pourboire' → soutien libre, ne débloque rien de spécial, peut être versé plusieurs fois
  type text not null default 'deblocage' check (type in ('deblocage', 'pourboire')),
  montant_fcfa integer not null check (montant_fcfa > 0),
  transaction_id text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'reussi', 'echoue')),
  created_at timestamptz default now()
);

create unique index deblocages_transaction_id_idx on deblocages (transaction_id) where transaction_id is not null;
create unique index deblocages_user_livre_reussi_idx on deblocages (user_id, livre_id)
  where statut = 'reussi' and type = 'deblocage';

-- Bibliothèque personnelle (livres mis de côté par le lecteur, indépendamment de l'achat/progression)
create table favoris (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  livre_id uuid references livres(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, livre_id)
);

-- Notes et avis des lecteurs
create table avis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  livre_id uuid references livres(id) on delete cascade not null,
  note smallint not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, livre_id)
);

-- ============================================================================
-- Stockage
-- ============================================================================

-- Bucket PRIVÉ : les fichiers de livres ne sont jamais accessibles par URL directe. Chaque
-- lecture/téléchargement passe par une URL signée générée côté serveur (lib/fichiersLivres.js),
-- après vérification de l'achat — impossible de contourner le paywall en devinant une URL.
insert into storage.buckets (id, name, public)
values ('livres', 'livres', false)
on conflict (id) do nothing;

-- Bucket public pour les couvertures (image de présentation, pas de contenu à protéger).
insert into storage.buckets (id, name, public)
values ('couvertures', 'couvertures', true)
on conflict (id) do nothing;

create policy "Couvertures visibles par tous"
on storage.objects for select
using (bucket_id = 'couvertures');

-- Aucune policy de lecture publique sur le bucket 'livres' : seule la clé service_role
-- (routes API, qui vérifient l'achat avant d'appeler storage) peut y accéder.

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table livres enable row level security;
alter table lecture_progress_livres enable row level security;
alter table deblocages enable row level security;
alter table favoris enable row level security;
alter table avis enable row level security;

create policy "Profils visibles par tous" on profiles for select using (true);
create policy "Utilisateur modifie son profil" on profiles for update using (auth.uid() = id);

-- Le catalogue lui-même (titre, description, mode de monétisation...) est public — c'est le
-- FICHIER qui est protégé (bucket privé + URL signée), pas la fiche du livre. Le filtrage
-- brouillon/publié et l'exception admin sont gérés côté app (voir app/livres/[slug]/page.js et
-- CatalogueLivres.js), comme pour les autres contenus de la plateforme d'origine.
create policy "Livres visibles par tous" on livres for select using (true);
-- Pas de policy insert/update pour les clients : toute écriture passe par service_role
-- (routes /api/admin/livre, contournent RLS).

create policy "Progression livres privée" on lecture_progress_livres for all using (auth.uid() = user_id);

create policy "Lecteur voit ses propres deblocages" on deblocages for select using (auth.uid() = user_id);
-- Aucune policy insert/update pour les clients : toute écriture passe par les routes API
-- (service_role) pour empêcher un lecteur de se déclarer lui-même "reussi" sans paiement vérifié.

create policy "Lecteur gere sa propre bibliotheque" on favoris
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Avis visibles par tous" on avis for select using (true);
create policy "Lecteur gere son propre avis" on avis
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
