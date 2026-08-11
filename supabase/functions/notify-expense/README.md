# notify-expense

Sends a Web Push notification to every other member of a group when someone
adds an expense. Called directly from the client right after `create_expense`
succeeds (see `createExpense()` in `src/lib/expenses.ts`) -- not a database
webhook, so there's nothing to wire up in the dashboard beyond deploying this
function and setting its secrets.

## One-time setup

1. **Generate a VAPID key pair** (no network access needed):

   ```sh
   node scripts/generate-vapid-keys.mjs
   ```

   This prints a `VITE_VAPID_PUBLIC_KEY` line and a `VAPID_PRIVATE_KEY` line.

2. **Client**: put the public key in your `.env` (see `.env.example`):

   ```
   VITE_VAPID_PUBLIC_KEY=<the public key>
   ```

3. **Deploy the function** (requires the Supabase CLI, logged in and linked
   to your project -- `supabase link`):

   ```sh
   supabase functions deploy notify-expense
   ```

4. **Set its secrets** -- the private key must never go in client env or be
   committed:

   ```sh
   supabase secrets set \
     VAPID_PUBLIC_KEY=<the public key> \
     VAPID_PRIVATE_KEY=<the private key> \
     VAPID_SUBJECT=mailto:you@example.com \
     SITE_URL=https://your-deployed-app.example
   ```

   `VAPID_SUBJECT` must be a `mailto:` or `https:` URL -- it's how push
   services can contact you if your server is misbehaving. `SITE_URL` is
   used to build the link a tapped notification opens (falls back to a
   relative path if unset). `SUPABASE_URL` / `SUPABASE_ANON_KEY` /
   `SUPABASE_SERVICE_ROLE_KEY` are already available to every Edge Function
   automatically -- don't set those yourself.

That's it -- once a member turns notifications on for a group in Settings,
everyone else in that group gets a push the next time someone adds an
expense there.

## Notes

- If the secrets aren't set, the function responds `501` and does nothing;
  `createExpense()`'s call to it is fire-and-forget, so this never breaks
  adding an expense.
- A subscription that a push service reports as gone (HTTP 404/410) is
  deleted from `push_subscriptions` automatically.
