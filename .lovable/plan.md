# Site-wide polish pass

## The problem
On mobile, page headers like "Messages" collapse to a narrow column and wrap letter-by-letter ("Me / ssa / ges") because the action buttons on the right don't shrink. Descriptions are also long and use internal jargon ("GoHighLevel", "Two-way SMS conversations…") that shouldn't be shown to staff/clients.

## Two-part fix

### 1. Global CSS safety net (one file, catches every page)
Add rules in `src/index.css` so no heading can ever wrap character-by-character again, even on pages we don't touch individually:
- `h1, h2, h3 { overflow-wrap: break-word; word-break: normal; hyphens: none; min-width: 0; }`
- A `.page-header` utility that flex-wraps on mobile and only goes row on `md:`.

### 2. Per-page sweep — headers + copy
Walk every page under `src/pages/staff/**` and the public pages (`Services`, `Book`, `ClientAccount`, `FAQ`, `Reviews`, `Quiz`, `Journal`, `BookingStatus`, `ClientIntake`, `ClientConsents`, `PhotoUpload`, `Feedback`, `Waitlist`, `Everesse`, `LocationPage`, `Terms`, `Privacy`, `PrivacyPractices`, `Unsubscribe`, `StaffLogin`, `StaffActivate`, etc.). For each:
- Convert the top `flex items-center/start justify-between` header to `flex flex-col md:flex-row md:items-center md:justify-between gap-3`.
- Add `min-w-0` to the title block, `flex-wrap` to the action group, `size="sm"` on mobile-crowded buttons.
- Rewrite verbose descriptions into one short professional sentence.
- Remove staff-facing internal jargon ("GoHighLevel", "PostgREST", "cron", "webhook", raw IDs) from user-visible strings.

## Copy rewrite guidelines
- Max ~10 words per description.
- Plain English, no acronyms unless universal (SMS, PDF, ID).
- Verbs first ("Text clients", "Track no-shows", "Review charts").
- No trailing filler ("…for your clinic", "…in real time").

## Scope estimate
- ~55 staff pages
- ~20 client-facing pages
- 1 global CSS edit

## Out of scope
- Redesigning layouts, colors, or navigation
- Adding/removing features
- Backend or DB changes
- Marketing site rewrites beyond header/description tightening

## Technical notes
- No new dependencies.
- Global CSS rule is additive; won't break existing styling.
- Each page edit is a small `flex` + copy tweak — no logic changes.
- I'll batch parallel `line_replace` edits across many files per turn to keep this efficient.

Approve and I'll start with the global CSS + the highest-traffic staff pages (Messages, Today, Calendar, Clients, Checkout, Clinical, Inventory, Reports), then continue through the rest.
