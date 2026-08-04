const PRINTFUL_API = "https://api.printful.com";

type PrintfulEnvelope<T> = { code: number; result: T; error?: { message?: string } };

export type PrintfulVariant = {
  id: number;
  name: string;
  retailPrice: number;
  image: string;
};

export type PrintfulProduct = {
  id: number;
  name: string;
  image: string;
  variants: PrintfulVariant[];
};

function headers() {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error("Printful is not connected.");
  const value: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (process.env.PRINTFUL_STORE_ID) value["X-PF-Store-Id"] = process.env.PRINTFUL_STORE_ID;
  return value;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PRINTFUL_API}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const payload = await response.json() as PrintfulEnvelope<T>;
  if (!response.ok) throw new Error(payload.error?.message || `Printful request failed (${response.status}).`);
  return payload.result;
}

type ProductSummary = { id: number; name: string; thumbnail_url?: string; is_ignored?: boolean };
type ProductDetail = {
  sync_product: ProductSummary;
  sync_variants: Array<{
    id: number;
    name: string;
    synced: boolean;
    retail_price: string;
    files?: Array<{ thumbnail_url?: string; preview_url?: string }>;
    product?: { image?: string };
  }>;
};

export async function getPrintfulProducts(): Promise<PrintfulProduct[]> {
  const summaries = await request<ProductSummary[]>("/store/products");
  const details = await Promise.all(
    summaries.filter((item) => !item.is_ignored).map((item) => request<ProductDetail>(`/store/products/${item.id}`)),
  );

  return details.map(({ sync_product, sync_variants }) => {
    const variants = sync_variants.filter((variant) => variant.synced).map((variant) => ({
      id: variant.id,
      name: variant.name,
      retailPrice: Number(variant.retail_price),
      image: variant.files?.[0]?.thumbnail_url || variant.files?.[0]?.preview_url || variant.product?.image || sync_product.thumbnail_url || "",
    }));
    return {
      id: sync_product.id,
      name: sync_product.name,
      image: sync_product.thumbnail_url || variants[0]?.image || "",
      variants,
    };
  }).filter((product) => product.variants.length > 0);
}

export async function getPrintfulVariant(syncVariantId: number) {
  const variant = await request<{
    id: number;
    name: string;
    synced: boolean;
    retail_price: string;
    files?: Array<{ thumbnail_url?: string; preview_url?: string }>;
    product?: { image?: string };
  }>(`/store/variants/${syncVariantId}`);
  if (!variant.synced) throw new Error("That Printful variant is not available.");
  return {
    id: variant.id,
    name: variant.name,
    retailPrice: Number(variant.retail_price),
    image: variant.files?.[0]?.thumbnail_url || variant.files?.[0]?.preview_url || variant.product?.image || "",
  };
}

export async function createPrintfulOrder(input: {
  externalId: string;
  recipient: Record<string, string>;
  items: Array<{ sync_variant_id: number; quantity: number; retail_price: string }>;
}) {
  const existingResponse = await fetch(`${PRINTFUL_API}/orders/@${encodeURIComponent(input.externalId)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (existingResponse.ok) {
    const existing = await existingResponse.json() as PrintfulEnvelope<{ id: number; status: string }>;
    return existing.result;
  }
  if (existingResponse.status !== 404) throw new Error(`Printful order lookup failed (${existingResponse.status}).`);

  try {
    return await request<{ id: number; status: string }>("/orders?confirm=1", {
      method: "POST",
      body: JSON.stringify({ external_id: input.externalId, shipping: "STANDARD", recipient: input.recipient, items: input.items }),
    });
  } catch (error) {
    // A simultaneous Stripe retry can race the lookup. Printful's unique external ID
    // still prevents a duplicate, so an existing order means fulfillment succeeded.
    const retry = await fetch(`${PRINTFUL_API}/orders/@${encodeURIComponent(input.externalId)}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (retry.ok) {
      const existing = await retry.json() as PrintfulEnvelope<{ id: number; status: string }>;
      return existing.result;
    }
    throw error;
  }
}
