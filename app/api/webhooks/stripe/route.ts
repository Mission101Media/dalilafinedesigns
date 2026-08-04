import { createHash } from "node:crypto";
import Stripe from "stripe";
import { createPrintfulOrder } from "@/lib/printful";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return new Response("Webhook is not configured.", { status: 503 });

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature error", error);
    return new Response("Invalid Stripe signature.", { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return Response.json({ received: true });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ["line_items.data.price.product"],
    });
    if (session.payment_status !== "paid") return Response.json({ received: true });

    const printfulItems = new Map<number, { quantity: number; retailPrice: string }>();
    for (const item of session.line_items?.data ?? []) {
      const product = item.price?.product;
      if (!product || typeof product === "string" || product.deleted) continue;
      const variantId = Number(product.metadata.printful_sync_variant_id);
      if (!Number.isInteger(variantId) || variantId <= 0) continue;
      const current = printfulItems.get(variantId) ?? { quantity: 0, retailPrice: ((item.amount_total ?? 0) / 100).toFixed(2) };
      current.quantity += item.quantity ?? 1;
      printfulItems.set(variantId, current);
    }
    if (printfulItems.size === 0) return Response.json({ received: true });

    const shipping = session.collected_information?.shipping_details;
    if (!shipping?.address || !shipping.name) throw new Error("Stripe checkout did not include a shipping address.");
    const externalId = `st_${createHash("sha256").update(session.id).digest("hex").slice(0, 29)}`;
    await createPrintfulOrder({
      externalId,
      recipient: {
        name: shipping.name,
        company: shipping.address.line2 || "",
        address1: shipping.address.line1 || "",
        city: shipping.address.city || "",
        state_code: shipping.address.state || "",
        country_code: shipping.address.country || "US",
        zip: shipping.address.postal_code || "",
        phone: session.customer_details?.phone || "",
        email: session.customer_details?.email || "",
      },
      items: Array.from(printfulItems, ([sync_variant_id, item]) => ({
        sync_variant_id,
        quantity: item.quantity,
        retail_price: item.retailPrice,
      })),
    });
    return Response.json({ received: true });
  } catch (error) {
    console.error("Printful fulfillment error", error);
    return new Response("Fulfillment failed; Stripe will retry.", { status: 500 });
  }
}
