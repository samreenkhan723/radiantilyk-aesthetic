import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sun, Inbox, Plus, Calendar as CalIcon, Clock, CalendarPlus,
  UserCircle2, Bell, Users, DollarSign, FileText, BarChart3,
  Megaphone, Smartphone, Settings, History, CreditCard, MailCheck,
  ChevronRight, Sparkles, BookOpen, Search, Download,
  Heart, MapPin, Stethoscope, ShieldCheck, Wallet, MessageCircle,
  CalendarCheck, AlertTriangle, Siren, MessageSquare, PenSquare,
  CheckCircle2, Check,
} from "lucide-react";
import hero from "@/assets/help/hero-welcome.jpg";
import imgToday from "@/assets/help/today.jpg";
import imgInbox from "@/assets/help/inbox.jpg";
import imgCalendar from "@/assets/help/calendar.jpg";
import imgCheckout from "@/assets/help/checkout.jpg";
import imgConsents from "@/assets/help/consents.jpg";
import imgPostop from "@/assets/help/postop.jpg";
import imgClients from "@/assets/help/clients.jpg";
import imgMarketing from "@/assets/help/marketing.jpg";
import imgVouchers from "@/assets/help/vouchers.jpg";

type CompanyCard = {
  id: string;
  title: string;
  icon: any;
  body: string;
  bullets?: string[];
};

// Knowledge sourced from radiantilykaesthetics.com — keep current
// whenever brand copy, team, locations, or policies change on the site.
const COMPANY: CompanyCard[] = [
  {
    id: "co-mission",
    title: "Who we are",
    icon: Heart,
    body:
      "Radiantilyk Aesthetic is a luxury medspa founded by NP Kiem. Our promise: a luxurious, welcoming, and professional environment where every client feels comfortable and empowered. Every aesthetic journey is personal — we guide clients with cutting-edge treatments, expert care, and a focus on natural beauty. Trusted by 5,000+ patients across the Bay Area.",
    bullets: [
      "Voice: warm, professional, never pushy. Use first names when invited.",
      "Always say 'Radiantilyk Aesthetic' — never 'RKA Glow', 'RadiantilyK', or abbreviations to clients.",
      "Lead with safety and natural-looking results, not discounts.",
    ],
  },
  {
    id: "co-team",
    title: "The medical team",
    icon: Stethoscope,
    body:
      "All treatments are delivered or overseen by licensed medical professionals — this is the #1 reason clients choose us over a regular spa.",
    bullets: [
      "NP Kiem — Certified Nurse Practitioner & Founder. Performs injectables, laser, and consultations.",
      "Dr. Aloysius N. Fobi, MD, F.A.C.E.P., A.B.E.M. — Board-Certified Medical Director, oversees all medical protocols.",
      "When a client asks 'who will treat me?' name the provider on the appointment and reassure them every service is medically supervised.",
    ],
  },
  {
    id: "co-locations",
    title: "Our two locations",
    icon: MapPin,
    body:
      "We operate two Bay Area locations. Each has its own card reader, calendar, Google review link, and address instructions auto-included in client emails — pick the right location when booking, charging, or sending review requests.",
    bullets: [
      "San Jose — 2100 Curtner Ave, Ste 1B, San Jose CA 95124 (inside the ABDO building). Walk in from the main lot, turn left, Suite B.",
      "San Mateo — 1528 S El Camino Real #0200, San Mateo CA 94402 (inside Hot Yoga Plus). Garage code 7549, bathroom code 542#. Building locked late evenings — text/call 408-351-1873 on arrival.",
      "Kamaren is San Jose only. Kiem and Jonni serve both locations.",
      "Double-check the location field on every appointment before saving.",
    ],
  },
  {
    id: "co-services",
    title: "What we offer",
    icon: Sparkles,
    body:
      "Curated premium aesthetic services. Categories you'll see most:",
    bullets: [
      "Injectables — Botox/Dysport (priced per unit), dermal fillers (priced per syringe).",
      "Laser & energy-based — hair removal, skin tightening, photo facials.",
      "Facials, peels, and medical-grade skincare.",
      "Body & wellness treatments.",
      "Every service has its own consent form(s) and post-op instructions. Both are auto-attached when you book — your job is to make sure consents are signed before treatment starts.",
    ],
  },
  {
    id: "co-financing",
    title: "Treat now, pay later — Cherry & Affirm",
    icon: Wallet,
    body:
      "Many clients use financing for higher-ticket treatments. Mention it whenever price comes up.",
    bullets: [
      "Cherry — soft credit check, no impact on credit score to apply. 0% APR available for qualified buyers.",
      "Affirm — pay-over-time at checkout via a link the client receives.",
      "Use the 'Send financing link' action on the appointment or checkout screen rather than memorizing URLs.",
    ],
  },
  {
    id: "co-policies",
    title: "Policies every staff member must know",
    icon: ShieldCheck,
    body:
      "Non-negotiable. When in doubt, restate them politely — clients respect clarity.",
    bullets: [
      "Cancellation: at least 48 hours notice required.",
      "No-show fee: $200, charged to the card on file. We never collect a booking deposit.",
      "Card on file: required for all appointments. Charged only for no-shows or services received.",
      "Consents must be signed before any treatment begins. The appointment shows a red banner if anything is missing.",
      "Minors are not treated without a legal guardian present and a signed guardian consent.",
    ],
  },
  {
    id: "co-tone",
    title: "Talking to clients (script cues)",
    icon: MessageCircle,
    body:
      "Starting points, not scripts. Adapt to the person in front of you.",
    bullets: [
      "Greeting: 'Welcome to Radiantilyk — would you like water or tea while you wait?'",
      "Card-on-file ask: 'We keep a card securely on file so checkout is fast. We only charge it for the service today or for the $200 no-show fee — never anything else without your okay.'",
      "Late cancellation: 'I understand things come up. Our 48-hour policy means a $200 fee applies — would you like to reschedule instead so you don't lose it?'",
      "Post-treatment: 'You'll get aftercare instructions by email and we'll check in. Call us anytime if something feels off.'",
    ],
  },
];

