# Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Users, create the studio admin account.
4. Copy that user's UUID and run:
   `update public.profiles set role='admin' where id='<UUID>';`
5. Copy Project URL and anon key into local `.env`:
   `VITE_SUPABASE_URL=...`
   `VITE_SUPABASE_ANON_KEY=...`
6. Run `npm install` then `npm run dev`.
7. Sign in using the admin account. The admin panel can edit frame names, sizes, prices and upload catalogue images.
8. For production, configure the same environment variables in Vercel/Cloudflare Pages. Never expose the Supabase service-role key.

## Customer photo upload

The current preview is client-side for immediate privacy. The private `customer-uploads` bucket and RLS policies are prepared for authenticated final-order uploads. A server/API endpoint should generate validated signed upload URLs before accepting production orders.

## Payments

Razorpay is not activated until merchant credentials are configured. Payment creation and webhook verification must happen server-side; never put `RAZORPAY_KEY_SECRET` in a VITE variable.
