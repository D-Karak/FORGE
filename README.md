This is Forge, a Next.js App Router coaching marketplace backed by Neon.

## Neon authentication and profiles

The app uses Neon Managed Auth for email/password and Google sign-in. Auth requests are proxied through `/api/auth`, while protected routes redirect signed-out visitors to `/login`. Account role profiles are stored in Postgres.

After `neon deploy` has populated `.env.local`, apply the checked-in profile migration with:

```bash
npm run db:migrate
```

Set `NEON_AUTH_COOKIE_SECRET` in `.env.local` (and in the hosting environment) to a fresh secret of at least 32 characters. Generate one locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Google sign-in on production requires a Google OAuth client configured for the Neon Auth branch in the Neon Console. Apple sign-in is deferred.
Set a server-only `ADMIN_EMAILS` comma-separated allowlist before granting access to the admin preview.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