type Section = {
  id: string;
  title: string;
  icon: any;
  image?: string;
  blurb: string;
  steps: { title: string; body: string }[];
  tips?: string[];
  link?: { to: string; label: string };
};

const SECTIONS: Section[] = [
  {
    id: "today",
    title: "Today — your one-screen command center",
    icon: Sun,
    image: imgToday,
    blurb:
      "Run the entire day from one page. Every appointment is a single row with inline buttons for messaging, check-in, checkout, and marking complete — you almost never need to leave this screen.",
    steps: [
      { title: "Open Today", body: "Click 'Today' in the left sidebar (or press G then T). Appointments are grouped into three sections: In the building (checked in), Coming up (upcoming), and Done (completed or no-show)." },
      { title: "Text a client inline", body: "Tap the chat bubble on any row. A slide-over opens the full SMS thread with that client — read incoming replies and send a message without leaving Today." },
      { title: "Check a client in", body: "When a client arrives, tap the check-circle. Status flips to 'arrived', they move to 'In the building', and the post-op email pre-loads." },
      { title: "Check out", body: "Tap the credit-card icon to jump straight to POS for that appointment with their card on file ready to charge." },
      { title: "Mark complete (no charge)", body: "Tap the green check to mark a service complete without going through POS — useful for comped visits or services already paid." },
      { title: "Open full details", body: "Tap the chevron arrow to open the full appointment for notes, history, consents, and audit trail." },
      { title: "Header shortcuts", body: "Top-right of Today has 'Messages' (jump to all SMS threads) and 'Book appointment' (start a new booking) — always one click away." },
    ],
    tips: [
      "A small amber 'no card on file' label means you should ask the client for a card before service starts.",
      "If you only see your own appointments, that's expected — only admins and schedulers see everyone.",
      "The floating 'Book appointment' pill is visible on every staff page so you can book from anywhere.",
    ],
    link: { to: "/staff/today", label: "Open Today" },
  },
  {
    id: "inbox",
    title: "Inbox — booking requests",
    icon: Inbox,
    image: imgInbox,
    blurb:
      "When a client books online, the request lands here for approval. The number badge in the sidebar tells you how many are waiting.",
    steps: [
      { title: "Review the request", body: "Click the row to see the client, requested service, time, and any notes they wrote." },
      { title: "Approve or deny", body: "Approve sends a confirmation email and adds the appointment to the calendar. Deny sends a polite decline with rebooking link." },
      { title: "Reschedule before approving", body: "If the time doesn't work, use 'Reschedule' to offer a different slot — the client gets a one-click confirmation email." },
    ],
    tips: ["Try to clear the Inbox at least twice a day so clients aren't left waiting."],
    link: { to: "/staff/inbox", label: "Open Inbox" },
  },
  {
    id: "messages",
    title: "Messages — two-way SMS with any client",
    icon: MessageSquare,
    blurb:
      "All client text conversations in one place. Incoming replies from clients land here automatically, and you can start a new conversation with anyone in the database — no appointment required.",
    steps: [
      { title: "See all threads", body: "The left column lists every client conversation, newest activity on top. Unread incoming messages are bolded with a dot." },
      { title: "Reply", body: "Click a thread to open it. Type and send — messages are delivered as SMS through the clinic number the client already knows." },
      { title: "Start a new message", body: "Hit 'New message' in the header, search any client by name, email, or phone, write your text, and send. The thread appears immediately in the list." },
      { title: "Book from messages", body: "The 'Book appointment' button in the header jumps to the booking flow without losing your place." },
      { title: "Text from Today", body: "You can also open a thread directly from any appointment row on the Today screen — no need to come here first." },
    ],
    tips: [
      "Incoming replies arrive in real time — keep the tab open during the day and the badge will update on its own.",
      "Keep texts under 320 characters so they send as a single SMS.",
    ],
    link: { to: "/staff/messages", label: "Open Messages" },
  },
  {
    id: "new-booking",
    title: "New Booking — book a client yourself",
    icon: Plus,
    blurb:
      "Use this whenever a client calls, walks in, or you're rebooking from a previous visit.",
    steps: [
      { title: "Pick or create the client", body: "Search by name, email, or phone. If they're new, fill in the basics — the system creates the profile automatically." },
      { title: "Choose service, location, and provider", body: "Available time slots refresh based on your selections. Greyed-out slots are conflicts." },
      { title: "Pick a time and confirm", body: "Click the slot and hit 'Book'. The client gets a confirmation email and the appointment is on the calendar instantly." },
      { title: "Add a card on file (recommended)", body: "Send the secure card-capture link from the appointment page so the no-show fee is enforceable." },
    ],
    link: { to: "/staff/appointments/new", label: "Start a booking" },
  },
  {
    id: "calendar",
    title: "Calendar — the full schedule",
    icon: CalIcon,
    image: imgCalendar,
    blurb:
      "Day, week, and provider views. Drag to reschedule, click an empty slot to create.",
    steps: [
      { title: "Switch views", body: "Toggle between Day / Week / Month at the top. Filter by provider or location with the dropdowns." },
      { title: "Drag to reschedule", body: "Grab any appointment block and drop it on a new time. The client is notified automatically." },
      { title: "Create on the grid", body: "Click an empty slot to start a new booking pre-filled with that time." },
    ],
    link: { to: "/staff/calendar", label: "Open calendar" },
  },
  {
    id: "availability",
    title: "My Availability & Time Off",
    icon: Clock,
    blurb:
      "Tell the system when you work. The booking page only offers slots you're available for.",
    steps: [
      { title: "Set weekly hours", body: "Under 'My Availability', click each day and add your start/end times. Add multiple windows per day if you take a long break." },
      { title: "Block time off", body: "Under 'Time Off & Extras', add vacations, sick days, or one-off blocked time. Clients can't book those slots." },
      { title: "Add extra hours", body: "Same page — add a one-off extended-hours window when you want to pick up extra appointments." },
    ],
    link: { to: "/staff/availability", label: "Edit my availability" },
  },
  {
    id: "gcal",
    title: "Google Calendar sync",
    icon: CalendarCheck,
    blurb:
      "Connect your personal Google Calendar so (1) busy events on it block booking slots automatically and (2) every approved appointment is added to your calendar.",
    steps: [
      { title: "Connect once", body: "Open My Profile → 'Google Calendar' card → 'Connect Google Calendar'. Sign in and allow both read and write access." },
      { title: "Reconnect after permission changes", body: "If we expand permissions (e.g. enabling write access for new event creation), you'll need to disconnect and reconnect once for the new scope to apply." },
      { title: "How busy times work", body: "Anything marked Busy on your Google Calendar within your work hours hides those slots on the booking page — no manual blocking needed." },
      { title: "How event creation works", body: "When a booking request is approved (or a staff-created booking is saved), the system creates the event on the assigned provider's connected calendar automatically." },
    ],
    tips: [
      "Each provider must connect their OWN Google account — admins cannot connect on someone else's behalf.",
      "Disconnect at any time from the same card. Existing events stay on your calendar; future syncs stop.",
    ],
    link: { to: "/staff/my-profile", label: "Connect my calendar" },
  },
  {
    id: "clients",
    title: "Clients — the rolodex",
    icon: UserCircle2,
    image: imgClients,
    blurb:
      "Every client who has ever booked, with their full history, notes, consents, and card on file.",
    steps: [
      { title: "Search", body: "Use the top search bar — it matches name, email, or phone. Click a row to open the profile." },
      { title: "Read the timeline", body: "The profile shows past appointments, signed consents, payment history, and any internal notes." },
      { title: "Add a private note", body: "Use the notes field for allergies, preferences, or anything the next provider should know. Clients never see these." },
      { title: "Send a card-on-file link", body: "Hit the 'Card on file' button to email a secure capture link." },
    ],
    link: { to: "/staff/clients", label: "Browse clients" },
  },
  {
    id: "waitlist",
    title: "Waitlist",
    icon: Bell,
    blurb:
      "Clients who couldn't get the time they wanted can join the waitlist. When a slot opens, the system can auto-notify them.",
    steps: [
      { title: "See who's waiting", body: "The list shows preferred service, dates, and provider." },
      { title: "Offer a slot", body: "Click 'Offer' to send a one-click booking link valid for a limited window." },
    ],
    link: { to: "/staff/waitlist", label: "Open waitlist" },
  },
  {
    id: "consents",
    title: "Consents — paperwork before treatment",
    icon: FileText,
    image: imgConsents,
    blurb:
      "Every service has its own consent form(s). Clients sign electronically before they're treated.",
    steps: [
      { title: "Auto-assign on booking", body: "When you book a service, the matching consents are linked automatically." },
      { title: "Manually assign more", body: "Open the appointment, click 'Assign consents', pick from the library." },
      { title: "Client signs from email", body: "They get a secure link, type their name, and sign. You'll see a green 'Signed' pill in the appointment." },
      { title: "Sign at the front desk", body: "If the client forgot, hand them the iPad — open the appointment and tap 'Sign now' to launch the in-person flow." },
    ],
    tips: ["Never start a service without all consents signed. The appointment will show a red banner reminding you."],
    link: { to: "/staff/consents", label: "Manage consents (admin)" },
  },
  {
    id: "checkout",
    title: "Checkout — taking payment",
    icon: CreditCard,
    image: imgCheckout,
    blurb:
      "Four payment paths, all in one screen. The system handles tax, tip, processing fees, and voucher redemption automatically.",
    steps: [
      { title: "Open checkout", body: "From the appointment or Today page, click 'Check out'." },
      { title: "Confirm what was performed", body: "Add or remove line items. For unit-based services like Botox, type the actual units used." },
      { title: "Apply a voucher (optional)", body: "Type the voucher code. If valid for the service & location, it deducts automatically." },
      { title: "Pick a payment method", body: "Terminal (S710 reader), Card on file (charges saved card), Manual card entry (Stripe form pops open), or Cash." },
      { title: "Tip prompt", body: "If enabled for the location, the tip screen appears before the charge. 'No tip' is a valid option." },
      { title: "Done", body: "Receipt is emailed automatically. Appointment status flips to 'completed' and the post-op email queues up." },
    ],
    tips: [
      "If a charge fails, any voucher redemption is automatically reversed — no manual cleanup needed.",
      "Manual card entry is the safety net if the terminal is down or the card on file declines.",
    ],
  },
  {
    id: "postop",
    title: "Post-Op Instructions",
    icon: MailCheck,
    image: imgPostop,
    blurb:
      "Detailed, California-board-compliant aftercare for every service. Sent automatically at check-in and again at checkout.",
    steps: [
      { title: "Auto-send on check-in", body: "When you check a client in, the post-op email for their service queues immediately so they have it on hand." },
      { title: "Print or hand off", body: "From the appointment, click the post-op button to open a printable version." },
      { title: "Resend if needed", body: "Use the 'Resend post-op' button on the appointment if the client lost the email or didn't receive it." },
      { title: "Edit the templates", body: "Admins can tweak any service's instructions on the Post-Op page — changes apply to future sends only." },
    ],
    link: { to: "/staff/post-op", label: "Edit post-op templates (admin)" },
  },
  {
    id: "marketing",
    title: "Marketing & Reviews",
    icon: Megaphone,
    image: imgMarketing,
    blurb:
      "Send campaigns, track review requests, and watch the post-visit funnel.",
    steps: [
      { title: "Build a campaign", body: "Pick an audience (all clients, by service, by location, or by date range), write the message, and schedule." },
      { title: "Auto review requests", body: "After every completed appointment, a feedback email goes out. 5-star ratings get redirected to the matching location's Google review page." },
      { title: "Birthday greetings", body: "Send automatically on the client's birthday — toggle on the Marketing page." },
    ],
    link: { to: "/staff/marketing", label: "Open marketing (admin)" },
  },
  {
    id: "vouchers",
    title: "Vouchers, gift cards & promos",
    icon: Sparkles,
    image: imgVouchers,
    blurb:
      "Issue gift cards, prepaid packages, or promo codes. Each voucher can be locked to a service, units, or a specific location.",
    steps: [
      { title: "Create a voucher", body: "Go to Pricing & Promos. Choose a code, value, and what it covers (e.g. '30 units of Botox at San Jose')." },
      { title: "Email it as a gift", body: "Use the 'Email gift card' action — recipient gets a beautifully formatted email with the code." },
      { title: "Redeem at checkout", body: "Type the code in the voucher field at checkout. The system validates service, units, and location." },
    ],
    link: { to: "/staff/pos-config", label: "Manage promos (admin)" },
  },
  {
    id: "team",
    title: "Team, Services & Pricing (admin)",
    icon: Users,
    blurb:
      "Add staff, set what services they perform, and manage your service menu.",
    steps: [
      { title: "Invite staff", body: "Team page → 'Invite'. They get an activation email and pick their own password." },
      { title: "Assign services", body: "On each staff card, check which services they perform. Booking only offers them as a provider for those." },
      { title: "Edit services & pricing", body: "Services page → click a service to edit name, duration, price, price note ('per unit', 'per syringe'), category, and consents." },
    ],
  },
  {
    id: "reports",
    title: "Reports & Activity log",
    icon: BarChart3,
    blurb:
      "See what happened, when, and by whom. Useful for monthly close-out and audits.",
    steps: [
      { title: "Reports", body: "Revenue by service, by provider, by location, by date range. Export as CSV." },
      { title: "Activity log", body: "Every meaningful action — bookings, status changes, payments, refunds — with the user who did it and when." },
    ],
  },
  {
    id: "terminal",
    title: "Terminal Readers (admin)",
    icon: Smartphone,
    blurb:
      "Pair and manage your Stripe S710 card readers per location.",
    steps: [
      { title: "Pair a new reader", body: "Terminal Readers → 'Add'. Enter the registration code shown on the reader screen, choose a location, save." },
      { title: "Switch the active reader", body: "If you have multiple readers at one location, choose the active one from the location picker on the Checkout screen." },
    ],
  },
];

