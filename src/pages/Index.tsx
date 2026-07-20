import { Link } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, ShieldCheck, Syringe, Zap, Droplet, HeartPulse, Star, ArrowRight } from "lucide-react";
import { usePreferredLocation } from "@/hooks/usePreferredLocation";
import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

import { supabase } from "@/integrations/supabase/client";
import GoogleReviewBadge from "@/components/GoogleReviewBadge";


const WHAT_WE_DO = [
  { icon: Syringe, title: "Injectables", desc: "Botox, filler, lip enhancement", href: "/services#injectables" },
  { icon: Zap, title: "Lasers & Energy", desc: "Hair removal, IPL, resurfacing", href: "/services#lasers" },
  { icon: Droplet, title: "Skin & Facials", desc: "Peels, microneedling, glow", href: "/services#skin" },
  { icon: HeartPulse, title: "Medical Wellness", desc: "GLP-1, HRT, peptides", href: "/services#wellness" },
];

// Fallback reviews shown only if the live testimonials view hasn't loaded yet
// (or returns empty). The /reviews page reads the same `public_testimonials`
// view, so the homepage strip and the full list now stay in sync.
const FALLBACK_REVIEWS = [
  { quote: "Kiem is incredibly skilled and made me feel completely at ease. Natural results, every time.", author: "Sarah M.", location: "San Jose" },
  { quote: "Honest recommendations — they'll tell you when you don't need something. That earned my trust.", author: "Priya R.", location: "San Jose" },
  { quote: "The space is gorgeous and the care is next level. Worth every mile of the drive.", author: "Jessica L.", location: "San Jose" },
];
type LiveReview = { id: string; quote: string; author: string; location: string };

