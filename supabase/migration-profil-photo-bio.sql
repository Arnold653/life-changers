-- ============================================================================
-- Migration incrémentale — Profil : photo + bio
-- À exécuter dans Supabase → SQL Editor (le projet a déjà supabase/schema.sql,
-- ce script ne fait qu'AJOUTER ce qui manque, sans rien toucher d'existant).
-- ============================================================================

alter table profiles add column if not exists bio text;

-- Bucket public pour les photos de profil (juste une image de présentation, comme les
-- couvertures — pas de contenu à protéger).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatars visibles par tous" on storage.objects;
create policy "Avatars visibles par tous"
on storage.objects for select
using (bucket_id = 'avatars');

-- Chacun ne peut déposer/remplacer que SON PROPRE avatar : le chemin de fichier doit
-- commencer par son propre user_id (convention appliquée côté app : "<user_id>/avatar.xxx").
drop policy if exists "Lecteur gere son propre avatar" on storage.objects;
create policy "Lecteur gere son propre avatar"
on storage.objects for all
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