const FAQ = [
  { q: "A client says they didn't get the confirmation email.", a: "Open the appointment, click 'Resend confirmation'. Also check the client's profile — if their email shows 'suppressed', it bounced previously and you'll need to update it." },
  { q: "The terminal is offline.", a: "Use 'Manual card entry' on the Checkout screen — a Stripe card form opens for the client to type in. Sale completes the moment the webhook confirms (usually under 2 seconds)." },
  { q: "I need to refund.", a: "Open the appointment → Sale section → 'Refund'. Pick full or partial. Refund goes to the original card and is reflected in the activity log." },
  { q: "Charge a no-show fee.", a: "Open the no-show appointment → 'Charge no-show fee'. The $200 fee is charged to the card on file and the client is notified." },
  { q: "Client wants to reschedule.", a: "Use the 'Reschedule' button on the appointment — they get a one-click confirmation email with the new time. No need to cancel + rebook." },
  { q: "A charge failed and a voucher was applied.", a: "Nothing to clean up — the system auto-reverses the voucher redemption when Stripe declines. Verify on the appointment that the voucher shows as available again." },
  { q: "Approved appointments aren't showing up on my Google Calendar.", a: "Open My Profile → Google Calendar card and confirm you're connected. If you connected before write access was enabled, click Disconnect then Connect again so the new permissions take effect." },
  { q: "I need to be available outside my normal hours for one day.", a: "Go to My Availability → Time Off & Extras → 'Add extra hours'. Pick the date, time window, and location. Clients can book that window immediately." },
  { q: "A client asks where to park / how to get into the suite.", a: "They already have it — both the booking-received and booking-approved emails include the full address and arrival instructions for the location they picked, and the 24-hour reminder repeats it." },
  { q: "How do I text a client who doesn't have an appointment today?", a: "Open Messages → 'New message'. Search by name, email, or phone, type your text, and send. The thread shows up immediately and any reply lands back in Messages." },
  { q: "Where's the fastest way to book a new appointment?", a: "The floating 'Book appointment' pill in the bottom-right of every staff page. It's also in the header of Today and Messages." },
  { q: "A client replied to my text but I don't see it.", a: "Open Messages — incoming SMS replies route there automatically. If a specific thread is missing, refresh; if it's still missing the client may have texted from a different number than the one we have on file." },
];

