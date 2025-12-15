import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  Link,
  BrowserRouter,
} from "react-router-dom";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ========= Helpers ========= */
// Build URLs that respect Vite's BASE_URL (works locally and on GitHub Pages)
const withBase = (p) => new URL(p, import.meta.env.BASE_URL).href;

/* ========= Product data =========
   Put all images in /public/images
*/
const PRODUCTS = [
  {
    id: "iphone-17-pro",
    name: "Aictronics Phone Pro",
    heroTitle: "Aictronics Phone Pro",
    tagline: "All out Pro.",
    descriptionShort:
      "Stunning triple-camera system. OLED display. Built for creators and power users.",
    descriptionLong:
      "Aictronics Phone Pro features a pro-grade triple-camera system, a 120Hz OLED display, and all-day battery life. Designed for creators, gamers, and anyone who wants the very best.",
    price: 1199,
    image: withBase("images/iphone17pro.png"),
    theme: "dark",
    eyebrow: "New",
  },
  {
    id: "iphone-air",
    name: "Aictronics Phone Air",
    heroTitle: "Aictronics Phone Air",
    tagline: "Thin. Light. Powerful.",
    descriptionShort:
      "The thinnest Aictronics phone ever, with all-day battery life.",
    descriptionLong:
      "Phone Air packs serious performance into an incredibly thin and light design. Perfect for people who want power that practically disappears in your hand.",
    price: 999,
    image: withBase("images/iphone-air.jpeg"),
    theme: "light",
    eyebrow: "New",
    fit: "contain",
  },
  {
    id: "macbook-pro-m5",
    name: "Aictronics ProBook M5",
    heroTitle: "Aictronics ProBook M5",
    tagline: "Supercharged by M5.",
    descriptionShort:
      "Next-gen performance and battery life in a sleek aluminum body.",
    descriptionLong:
      "ProBook M5 brings workstation-class performance to a slim notebook. Edit 8K video, build games, and run heavy workflows with ease.",
    price: 1999,
    image: withBase("images/macbookprom5.jpeg"),
    theme: "dark",
    eyebrow: "Powerhouse",
  },
  {
    id: "airpods-pro-3",
    name: "Aictronics Buds Pro 3",
    heroTitle: "Aictronics Buds Pro 3",
    tagline: "Hear the future.",
    descriptionShort:
      "Immersive sound with Active Noise Cancellation and AI voice clarity.",
    descriptionLong:
      "Buds Pro 3 deliver rich, immersive audio with powerful ANC, transparency mode, and AI-powered voice isolation so you sound clear on every call.",
    price: 299,
    image: withBase("images/airpodspro-3.jpeg"),
    theme: "light",
    eyebrow: "Now available",
  },
];

const FEATURED_SECTIONS = PRODUCTS.map((p) => ({
  id: p.id,
  title: p.heroTitle,
  tagline: p.tagline,
  description: p.descriptionShort,
  theme: p.theme,
  eyebrow: p.eyebrow,
  primaryCta: "Learn more",
  secondaryCta: "Buy",
  image: p.image,
}));

/* ========= Cart context (with localStorage) ========= */
const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("aictronics-cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("aictronics-cart", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addToCart = (productId, quantity = 1) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId,
          name: product.name,
          price: product.price,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, quantity) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
function useCart() {
  return useContext(CartContext);
}

