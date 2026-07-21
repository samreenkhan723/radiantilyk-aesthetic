import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MapPin, Phone, Menu, X } from "lucide-react";
import rkaLogo from "@/assets/rka-logo.webp";
import ThemeToggle from "@/components/ThemeToggle";
import NewsletterSignup from "@/components/NewsletterSignup";

export const SiteHeader = ({ isPortal = false }: { isPortal?: boolean }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Skip-to-content: focuses the first <main> on the page without requiring
  // every route to thread an id. Visually hidden until keyboard-focused.
  const skipToMain: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) return;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: false });
    main.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <>
      <a
        href="#main-content"
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
      >
        Skip to main content
      </a>
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="hidden md:block bg-secondary/50 text-xs">
        <div className="container mx-auto flex items-center justify-between py-2 text-muted-foreground">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> San Jose · 2100 Curtner Ave, Ste 1B</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="sms:+14083511873" className="hover:text-foreground">Text us</a>
            <span className="opacity-30">·</span>
            <a href="tel:4083511873" className="flex items-center gap-1.5 hover:text-foreground"><Phone className="h-3 w-3" /> 408 · 351 · 1873</a>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 flex items-center justify-between py-4 gap-3">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 leading-tight min-w-0 md:mr-auto">
          <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow-soft shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-lg sm:text-2xl tracking-wide truncate">
              <span className="sm:hidden">Radiantilyk</span>
              <span className="hidden sm:inline">Radiantilyk Aesthetic</span>
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Medspa</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {!isPortal && (
            <>
              <NavLink to="/" end className={({isActive}) => isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition"}>Home</NavLink>
              <NavLink to="/services" className={({isActive}) => isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition"}>Services & Pricing</NavLink>
              <NavLink to="/account" className={({isActive}) => isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition"}>My Account</NavLink>
            </>
          )}
          <ThemeToggle />
          <NavLink to="/book" className="rounded-full bg-primary px-5 py-2 text-primary-foreground hover:opacity-90 transition shadow-soft">Book Appointment</NavLink>
        </nav>
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <Link to="/book" className="rounded-full bg-primary px-3.5 py-2 text-sm text-primary-foreground">Book</Link>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="relative z-50 inline-flex items-center justify-center h-12 w-12 -mr-2 rounded-full border border-border bg-background text-foreground active:scale-95 touch-manipulation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>


      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-3 flex flex-col text-sm">
            {!isPortal && (
              <>
                <NavLink to="/services" className="py-3 border-b border-border">Services & Pricing</NavLink>
                <NavLink to="/account" className="py-3 border-b border-border">My Account</NavLink>
                <NavLink to="/faq" className="py-3 border-b border-border">FAQ</NavLink>
              </>
            )}
            <NavLink to="/book" className="py-3 border-b border-border">Book Appointment</NavLink>

            <a href="tel:4083511873" className="py-3 flex items-center gap-2 text-muted-foreground border-b border-border"><Phone className="h-3.5 w-3.5" /> Call 408 · 351 · 1873</a>
            <a href="sms:+14083511873" className="py-3 flex items-center gap-2 text-muted-foreground border-b border-border">💬 Text us</a>
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  );
};

export const SiteFooter = () => (
  <footer className="border-t border-border mt-20">
    <div className="container mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3 text-sm">
      <div>
        <div className="flex items-center gap-2.5">
          <img src={rkaLogo} alt="Radiantilyk Aesthetic" className="h-10 w-10 rounded-full object-cover" />
          <div className="font-serif text-xl">Radiantilyk Aesthetic</div>
        </div>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">A quiet ritual of refinement. Luxury medspa in San Jose.</p>
      </div>
      <div>
        <div className="font-medium mb-3">San Jose Studio</div>
        <p className="text-muted-foreground text-xs leading-relaxed">2100 Curtner Ave, Ste 1B<br />San Jose, CA 95124</p>
      </div>

      <div>
        <div className="font-medium mb-3">Contact</div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          <a href="tel:4083511873" className="hover:text-foreground">Call 408 · 351 · 1873</a><br />
          <a href="sms:+14083511873" className="hover:text-foreground">Text us (408 · 351 · 1873)</a><br />
          <a href="mailto:kv@rkaglow.com" className="hover:text-foreground">kv@rkaglow.com</a><br />
          <Link to="/waitlist" className="hover:text-foreground">Join the waitlist</Link>
        </p>
        <Link to="/staff" className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4 inline-block hover:text-foreground">Staff Login</Link>
      </div>

    </div>
    <div className="container mx-auto px-4 pb-10">
      <div className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 max-w-3xl mx-auto">
        <NewsletterSignup />
      </div>
    </div>
    <div className="border-t border-border py-4 text-center text-[11px] text-muted-foreground flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center">
      <span>© {new Date().getFullYear()} Radiantilyk Aesthetic</span>
      <span className="hidden sm:inline">·</span>
      <Link to="/faq" className="hover:text-foreground">FAQ</Link>
      <span className="hidden sm:inline">·</span>
      <Link to="/journal" className="hover:text-foreground">Journal</Link>
      <span className="hidden sm:inline">·</span>
      <Link to="/account?tab=profile" className="hover:text-foreground">Refer & earn</Link>
      <Link to="/privacy" className="hover:text-foreground">Privacy</Link>


      <span className="hidden sm:inline">·</span>
      <Link to="/terms" className="hover:text-foreground">Terms</Link>
    </div>
  </footer>
);
