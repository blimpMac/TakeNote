# TakeNote cloud storage

TakeNote can work offline with browser-local notes. The optional cloud sign-in uses the connected RFP Web Project Supabase instance (project reference `chchtjolsnlelgxbgkip`), with a **separate** table named `public.takenote_notes`.

## Isolation and security
- Only the dedicated TakeNote table was added; RFP business tables were not changed.
- Row-level security is enabled, with select/insert/update/delete policies that require `owner_id = auth.uid()`.
- The browser contains a **publishable** Supabase key, never a service-role key.
- The existing Supabase Auth user-creation trigger belongs to the RFP system. TakeNote **does not offer new-account registration** to avoid running that workflow.
- This is table-level isolation, **not a fully separate authentication instance**. For a new-user sign-up flow, provision a separate TakeNote project and change the public URL and publishable key in `cloud-sync.js`.

## Usage
1. Open the notebook and create notes; they autosave locally.
2. Use the **☁ Sign in** control if you already have a valid account in the connected project.
3. On first sign-in, choose whether to merge existing local notes into the cloud. A local copy is kept under `takenote.precloud.backup`.
4. Export backups with **Monthly recap → Backup JSON**. The database does not replace backups.
5. Do not edit the same notes from multiple devices simultaneously; this is simple last-writer sync, not a collaborative editor.

The schema migration is available at `supabase/migrations/20261105000000_create_takenote_notes.sql`. Do not reapply it to unrelated databases without reviewing the namespace and existing policies.

## Publishing
GitHub Pages still must be enabled under **Settings → Pages** for the static app to become publicly available. Select GitHub Actions as the source.
