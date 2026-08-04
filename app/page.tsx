"use client";

import { useEffect, useState } from "react";
import { getMerchMockup } from "@/lib/merch-mockups";

const slides = [
  {
    image: "/images/dalila-hero-portrait.png",
    video: "/video/web-intro.mp4",
    eyebrow: "Made by Dalila, just for you",
    title: "Tiny treasures. Big personality.",
    copy: "Colorful handmade jewelry designed to make every day feel extra special.",
  },
  {
    image: "/images/dalila-making-2.jpg",
    video: "",
    eyebrow: "From an idea to your jewelry box",
    title: "Made with care, one piece at a time.",
    copy: "Every shape, color, and tiny detail is crafted by hand in Dalila’s home studio.",
  },
  {
    image: "/images/dalila-making-3.jpg",
    video: "",
    eyebrow: "Wear what makes you smile",
    title: "Color is always a good idea.",
    copy: "Lightweight statement pieces inspired by hearts, happy colors, and a little sparkle.",
  },
];

type Product = {
  name: string;
  category: string;
  price: string;
  color: string;
  badge: string;
  shape?: string;
  image?: string;
  comingSoon?: boolean;
};

type MerchVariant = {
  id: number;
  name: string;
  retailPrice: number;
  image: string;
};

type MerchProduct = {
  id: number;
  name: string;
  image: string;
  variants: MerchVariant[];
};

const products: Product[] = [
  { name: "Heart Shape Earrings", category: "Earrings", price: "$18.00", color: "aqua", badge: "New", image: "/images/heart-shape-earrings.jpg" },
  { name: "Triple Heart Drops", category: "Earrings", price: "$20.00", color: "mint", badge: "New", image: "/images/triple-heart-earrings.jpg" },
  { name: "Ocean Heart Drops", category: "Earrings", price: "Coming soon", color: "aqua", badge: "Coming soon", shape: "hearts", comingSoon: true },
  { name: "Pink Pop Hoops", category: "Earrings", price: "Coming soon", color: "pink", badge: "Coming soon", shape: "hoops", comingSoon: true },
  { name: "Sunshine Bead Stack", category: "Bracelets", price: "Coming soon", color: "yellow", badge: "Coming soon", shape: "beads", comingSoon: true },
  { name: "Lavender Love Necklace", category: "Necklaces", price: "Coming soon", color: "purple", badge: "Coming soon", shape: "necklace", comingSoon: true },
  { name: "Confetti Daisy Studs", category: "Earrings", price: "Coming soon", color: "coral", badge: "Coming soon", shape: "flowers", comingSoon: true },
  { name: "Make-It-Mine Charm Set", category: "Custom", price: "Coming soon", color: "mint", badge: "Coming soon", shape: "charms", comingSoon: true },
];

