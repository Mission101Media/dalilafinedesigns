# Dalila Fine Designs

A colorful Next.js ecommerce storefront for Dalila Fine Designs, including a responsive slideshow, product bag, and Stripe-hosted Checkout.

## Run locally

1. Install Node.js 22.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add a Stripe test secret key to `.env.local`.
5. Run `npm run dev` and open `http://localhost:3000`.

## Deploy with GitHub and Vercel

1. Extract the deployment ZIP.
2. Create an empty GitHub repository.
3. Upload all extracted files, including `.gitignore` and `.env.example`. Do not upload `.env.local`.
4. In Vercel, choose **Add New → Project** and import the GitHub repository.
5. Keep the detected framework as **Next.js** and the project root as `./`.
6. In **Settings → Environment Variables**, add `STRIPE_SECRET_KEY` with the Stripe secret key. Select Production and Preview.
7. Deploy. If the environment variable is added after deploying, redeploy the project.

## Stripe

The server validates available products and prices before creating a Stripe Checkout Session. Start in Stripe test mode. Replace the test key with the live secret key only when the store is ready to accept real payments.

Available products:

- Heart Shape Earrings — $18.00
- Triple Heart Drops — $20.00

Custom designs and illustrated placeholder products are marked **Coming Soon**.
