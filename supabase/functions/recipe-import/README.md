# recipe-import Edge Function

Sits between the Kitchen Helper app and the Anthropic API. The app sends recipe photo(s); this function calls Claude with a strict JSON schema and returns the extracted recipe. The API key never leaves Supabase.

- `tier: "fast"` (default) → Haiku — roughly half a cent per recipe.
- `tier: "accurate"` → Sonnet — for handwriting or messy layouts, ~2–3¢.

Models can be overridden without code changes via the optional `FAST_MODEL` / `ACCURATE_MODEL` secrets.

## One-time setup

From the repo root:

1. Install the Supabase CLI and link your project (the ref is the subdomain of your `EXPO_PUBLIC_SUPABASE_URL`):

   ```sh
   npm install -g supabase
   supabase login
   supabase link --project-ref usqyyezdeizryvgbsgxi
   ```

2. Set the Anthropic key as a function secret:

   ```sh
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Deploy:

   ```sh
   supabase functions deploy recipe-import
   ```

4. **Set a spend cap** on your Anthropic account (Console → Billing → usage limits). This is the real safety net — a few dollars covers hundreds of imports.

No app config is needed — the app builds the function URL and auth from the `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` values already in `.env`.

## Known deployment requirements

### Always deploy with `--no-verify-jwt`

This project uses Supabase's newer `sb_publishable_...` anon key format, which the Edge Function gateway rejects as an invalid JWT. Deploy with:

```sh
supabase functions deploy recipe-import --no-verify-jwt
```

If you forget and deploy without the flag, the app will get no response (not even an error in the function logs, because the request is blocked at the gateway before reaching the function). The spend cap is your real protection.

### JSON schema: use `anyOf` for nullable fields

Anthropic's structured output validator does not accept `type: ['string', 'null']` (array types). All nullable fields in the schema must use:

```json
{ "anyOf": [{ "type": "string" }, { "type": "null" }] }
```

The deployed schema already uses this pattern. If you extend the schema, follow the same convention or you'll get a 400 `invalid_request_error` from the Anthropic API.

## Smoke test

```powershell
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("recipe.jpg"))
$body = @{ images = @(@{ base64 = $b64; mediaType = "image/jpeg" }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post `
  -Uri "https://usqyyezdeizryvgbsgxi.supabase.co/functions/v1/recipe-import" `
  -Headers @{ Authorization = "Bearer <EXPO_PUBLIC_SUPABASE_ANON_KEY>"; apikey = "<EXPO_PUBLIC_SUPABASE_ANON_KEY>" } `
  -ContentType "application/json" -Body $body
```

A successful response is `{ recipe: { title, ingredientSections, ... }, model, usage }`.

## Maintenance

Effectively none. If a model is deprecated, `supabase secrets set FAST_MODEL=<new-id>` (no redeploy needed). If you rotate your Anthropic key, re-run the `secrets set` for it.