const categories = [
  { name: "Earrings", symbol: "♡", className: "cat-pink", copy: "Dangles, hoops & studs" },
  { name: "Bracelets", symbol: "○", className: "cat-aqua", copy: "Colorful stacks" },
  { name: "Necklaces", symbol: "☆", className: "cat-yellow", copy: "Happy little charms" },
  { name: "Custom", symbol: "✿", className: "cat-purple", copy: "Made your way" },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerLogoVisible, setHeaderLogoVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "canceled" | "">(() => {
    if (typeof window === "undefined") return "";
    const status = new URLSearchParams(window.location.search).get("checkout");
    return status === "success" || status === "canceled" ? status : "";
  });
  const [merchProducts, setMerchProducts] = useState<MerchProduct[]>([]);
  const [selectedMerchVariants, setSelectedMerchVariants] = useState<Record<number, number>>({});

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/printful/products")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { products?: MerchProduct[] }) => setMerchProducts(data.products ?? []))
      .catch(() => setMerchProducts([]));
  }, []);

  useEffect(() => {
    const updateHeaderLogo = () => {
      const hero = document.getElementById("top");
      setHeaderLogoVisible(hero ? hero.getBoundingClientRect().bottom <= 116 : true);
    };
    updateHeaderLogo();
    window.addEventListener("scroll", updateHeaderLogo, { passive: true });
    window.addEventListener("resize", updateHeaderLogo);
    return () => {
      window.removeEventListener("scroll", updateHeaderLogo);
      window.removeEventListener("resize", updateHeaderLogo);
    };
  }, []);

  const goToSlide = (index: number) => setSlide((index + slides.length) % slides.length);
  const addToCart = (name: string) => {
    setCart((items) => [...items, name]);
    setCartOpen(true);
  };
  const cartSubtotal = cart.reduce((total, name) => {
    const product = products.find((item) => item.name === name);
    const merch = merchProducts.flatMap((item) => item.variants).find((item) => `printful:${item.id}` === name);
    return total + (product && !product.comingSoon ? Number(product.price.replace(/[^0-9.]/g, "")) : merch?.retailPrice ?? 0);
  }, 0);
  const cartLabel = (key: string) => merchProducts.flatMap((item) => item.variants).find((item) => `printful:${item.id}` === key)?.name ?? key;
  const startCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not be started.");
      setCheckoutLoading(false);
    }
  };

  return (
    <main>
      <div className="announcement">Free shipping on orders $40+ <span>♥</span> Handmade with happy</div>
      <header className="site-header">
        <a className={`brand ${headerLogoVisible ? "brand-visible" : "brand-hidden"}`} href="#top" aria-label="Dalila Fine Designs home" aria-hidden={!headerLogoVisible} tabIndex={headerLogoVisible ? 0 : -1}>
          <img src="/images/dalila-logo.png" alt="Dalila Fine Designs" />
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>☰</button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
          <a href="#new" onClick={() => setMenuOpen(false)}>New drops</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>Meet Dalila</a>
          <a href="#custom" onClick={() => setMenuOpen(false)}>Custom designs</a>
        </nav>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open bag with ${cart.length} items`}>
          <span aria-hidden="true">♡</span> Bag <b>{cart.length}</b>
        </button>
      </header>
      {checkoutStatus && (
        <div className={`checkout-notice ${checkoutStatus}`} role="status">
          <span>{checkoutStatus === "success" ? "♥" : "←"}</span>
          <p><strong>{checkoutStatus === "success" ? "Thank you for your order!" : "Your checkout was canceled."}</strong>{checkoutStatus === "success" ? " Your payment was received by Stripe." : " Your items are still in your bag."}</p>
          <button onClick={() => setCheckoutStatus("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className="hero" id="top" aria-roledescription="carousel" aria-label="Dalila's story">
        {slides.map((item, index) => (
          <div className={`${index === slide ? "hero-slide active" : "hero-slide"} ${index === 0 ? "branded-slide video-slide" : ""}`} key={item.image} aria-hidden={index !== slide}>
            {item.video ? (
              <video className="hero-video" autoPlay muted loop playsInline preload="metadata" poster={item.image} aria-label="Dalila Fine Designs introduction video">
                <source src={item.video} type="video/mp4" />
              </video>
            ) : (
              <img src={item.image} alt={index === 1 ? "Dalila carefully crafting a jewelry piece" : "Dalila wearing blue heart earrings at her worktable"} />
            )}
            <div className="hero-shade" />
            <img className="hero-logo" src="/images/dalila-logo.png" alt="Dalila Fine Designs" />
            <div className="hero-copy">
              <p className="eyebrow">{item.eyebrow}</p>
              <h1>{item.title}</h1>
              <p>{item.copy}</p>
              <a className="button button-pink" href="#shop">Shop the happy</a>
            </div>
          </div>
        ))}
        <button className="slide-arrow prev" onClick={() => goToSlide(slide - 1)} aria-label="Previous slide">‹</button>
        <button className="slide-arrow next" onClick={() => goToSlide(slide + 1)} aria-label="Next slide">›</button>
        <div className="slide-dots" role="group" aria-label="Choose slide">
          {slides.map((_, index) => <button key={index} className={index === slide ? "active" : ""} onClick={() => goToSlide(index)} aria-label={`Show slide ${index + 1}`} />)}
        </div>
      </section>

      <section className="category-section section" aria-labelledby="category-title">
        <p className="kicker">Pick your happy</p>
        <h2 id="category-title">Shop by category</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <a href="#shop" className={`category-card ${category.className}`} key={category.name}>
              <span className="category-symbol" aria-hidden="true">{category.symbol}</span>
              <h3>{category.name}</h3>
              <p>{category.copy}</p>
              <span className="circle-link">→</span>
            </a>
          ))}
        </div>
      </section>

      <section className="products-section section" id="shop" aria-labelledby="products-title">
        <div className="section-heading">
          <div><p className="kicker">Fresh from the studio</p><h2 id="products-title">Dalila’s favorites</h2></div>
          <a href="#shop" className="text-link">See all designs →</a>
        </div>
        <div className="product-grid" id="new">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <div className={`product-art ${product.color} ${product.image ? "has-photo" : ""}`}>
                {product.badge && <span className="product-badge">{product.badge}</span>}
                {product.image ? (
                  <img className="product-photo" src={product.image} alt={product.name} />
                ) : (
                  <div className={`jewel jewel-${product.shape}`} aria-hidden="true"><i /><i /><i /></div>
                )}
                <button className="heart-button" aria-label={`Save ${product.name}`}>♡</button>
              </div>
              <div className="product-info">
                <div><p>{product.category}</p><h3>{product.name}</h3><strong>{product.price}</strong></div>
              </div>
              {product.comingSoon ? (
                <button className="product-soon-button" disabled aria-label={`${product.name} is coming soon`}>Coming soon</button>
              ) : (
                <button className="product-add-button" onClick={() => addToCart(product.name)} aria-label={`Add ${product.name} to bag`}>Add to Bag <span>+</span></button>
              )}
            </article>
          ))}
        </div>
      </section>

      {merchProducts.length > 0 && (
        <section className="products-section merch-section section" id="merch" aria-labelledby="merch-title">
          <div className="section-heading">
            <div><p className="kicker">Wear the happy</p><h2 id="merch-title">Dalila Fine Designs merch</h2></div>
            <span className="text-link">Printed & shipped by Printful</span>
          </div>
          <div className="product-grid merch-grid">
            {merchProducts.slice(0, 4).map((product) => {
              const selectedId = selectedMerchVariants[product.id] ?? product.variants[0].id;
              const selected = product.variants.find((variant) => variant.id === selectedId) ?? product.variants[0];
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-art mint has-photo">
                    <span className="product-badge">Logo merch</span>
                    <img className="product-photo merch-photo" src={getMerchMockup(product.name, selected.name, selected.image || product.image)} alt={`${selected.name} mockup`} />
                  </div>
                  <div className="product-info"><div><p>Printful merch</p><h3>{product.name}</h3><strong>${selected.retailPrice.toFixed(2)}</strong></div></div>
                  <label className="merch-variant-label" htmlFor={`merch-variant-${product.id}`}>Choose size / style</label>
                  <select className="merch-variant-select" id={`merch-variant-${product.id}`} value={selected.id} onChange={(event) => setSelectedMerchVariants((current) => ({ ...current, [product.id]: Number(event.target.value) }))}>
                    {product.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.name} — ${variant.retailPrice.toFixed(2)}</option>)}
                  </select>
                  <button className="product-add-button" onClick={() => addToCart(`printful:${selected.id}`)} aria-label={`Add ${selected.name} to bag`}>Add selected size to Bag <span>+</span></button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="about section" id="about">
        <div className="about-image">
          <img src="/images/dalila-making-2.jpg" alt="Dalila making a piece of jewelry by hand" />
          <span className="about-sticker">Made with<br /><b>♥</b><br />by Dalila</span>
        </div>
        <div className="about-copy">
          <p className="kicker">Meet the maker</p>
          <h2>Hi, I’m Dalila!</h2>
          <p className="lead">I make colorful jewelry for people who love to be themselves.</p>
          <p>What started as a fun craft at the kitchen table grew into Dalila Fine Designs—a happy little shop filled with hearts, bright colors, and pieces made carefully by hand. No two are exactly alike, and that’s what makes them special.</p>
          <a className="button button-aqua" href="#story">My story</a>
        </div>
      </section>

      <section className="custom section" id="custom">
        <div className="custom-copy">
          <span className="sparkle">✦</span><span className="sparkle second">✦</span>
          <p className="kicker">Dream it. Dalila makes it.</p>
          <h2>Want something one-of-a-kind?</h2>
          <p>Choose your colors, charms, and style. Let’s turn your idea into jewelry that feels completely you.</p>
          <span className="button button-dark custom-coming-soon" aria-disabled="true">Custom designs coming soon</span>
        </div>
        <div className="custom-shapes" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>

      <section className="newsletter section">
        <div><p className="kicker">Join the color club</p><h2>New drops, happy mail & studio peeks.</h2></div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="Your email address" required />
          <button type="submit">Count me in!</button>
        </form>
      </section>

      <footer>
        <div className="footer-brand"><img src="/images/dalila-logo.png" alt="" /><p>Handmade jewelry. Big happy energy.</p></div>
        <div><h3>Shop</h3><a href="#shop">All designs</a><a href="#new">New drops</a><a href="#custom">Custom designs</a></div>
        <div><h3>Say hello</h3><a href="mailto:hello@dalilafinedesigns.com">Email Dalila</a><a href="#social">Instagram</a><a href="#social">TikTok</a></div>
        <div><h3>Good to know</h3><a href="#shipping">Shipping & returns</a><a href="#care">Jewelry care</a><a href="#faq">FAQ</a></div>
        <p className="copyright">© 2026 Dalila Fine Designs. Made with ♥ and lots of color.</p>
      </footer>

      <div className={cartOpen ? "cart-backdrop open" : "cart-backdrop"} onClick={() => setCartOpen(false)} />
      <aside className={cartOpen ? "cart-drawer open" : "cart-drawer"} aria-label="Shopping bag" aria-hidden={!cartOpen}>
        <div className="cart-title"><div><p className="kicker">Your picks</p><h2>Happy bag <span>({cart.length})</span></h2></div><button onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>
        {cart.length === 0 ? <div className="empty-cart"><span>♡</span><h3>Your bag is waiting!</h3><p>Add a little color to your day.</p><button className="button button-pink" onClick={() => setCartOpen(false)}>Keep shopping</button></div> : <>
          <div className="cart-items">{cart.map((item, index) => <div className="cart-item" key={`${item}-${index}`}><span>♥</span><p>{cartLabel(item)}<small>{item.startsWith("printful:") ? "Printed and shipped by Printful" : "Handmade with happy"}</small></p><button onClick={() => setCart(items => items.filter((_, i) => i !== index))} aria-label={`Remove ${cartLabel(item)}`}>×</button></div>)}</div>
          <div className="cart-footer">
            <div className="cart-total"><span>Subtotal</span><strong>${cartSubtotal.toFixed(2)}</strong></div>
            <p>Shipping and taxes are calculated securely by Stripe.</p>
            {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
            <button className="button button-dark" onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? "Opening secure checkout…" : "Checkout with Stripe"}</button>
            <small className="secure-checkout">Secure payment powered by Stripe</small>
          </div>
        </>}
      </aside>
    </main>
  );
}
