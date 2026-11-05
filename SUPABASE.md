# Earlier optional Supabase integration

The TakeNote website no longer uses Supabase authentication or sync. It is intentionally **login-free and local-first**. The old table `public.takenote_notes` in the separately connected RFP Supabase project has not been dropped or modified by the React conversion, to avoid affecting data or other systems. This repository retains the historical migration only for reference. Do **not** apply it to unrelated databases unless deliberately adding a new cloud-sync feature.

The current app does not request Supabase credentials, nor load Supabase code. See README.md for local storage and backup instructions.
