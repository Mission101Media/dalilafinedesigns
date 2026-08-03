import Stripe from "stripe";

const catalog = {
  "Heart Shape Earrings": { unitAmount: 1800, description: "Handmade blue heart earrings" },
  "Triple Heart Drops": { unitAmount: 2000, description: "Handmade triple-heart drop earrings" },
} as const;

type ProductName = keyof typeof catalog;

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return Response.json({ error: "Stripe is not connected yet. Add the test secret key to .env.local, then restart the preview." }, { status: 503 });
    }

    const body = await request.json() as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return Response.json({ error: "Your bag is empty or contains too many items." }, { status: 400 });
    }

    const quantities = new Map<ProductName, number>();
    for (const value of body.items) {
      if (typeof value !== "string" || !(value in catalog)) {
        return Response.json({ error: "Your bag contains an unavailable product." }, { status: 400 });
      }
      const name = value as ProductName;
      quantities.set(name, (quantities.get(name) ?? 0) + 1);
    }

    const stripe = new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: Array.from(quantities, ([name, quantity]) => ({
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: catalog[name].unitAmount,
          product_data: { name, description: catalog[name].description },
        },
      })),
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}#shop`,
      cancel_url: `${origin}/?checkout=canceled#shop`,
      shipping_address_collection: { allowed_countries: ["US"] },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      customer_creation: "always",
      allow_promotion_codes: true,
    });

    if (!session.url) return Response.json({ error: "Stripe did not return a checkout address." }, { status: 502 });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return Response.json({ error: "Stripe checkout is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
