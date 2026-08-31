-- ============================================================================
-- Migration incrémentale — Bucket public pour les illustrations de contenu
-- À exécuter dans Supabase → SQL Editor.
--
-- Corrige un bug réel : les images intégrées à l'intérieur d'un livre (illustrations
-- extraites du PDF/EPUB/DOCX pendant la lecture) étaient jusqu'ici envoyées dans le bucket
-- PRIVÉ 'livres' (celui du fichier source protégé) avec une URL "publique" qui ne fonctionnait
-- en réalité pas du tout (403) — ces images étaient donc invisibles pour tout le monde. Ce
-- script crée le bucket dédié 'illustrations', public, distinct du fichier source protégé.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('illustrations', 'illustrations', true)
on conflict (id) do nothing;

drop policy if exists "Illustrations visibles par tous" on storage.objects;
create policy "Illustrations visibles par tous"
on storage.objects for select
using (bucket_id = 'illustrations');