const Index = () => {
  usePageMeta({
    title: "Radiantilyk Aesthetic — Medspa in San Jose",
    description: "Botox, filler, lasers, facials, GLP-1 wellness at our San Jose medspa. Book online with Radiantilyk Aesthetic.",
    canonical: "https://bookrka.com/",
    ogType: "website",
  });

  const { location } = usePreferredLocation();
  const bookHref = `/book?location=${location.id}`;
  const [placeIds, setPlaceIds] = useState<{ sj: string | null; sjUrl: string | null }>(
    { sj: null, sjUrl: null },
  );
  const [liveReviews, setLiveReviews] = useState<LiveReview[] | null>(null);
  const [rotationOffset, setRotationOffset] = useState(0);
  useEffect(() => {
    supabase.from("locations").select("slug, google_place_id, google_review_url").eq("slug", "san-jose")
      .then(({ data }) => {
        const sj = (data ?? []).find((r: any) => r.slug === "san-jose");
        setPlaceIds({
          sj: sj?.google_place_id ?? null,
          sjUrl: sj?.google_review_url ?? null,
        });
      });
    // Pull a larger pool of verified 5-star testimonials so the homepage strip
    // can rotate through every featured client review instead of showing the
    // same 3 forever.
    supabase
      .from("public_testimonials" as any)
      .select("id, comment, first_name, location_city, rating")
      .eq("rating", 5)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!data || data.length === 0) return; // keep fallback
        setLiveReviews(
          (data as any[]).map((t) => ({
            id: t.id,
            quote: t.comment,
            author: t.first_name || "Verified guest",
            location: t.location_city || "Radiantilyk Aesthetic",
          })),
        );
      });
  }, []);
  const reviewPool = liveReviews ?? FALLBACK_REVIEWS.map((r, i) => ({ id: `fb-${i}`, ...r }));
  // Rotate the 3 featured cards every 7s so every client review gets airtime.
  useEffect(() => {
    if (reviewPool.length <= 3) return;
    const t = setInterval(() => {
      setRotationOffset((o) => (o + 3) % reviewPool.length);
    }, 7000);
    return () => clearInterval(t);
  }, [reviewPool.length]);
  const reviewsToShow = reviewPool.length <= 3
    ? reviewPool
    : Array.from({ length: 3 }, (_, i) => reviewPool[(rotationOffset + i) % reviewPool.length]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />




      {/* Hero — editorial minimalist chic */}
      <section className="relative w-full bg-background flex items-center justify-center px-6 py-12 sm:py-20">
        <div className="relative w-full max-w-[420px] sm:max-w-[480px] aspect-[9/16] overflow-hidden flex flex-col justify-between p-8 sm:p-10 border border-primary/15 bg-background">
          {/* Decorative corner frames */}
          <div className="pointer-events-none absolute top-0 right-0 w-24 h-24 border-t border-r border-primary/20 m-4" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-24 h-24 border-b border-l border-primary/20 m-4" />

          {/* Film grain overlay */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.10] mix-blend-multiply"
          >
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-grain)" />
          </svg>

          {/* Top — brand identity */}
          <header className="relative flex flex-col items-center gap-2">
            <p className="text-primary text-[10px] font-light tracking-luxury uppercase leading-none">
              Radiantilyk Aesthetic
            </p>
            <div className="w-px h-10 bg-primary/30" />
          </header>

          {/* Middle — the ritual (left-aligned, editorial) */}
          <div className="relative">
            <h1 className="font-serif text-foreground text-5xl sm:text-6xl leading-[1.05] font-light tracking-tight">
              A quiet<br/>
              <span className="italic font-light text-primary">ritual</span><br/>
              of refinement.
            </h1>

            <div className="mt-10 flex flex-col gap-1 border-l border-primary pl-4">
              <p className="text-muted-foreground text-[11px] uppercase tracking-widest font-light">
                Considered Care
              </p>
              <p className="text-foreground text-xs font-medium tracking-wider">
                SAN JOSE
              </p>
            </div>
          </div>

          {/* Bottom — action */}
          <footer className="relative w-full space-y-6">
            <div className="flex justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
            </div>

            <Button
              asChild
              className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground py-5 h-auto text-[11px] font-medium tracking-[0.25em] uppercase shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
            >
              <Link to={bookHref}>Book an Appointment</Link>
            </Button>
          </footer>
        </div>
      </section>

      {/* What we do — fast orientation for first-time visitors */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-primary mb-3">What we do</p>
              <h2 className="font-serif text-3xl sm:text-4xl">Treatments, simply.</h2>
            </div>
            <Link to="/services" className="text-sm text-primary hover:opacity-80 inline-flex items-center gap-1">
              See full menu & pricing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {WHAT_WE_DO.map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={title}
                to={href}
                className="group rounded-2xl border border-border bg-background p-5 sm:p-6 hover:border-primary hover:shadow-soft transition"
              >
                <Icon className="h-5 w-5 text-primary mb-4" strokeWidth={1.4} />
                <div className="font-serif text-lg sm:text-xl mb-1.5">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                <div className="mt-3 text-[10px] uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why — hairline cards, no shadow */}
      <section className="container mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-primary mb-6">Our Philosophy</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-balance">
            Beauty, considered.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {[
            { icon: ShieldCheck, t: "Medical Expertise", d: "Led by Board-Certified Nurse Practitioner Kiem Vukadinovic and our medical team." },
            { icon: Sparkles, t: "Advanced Technology", d: "Premium injectables and clinical-grade lasers for natural, lasting results." },
            { icon: Calendar, t: "Effortless Booking", d: "Reserve in under a minute. No deposit charged — card is only used for no-shows." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-background p-10 sm:p-12">
              <Icon className="h-5 w-5 text-primary mb-8" strokeWidth={1.2} />
              <h3 className="font-serif text-2xl sm:text-3xl mb-4">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Director — Dr. Fobi */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-6 py-20 sm:py-28">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="order-2 md:order-1">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-primary mb-4">Medical Director</p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-6 text-balance">
                Dr. Aloysius N. Fobi, <span className="italic">MD, F.A.C.E.P., A.B.E.M.</span>
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                <p>
                  Our Medical Director, Dr. Aloysius N. Fobi, MD, F.A.C.E.P., A.B.E.M., ensures the highest
                  standard of care — bringing expertise and leadership in aesthetic medicine to every treatment.
                </p>
                <p>
                  Dr. Fobi is a board-certified medical doctor with over two decades of experience in medicine.
                  His extensive background in emergency medicine and aesthetic procedures allows him to provide
                  advanced, safe, and effective treatments.
                </p>
                <p>
                  In addition to his medical expertise, Dr. Fobi has specialized training in aesthetic medicine.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative aspect-[4/5] max-w-md mx-auto md:ml-auto md:mr-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                <img
                  src="/__l5e/assets-v1/8be2657f-9188-4477-82d7-914fb9ff5011/dr-fobi.jpg"
                  alt="Dr. Aloysius N. Fobi, MD — Medical Director at Radiantilyk Aesthetic"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Reviews — social proof */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-12">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-primary mb-3">From our clients</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-5">In their words.</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <GoogleReviewBadge placeId={placeIds.sj} fallbackUrl={placeIds.sjUrl ?? "https://g.page/r/CSd3Q5ZmyEyKEBM/review"} />
            </div>

          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {reviewsToShow.map((r) => (
              <figure key={r.id} className="rounded-2xl border border-border bg-background p-6 sm:p-8 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[0,1,2,3,4].map(j => <Star key={j} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />)}
                </div>
                <blockquote className="font-serif text-lg leading-relaxed text-pretty flex-1">
                  "{r.quote}"
                </blockquote>
                <figcaption className="mt-5 pt-5 border-t border-border text-xs">
                  <div className="font-medium">{r.author}</div>
                  <div className="text-muted-foreground">{r.location}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="text-center mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://g.page/r/CSd3Q5ZmyEyKEBM/review"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:opacity-80 inline-flex items-center gap-1"
            >
              Read San Jose reviews <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* CTA — quiet, no gradient */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 py-24 sm:py-36 text-center">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-primary mb-6">Reserve</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-10 text-balance">Begin the ritual.</h2>
          <Button asChild size="lg" className="rounded-none text-xs uppercase tracking-[0.3em] px-10 h-12 font-normal">
            <Link to={bookHref}>Book Your Appointment</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
