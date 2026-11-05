# Misosofi Practice Log

Piano practice app (installable web app) for Misosofi students and teachers.

- App: the files in this folder, served by GitHub Pages.
- Backend: Supabase (database rules in `supabase/schema.sql` and `supabase/patch-*.sql`, server function `supabase/functions/plan-week`).
- No secrets are stored here. `config.js` holds only the public client key; student data is protected by the database rules.
