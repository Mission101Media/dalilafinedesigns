export function getMerchMockup(productName: string, variantName: string, fallback = "") {
  const value = `${productName} ${variantName}`.toLowerCase();

  if (value.includes("hoodie")) {
    if (value.includes("light pink")) return "/images/merch/hoodie-light-pink.png";
    if (value.includes("royal")) return "/images/merch/hoodie-royal.png";
    if (value.includes("white")) return "/images/merch/hoodie-white.png";
    return "/images/merch/hoodie-carolina-blue.png";
  }
  if (value.includes("tote")) {
    return value.includes("oyster") ? "/images/merch/tote-oyster.png" : "/images/merch/tote-black.png";
  }
  if (value.includes("tee") || value.includes("t-shirt") || value.includes("shirt")) {
    if (value.includes("light pink")) return "/images/merch/tee-light-pink.png";
    if (value.includes("natural")) return "/images/merch/tee-natural.png";
    if (value.includes("white")) return "/images/merch/tee-white.png";
    return "/images/merch/tee-light-blue.png";
  }
  if (value.includes("sling")) {
    if (value.includes("rose quartz")) return "/images/merch/sling-rose-quartz.png";
    if (value.includes("black")) return "/images/merch/sling-black.png";
    if (value.includes("chambray")) return "/images/merch/sling-chambray.png";
    if (value.includes("ivory")) return "/images/merch/sling-ivory.png";
    return "/images/merch/sling-bay.png";
  }
  return fallback;
}
