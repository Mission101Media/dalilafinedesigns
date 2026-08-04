import { getPrintfulProducts } from "@/lib/printful";

export async function GET() {
  if (!process.env.PRINTFUL_API_TOKEN) return Response.json({ connected: false, products: [] });
  try {
    return Response.json({ connected: true, products: await getPrintfulProducts() });
  } catch (error) {
    console.error("Printful catalog error", error);
    return Response.json({ connected: false, products: [], error: "Printful merchandise is temporarily unavailable." }, { status: 502 });
  }
}