/* ========= Page fade wrapper (route transition) ========= */
function PageFade({ children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return <div className={`route-fade ${show ? "in" : ""}`}>{children}</div>;
}

/* ========= Global ripple on buttons (pointerdown) ========= */
function useGlobalButtonRipple() {
  useEffect(() => {
    const onDown = (e) => {
      const target = e.target.closest(
        ".btn-primary, .btn-secondary, .hero-cta, .nav-icon-button, .row-card, .link"
      );
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const cx =
        (e.clientX ?? e.touches?.[0]?.clientX ?? rect.left + rect.width / 2) -
        rect.left;
      const cy =
        (e.clientY ?? e.touches?.[0]?.clientY ?? rect.top + rect.height / 2) -
        rect.top;

      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${cx - size / 2}px`;
      ripple.style.top = `${cy - size / 2}px`;

      const computed = window.getComputedStyle(target);
      if (computed.position === "static") target.style.position = "relative";
      if (computed.overflow !== "hidden") target.style.overflow = "hidden";

      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
}

/* ========= Fullscreen hero component ========= */
function ProductHero({ section, index }) {
  const isDark = section.theme === "dark";
  const ref = useRef(null);
  const [visible, setVisible] = useState(index === 0);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={section.id}
      className={`hero-full ${
        isDark ? "hero-dark" : "hero-light"
      } ${visible ? "hero-visible" : ""}`}
      style={{ backgroundImage: `url(${section.image})` }}
    >
      <div className="hero-overlay">
        {section.eyebrow && <p className="hero-eyebrow">{section.eyebrow}</p>}
        <h1 className="hero-heading">{section.title}</h1>
        <p className="hero-tagline">{section.tagline}</p>
        <p className="hero-description">{section.description}</p>
        <div className="hero-cta-row">
          <button
            className="hero-cta hero-cta-filled"
            onClick={() => navigate(`/product/${section.id}`)}
          >
            {section.primaryCta}
          </button>
          <button
            className="hero-cta hero-cta-outline"
            onClick={() => navigate(`/product/${section.id}#buy`)}
          >
            {section.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ========= Full-screen Apple TV–style carousel ========= */
function ProductCarousel() {
  const navigate = useNavigate();
  const slides = PRODUCTS;
  const loopSlides = [slides[slides.length - 1], ...slides, slides[0]];

  const trackRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [index, setIndex] = useState(1);        // first real slide
  const [animate, setAnimate] = useState(true); // toggle css transition
  const autoRef = useRef(null);
  const pointer = useRef({ dragging: false, startX: 0, offsetX: 0 });

  // measure based on viewport width
  useEffect(() => {
    const handleResize = () => setSlideWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // auto-rotate
  useEffect(() => {
    if (!slideWidth) return;
    stopAuto();
    autoRef.current = setInterval(() => next(), 5000);
    return stopAuto;
  }, [slideWidth]);

  const stopAuto = () => autoRef.current && clearInterval(autoRef.current);
  const next = () => setIndex((i) => i + 1);
  const prev = () => setIndex((i) => i - 1);

  // edge snapping (clone -> real)
  const handleTransitionEnd = () => {
    if (index === loopSlides.length - 1) {
      setAnimate(false);
      setIndex(1);
      requestAnimationFrame(() => setAnimate(true));
    }
    if (index === 0) {
      setAnimate(false);
      setIndex(loopSlides.length - 2);
      requestAnimationFrame(() => setAnimate(true));
    }
  };

  // drag/swipe
  const onPointerDown = (e) => {
    stopAuto();
    pointer.current.dragging = true;
    pointer.current.startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    pointer.current.offsetX = 0;
  };
  const onPointerMove = (e) => {
    if (!pointer.current.dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    pointer.current.offsetX = x - pointer.current.startX;
    const px = -index * slideWidth + pointer.current.offsetX;
    trackRef.current.style.transform = `translateX(${px}px)`;
    trackRef.current.style.transition = "none";
  };
  const onPointerUp = () => {
    if (!pointer.current.dragging) return;
    pointer.current.dragging = false;
    trackRef.current.style.transition = "";
    const threshold = slideWidth * 0.15;
    if (pointer.current.offsetX <= -threshold) next();
    else if (pointer.current.offsetX >= threshold) prev();
    else setIndex((i) => i);
    autoRef.current = setInterval(() => next(), 5000);
  };

  const offset = -index * slideWidth;

  return (
    <section className="carousel-section fullscreen-carousel">
      <div
        className="tv-carousel-shell"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        <div
          ref={trackRef}
          className="tv-carousel-track"
          style={{
            transform: `translateX(${offset}px)`,
            transition: animate
              ? "transform 0.8s cubic-bezier(0.33,1,0.68,1)"
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopSlides.map((product, i) => (
            <div key={`${product.id}-${i}`} className="tv-slide">
              <div
                className="tv-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="tv-image-wrap">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`tv-image ${
                      product.fit === "contain" ? "fit-contain" : ""
                    }`}
                  />
                </div>

                <div className="tv-text">
                  <p className="tv-eyebrow">{product.tagline}</p>
                  <h3 className="tv-title">{product.name}</h3>
                  <p className="tv-description">{product.descriptionShort}</p>
                  <p className="tv-price">
                    From{" "}
                    <span>
                      $
                      {product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </p>

                  <div className="tv-cta-row">
                    <button
                      className="hero-cta hero-cta-filled"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                    >
                      Learn more
                    </button>
                    <button
                      className="hero-cta hero-cta-outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}#buy`);
                      }}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="carousel-arrows">
          <button aria-label="Prev" onClick={prev}>
            ‹
          </button>
          <button aria-label="Next" onClick={next}>
            ›
          </button>
        </div>

        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i + 1 === index ? "active" : ""}`}
              onClick={() => setIndex(i + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========= Smaller horizontal product row ========= */
function ProductRowStrip() {
  const navigate = useNavigate();

  return (
    <section className="row-strip-section">
      <div className="content-container row-strip-inner">
        <div className="row-strip-header">
          <h2>Explore more</h2>
          <p className="muted light">
            A quick look at the rest of the Aictronics family. Scroll sideways
            and tap any product to learn more.
          </p>
        </div>

        <div className="row-strip-track">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              className="row-card"
              type="button"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="row-card-image-wrap">
                <img
                  src={product.image}
                  alt={product.name}
                  className="row-card-image"
                />
              </div>
              <div className="row-card-text">
                <p className="row-card-name">{product.name}</p>
                <p className="row-card-price">
                  $
                  {product.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========= Pages ========= */
function HomePage() {
  return (
    <>
      {FEATURED_SECTIONS.map((section, index) => (
        <ProductHero key={section.id} section={section} index={index} />
      ))}
      <ProductCarousel />
      <ProductRowStrip />
    </>
  );
}

function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const product = PRODUCTS.find((p) => p.id === productId);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) navigate("/");
  }, [product, navigate]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product.id, quantity);
    navigate("/cart");
  };

  return (
    <section className="page-section">
      <div className="content-container product-layout" id="buy">
        <div className="product-media">
          <img
            src={product.image}
            alt={product.name}
            className="product-image-large"
          />
        </div>
        <div className="product-info">
          <p className="product-eyebrow">Aictronics</p>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-tagline">{product.tagline}</p>
          <p className="product-description">{product.descriptionLong}</p>
          <p className="product-price">
            $
            {product.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>

          <div className="product-quantity-row">
            <label>
              Quantity
              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                  }
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </label>
          </div>

          <div className="product-actions">
            <button className="btn-primary" onClick={handleAdd}>
              Add to Cart
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/cart")}
            >
              Go to Cart
            </button>
          </div>

          <p className="product-note">
            Free delivery · 14-day returns · 1-year limited warranty.
          </p>
        </div>
      </div>
    </section>
  );
}

function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } =
    useCart();
  const navigate = useNavigate();

  return (
    <section className="page-section">
      <div className="content-container">
        <h1 className="section-title">Your Cart</h1>

        {items.length === 0 ? (
          <p className="muted">
            Your cart is empty.{" "}
            <Link to="/" className="link">
              Continue shopping
            </Link>
            .
          </p>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div>
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">
                      $
                      {item.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls small">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="link"
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="link small-link"
                type="button"
                onClick={clearCart}
              >
                Clear cart
              </button>
            </div>

            <aside className="cart-summary">
              <h2>Summary</h2>
              <p className="cart-summary-line">
                Subtotal{" "}
                <span>
                  $
                  {subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
              <p className="cart-summary-note">
                Taxes and shipping will be calculated at checkout.
              </p>
              <button
                className="btn-primary full-width"
                type="button"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </button>
              <button
                className="btn-secondary full-width"
                type="button"
                onClick={() => navigate("/")}
              >
                Continue shopping
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const handleGuestCheckout = () => {
    clearCart();
    alert("Thank you for your purchase! (Demo checkout)");
    navigate("/");
  };

  return (
    <section className="page-section">
      <div className="content-container">
        <h1 className="section-title">Checkout</h1>

        {items.length === 0 ? (
          <p className="muted">
            Your cart is empty.{" "}
            <Link to="/" className="link">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="checkout-layout">
              <div className="checkout-column">
                <h2>Checkout as guest</h2>
                <p className="muted">
                  No account needed. We’ll ask for your shipping and payment
                  details on the next step.
                </p>
                <button
                  className="btn-primary full-width"
                  type="button"
                  onClick={handleGuestCheckout}
                >
                  Continue as guest
                </button>
              </div>

              <div className="checkout-column">
                <h2>Sign in</h2>
                <p className="muted">
                  In a real store, this would let users see saved addresses and
                  orders.
                </p>
                <form
                  className="login-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(
                      "Login is a visual demo only. You can connect real auth later."
                    );
                  }}
                >
                  <input type="email" placeholder="Email" required />
                  <input type="password" placeholder="Password" required />
                  <button className="btn-secondary full-width" type="submit">
                    Sign in
                  </button>
                </form>
              </div>
            </div>

            <div className="order-summary">
              <h2>Order summary</h2>
              <ul>
                {items.map((item) => (
                  <li key={item.productId}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      $
                      {(item.price * item.quantity).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="cart-summary-line total">
                Total{" "}
                <span>
                  $
                  {subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ========= Header & Footer ========= */
function Header() {
  const { totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button className="nav-logo-button" onClick={() => navigate("/")}>
          AICTRONICS
        </button>

        <nav className="nav-links">
          <a
            href="#iphone-17-pro"
            onClick={(e) => {
              e.preventDefault();
              navigate("/#iphone-17-pro");
            }}
          >
            Phone Pro
          </a>
        <a
            href="#iphone-air"
            onClick={(e) => {
              e.preventDefault();
              navigate("/#iphone-air");
            }}
          >
            Phone Air
          </a>
          <a
            href="#macbook-pro-m5"
            onClick={(e) => {
              e.preventDefault();
              navigate("/#macbook-pro-m5");
            }}
          >
            Laptop
          </a>
          <a
            href="#airpods-pro-3"
            onClick={(e) => {
              e.preventDefault();
              navigate("/#airpods-pro-3");
            }}
          >
            Buds
          </a>
        </nav>

        <div className="nav-icons">
          <button
            className="nav-icon-button"
            type="button"
            onClick={() => navigate("/cart")}
          >
            🛒
            {totalItems > 0 && (
              <span className="cart-count-badge">{totalItems}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>© {year} Aictronics Inc. All rights reserved.</p>
        <p className="footer-sub">
          Demo store inspired by Apple’s product storytelling. No real orders
          are processed.
        </p>
      </div>
    </footer>
  );
}

/* ========= App root ========= */
function AppShell() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  // enable smooth scrolling for #hash links in nav
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  // set CSS var for sticky nav height so fullscreen carousel isn't hidden
  useEffect(() => {
    const setNavVar = () => {
      const nav = document.querySelector(".top-nav");
      const h = nav?.offsetHeight || 56;
      document.documentElement.style.setProperty("--nav-h", `${h}px`);
    };
    setNavVar();
    window.addEventListener("resize", setNavVar);
    return () => window.removeEventListener("resize", setNavVar);
  }, []);

  // global ripple for buttons/cards/links
  useGlobalButtonRipple();

  return (
    <CartProvider>
      <div className="page">
        <Header />
        <main className={isHome ? "main-snap" : "main-normal"}>
          {/* key forces PageFade on each path change */}
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageFade><HomePage /></PageFade>} />
            <Route path="/product/:productId" element={<PageFade><ProductPage /></PageFade>} />
            <Route path="/cart" element={<PageFade><CartPage /></PageFade>} />
            <Route path="/checkout" element={<PageFade><CheckoutPage /></PageFade>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

/* Export default component. */
export default function App() {
  // If your main.jsx already has <BrowserRouter>, return <AppShell /> here:
  return <AppShell />;

  // If your main.jsx DOES NOT wrap with <BrowserRouter>, use this version:
  // return (
  //   <BrowserRouter>
  //     <AppShell />
  //   </BrowserRouter>
  // );
}