export default function StaffHelp() {
  const [q, setQ] = useState("");
  useEffect(() => { try { localStorage.setItem("rka_handbook_read", "1"); } catch {} }, []);
  const needle = q.trim().toLowerCase();
  const match = (...parts: (string | undefined)[]) =>
    !needle || parts.filter(Boolean).join(" \u0001 ").toLowerCase().includes(needle);
  const filteredCompany = COMPANY.filter(c => match(c.title, c.body, ...(c.bullets || [])));
  const filtered = SECTIONS.filter(s =>
    match(
      s.title,
      s.blurb,
      ...s.steps.flatMap(st => [st.title, st.body]),
      ...(s.tips || []),
      s.link?.label,
    )
  );
  const filteredFaq = FAQ.filter(f => match(f.q, f.a));
  const sectionsWithImages = SECTIONS.filter(s => s.image);
  const nothing = needle && filteredCompany.length === 0 && filtered.length === 0 && filteredFaq.length === 0;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            <BookOpen className="h-3.5 w-3.5" /> Staff Handbook
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-3 leading-tight">Welcome to Radiantilyk Aesthetic.</h1>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            Your onboarding guide and day-to-day handbook. Start with <em>Know your brand</em> below to learn who we are and what we promise our clients, then jump to any workflow when you need it.
          </p>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search the handbook — try 'no-show', 'consent', 'terminal'…"
              className="w-full pl-9 pr-9 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Search the handbook"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
            {needle && !nothing && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                {filteredCompany.length} brand · {filtered.length} workflow · {filteredFaq.length} FAQ matches
              </div>
            )}
          </div>
          <a
            href="/staff-handbook.pdf"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 mt-4 text-xs uppercase tracking-wider text-primary hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF version
          </a>
        </div>
        <img src={hero} alt="Welcoming a client at the front desk" className="w-full md:w-72 rounded-2xl shadow-soft" loading="eager" width={1024} height={1024} />
      </div>

      {/* Company knowledge base — sourced from radiantilykaesthetics.com */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Part one</div>
            <h2 className="font-serif text-2xl md:text-3xl">Know your brand</h2>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mb-8">
          Before you book your first client, read these seven cards. They're the company facts every Radiantilyk team member should be able to repeat from memory.
        </p>
        {filteredCompany.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No brand cards match "{q}".
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredCompany.map(c => (
              <div key={c.id} id={c.id} className="rounded-2xl border border-border bg-card p-5 scroll-mt-20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <c.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm">{c.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.body}</p>
                {c.bullets && (
                  <ul className="space-y-1.5">
                    {c.bullets.map((b, i) => (
                      <li key={i} className="text-sm text-foreground/80 leading-relaxed pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-primary">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Operational handbook header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Part two</div>
          <h2 className="font-serif text-2xl md:text-3xl">How to use the booking site</h2>
        </div>
      </div>

      {/* Quick nav */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
        {(filtered.length ? filtered : SECTIONS).map(s => (
          <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-secondary/40 transition text-sm">
            <s.icon className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{s.title.split("—")[0].trim()}</span>
          </a>
        ))}
      </div>

      {/* Screenshot gallery — each tile jumps to its section */}
      {!needle && (
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Jump by screenshot</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {sectionsWithImages.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group block rounded-xl overflow-hidden border border-border bg-card hover:shadow-soft transition"
                aria-label={`Jump to ${s.title}`}
              >
                <img src={s.image} alt="" className="w-full aspect-[16/10] object-cover group-hover:opacity-90 transition" loading="lazy" />
                <div className="px-2.5 py-2 flex items-center gap-1.5">
                  <s.icon className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-[11px] truncate">{s.title.split("—")[0].trim()}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-16">
        {filtered.length === 0 && nothing ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No handbook entries match "{q}". Try a shorter keyword.
          </div>
        ) : filtered.map((s, idx) => (
          <section id={s.id} key={s.id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Section {String(idx + 1).padStart(2, "0")}</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mb-2">{s.title}</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">{s.blurb}</p>

            {s.image && (
              <a href={`#${s.id}`} className="block w-full max-w-2xl mb-6" aria-label={`Permalink to ${s.title}`}>
                <img src={s.image} alt="" className="w-full rounded-xl border border-border hover:opacity-95 transition" loading="lazy" width={1024} height={640} />
              </a>
            )}

            <ol className="space-y-3 max-w-2xl">
              {s.steps.map((step, i) => (
                <li key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">{i + 1}</span>
                  <div>
                    <div className="font-medium text-sm mb-1">{step.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{step.body}</div>
                  </div>
                </li>
              ))}
            </ol>

            {s.tips && s.tips.length > 0 && (
              <div className="mt-5 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-primary mb-2">Tips</div>
                <ul className="space-y-1.5">
                  {s.tips.map((t, i) => <li key={i} className="text-sm text-foreground/80 leading-relaxed">· {t}</li>)}
                </ul>
              </div>
            )}

            {s.link && (
              <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
                <Link to={s.link.to}>{s.link.label}<ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
          </section>
        ))}
      </div>

      {/* Clinical Protocols */}
      <section className="mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
            <Siren className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Part three</div>
            <h2 className="font-serif text-2xl md:text-3xl">Clinical protocols</h2>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mb-8">
          Mandatory clinical reference documents. Every injector must read, sign, and keep these immediately accessible in every treatment room.
        </p>

        <div className="max-w-3xl rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.3em] text-destructive mb-1">Emergency Protocol · v1.0</div>
              <h3 className="font-serif text-xl mb-1">Vascular Occlusion — Recognition, Response & Management</h3>
              <p className="text-xs text-muted-foreground">Authors: Kiem Vukadinovic, NP (Lead Injector) · Aloysius Fobi, MD (Medical Director)</p>
            </div>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Vascular occlusion is a <strong>time-critical medical emergency</strong> that can occur during or after any dermal filler injection. Filler entering or compressing an artery can lead to tissue necrosis, permanent scarring, blindness, or stroke. <strong>Begin hyaluronidase within 60–90 minutes</strong> for HA fillers; for periocular involvement, treat immediately.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-card border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-destructive mb-1">High-risk zones</div>
              <div className="text-xs text-foreground/80">Glabella · Nose · Nasolabial fold · Deep forehead</div>
            </div>
            <div className="rounded-lg bg-card border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-warning-soft-foreground mb-1">Moderate-risk zones</div>
              <div className="text-xs text-foreground/80">Temple · Lips · Cheek/midface · Chin</div>
            </div>
          </div>

          <div className="rounded-lg bg-card border border-border p-4 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-primary mb-2">Emergency response — at a glance</div>
            <ol className="space-y-1.5 text-sm text-foreground/80">
              <li><strong>1. Recognize</strong> — disproportionate pain, blanching, livedo, delayed cap refill. Say it aloud.</li>
              <li><strong>2. Stop &amp; notify</strong> — stop injecting, alert the team, call the Medical Director.</li>
              <li><strong>3. Warm compress + massage</strong> the affected territory.</li>
              <li><strong>4. Hyaluronidase</strong> (HA fillers) — flood the entire vascular distribution, 10–30 units per site, repeat every 60 min until reperfusion.</li>
              <li><strong>5. Adjuncts</strong> — aspirin 325 mg, NTG paste (per MD), antibiotics if skin compromise.</li>
              <li><strong>6. Reassess</strong> at 60 min — color, cap refill, pain.</li>
              <li><strong>7. Follow up</strong> at 24h / 48h / 72h / 1 wk · photograph · plastics if necrosis.</li>
            </ol>
          </div>

          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 mb-4">
            <div className="text-xs font-medium text-destructive mb-1">⚠ Vision symptoms = call 911 immediately</div>
            <div className="text-xs text-foreground/80">Sudden vision loss, eye pain, severe one-sided headache, facial droop, slurred speech, or altered mental status — activate EMS and state: <em>"vascular emergency, possible filler embolism."</em></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <a href="/handbook/Vascular_Occlusion_Protocol.docx" download>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download full protocol (20 pages)
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href="/handbook/Vascular_Occlusion_Protocol.docx" target="_blank" rel="noopener">
                Open in new tab
              </a>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 italic">
            This summary is for quick reference only and does not replace the full protocol. Every injector must read the complete document, sign the acknowledgment page, and re-review at minimum annually.
          </p>
        </div>

        {/* Device & treatment manuals */}
        <div className="max-w-3xl mt-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Device & treatment manuals</div>
          <p className="text-sm text-muted-foreground mb-4">
            Manufacturer IFUs and internal staff guides for every device in the clinic. Read before operating; keep accessible in-room during treatment.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "Geneo — User Manual", desc: "OxyPod facial system · operation, settings, maintenance", href: "/handbook/Geneo_User_Manual.pdf" },
              { title: "Ultherapy Prime — IFU", desc: "Manufacturer instructions for use (Merz)", href: "/handbook/Ultherapy_Prime_IFU.pdf" },
              { title: "HIFU / Ultherapy — Staff Manual", desc: "Comprehensive staff instruction & treatment guide", href: "/handbook/HIFU_Ultherapy_Staff_Manual.pdf" },
              { title: "CO₂ Laser — Staff Manual", desc: "Pre-op, settings, safety, post-op protocol", href: "/handbook/CO2_Laser_Staff_Manual.pdf" },
              { title: "BTL Exilis Ultra 360 — Staff Guide", desc: "Treatment parameters, body & face protocols", href: "/handbook/BTL_Exilis_Ultra_360_Staff_Guide.pdf" },
            ].map((m) => (
              <div key={m.href} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <div className="font-medium text-sm mb-1">{m.title}</div>
                <div className="text-xs text-muted-foreground mb-3 flex-1">{m.desc}</div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <a href={m.href} target="_blank" rel="noopener">Open</a>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <a href={m.href} download><Download className="h-3.5 w-3.5 mr-1.5" />Download</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl">When things get tricky</h2>
        </div>
        <div className="space-y-3 max-w-2xl">
          {filteredFaq.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No FAQ entries match "{q}".
            </div>
          ) : filteredFaq.map((f, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card p-4" open={!!needle}>
              <summary className="cursor-pointer text-sm font-medium flex items-center justify-between">
                {f.q}
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-border text-center text-xs text-muted-foreground">
        Radiantilyk Aesthetic · Staff Handbook · v1.0 · Last updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </div>
    </div>
  );
}
