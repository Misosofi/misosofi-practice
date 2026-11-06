New database changes go here as `YYYY-MM-DD-NN-name.sql`. On push to main, the "Database update" workflow
waits for approval (GitHub environment `supabase`, required reviewer) and then runs each new file once,
in name order, each in its own transaction. Applied files are recorded in `public._migrations`.
Files must be safe to run on the live database; never edit a file after it was applied — add a new one.
