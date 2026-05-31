# BriefPay: Design Handoff Documentation
**Project:** BriefPay MVP - Modern Workflow Suite
**Visual Direction:** Linear-meets-Stripe
**Tech Stack Recommendation:** React, TypeScript, Tailwind CSS, Vite

---

## 1. Brand Identity

### Final Logo Description
The BriefPay logo is a minimalist "flow mark" representing the transition from **Brief** to **Pay**.
- **Icon:** An abstract "B" monogram formed by two overlapping document shapes with a forward-leaning terminal. The inner negative space creates a subtle forward-moving arrow/check completion cue.
- **Wordmark:** "BriefPay" in **Clash Display** (Semibold). "Brief" and "Pay" are typically same-weight, but "Pay" can carry the primary color in specific contexts.

### Usage Rules
- **Safe Area:** Maintain a minimum clear space equal to 50% of the logo's height on all sides.
- **Minimum Size:** 24px (Web), 120px (Print).
- **Logo Variants:**
    - **Primary (Blue Icon + Navy Text):** Standard use on white/light backgrounds.
    - **Monochrome (White):** Use on Dark Navy (`#0A0F24`) surfaces (e.g., Sidebar, Hero Section).
    - **Icon-Only:** Use for Favicons (16x16, 32x32), App Icons, and Social Avatars.

---

## 2. Color System

| Token | HEX | Usage Purpose | Examples |
| :--- | :--- | :--- | :--- |
| **Primary** | `#2962FF` | Main Actions, Focus Rings, Brand Highlights | Buttons, active navigation, active borders |
| **Background** | `#F8FAFC` | Primary App/Marketing Canvas | Main content area, section backgrounds |
| **Surface** | `#FFFFFF` | Component Containers | Cards, Modals, Inputs, Builder Canvas |
| **Text (High)** | `#0F172A` | Primary Headings, Strong Body | Hero text, Dashboard titles, Labels |
| **Text (Muted)** | `#64748B` | Secondary Content, Metadata | Descriptions, timestamps, placeholder text |
| **Border** | `#E2E8F0` | Structural Separation | Card borders, input strokes, table dividers |
| **Success** | `#00BFA5` | Positive States (Mint) | "Paid" status, success checkmark, positive trends |
| **Warning** | `#F59E0B` | Attention Needed (Amber) | "Overdue" status, pending actions |
| **Error** | `#EF4444` | Critical Failures (Muted Red) | Failed validation, error states |
| **Navy (Inverse)** | `#0A0F24` | Contrast Elements | Sidebar background, Marketing Hero, Footer |

---

## 3. Typography System

- **Heading Font:** `Clash Display` (Semibold/Bold)
- **Body Font:** `Satoshi` (Regular/Medium/Semibold)
- **Fallback:** `Sans-serif`

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Heading** | 56px | 700 (Bold) | 1.1 | Landing Page Hero |
| **Page Heading** | 32px | 600 (Semibold) | 1.2 | Dashboard Overview, Builder Title |
| **Section Heading** | 24px | 600 (Semibold) | 1.3 | Card Titles, Form Groups |
| **Card Title** | 18px | 600 (Semibold) | 1.4 | Metrics, Small Headers |
| **Body Text** | 16px | 400 (Regular) | 1.5 | General copy, Paragraphs |
| **Labels / Small** | 13px | 500 (Medium) | 1.4 | Input labels, Metadata, Status pills |
| **Buttons** | 14px | 600 (Semibold) | 1.0 | Actionable elements |

---

## 4. Layout Rules

- **Desktop Max Width:** 1200px (Content Container).
- **Dashboard Sidebar Width:** 240px (Fixed).
- **Topbar Height:** 64px.
- **App Content Padding:** 32px (Desktop), 16px (Mobile).
- **Card Radius:** 12px (`rounded-xl`).
- **Input/Button Radius:** 6px (`rounded-md`).
- **Border Weight:** 1px solid.
- **Breakpoints:**
    - Mobile: `< 768px`
    - Tablet: `768px - 1024px`
    - Desktop: `> 1024px`

---

## 5. Component Library

### Buttons
- **Primary:** Background `#2962FF`, Text White. Hover: 10% brightness increase.
- **Secondary:** Background White, 1px Border `#E2E8F0`, Text `#0F172A`. Hover: `#F8FAFC` bg.
- **Ghost:** No background/border, Text `#64748B`. Hover: Text `#0F172A`, light gray bg.
- **Focus State:** 2px ring `#2962FF` with 2px offset.

### Inputs
- **Default:** Height 48px, Background `#F8FAFC`, No border.
- **Focus:** 2px Ring `#2962FF`, Background White.
- **Error:** 1px Border `#EF4444`.

### Status Badges
- **Draft:** Gray BG, Dark Gray Text.
- **Sent:** Light Blue BG, Royal Blue Text.
- **Awaiting Verification:** Light Blue BG, Royal Blue Text + Icon.
- **Paid:** Mint BG, Dark Mint Text.
- **Overdue:** Amber BG, Dark Amber Text.

---

## 6. Animation & Interaction

- **Page Transitions:** 200ms ease-in-out fade/slide (0.98 scale to 1.0).
- **Hover Transitions:** 150ms `transition-colors`.
- **Card Lift:** `hover:-translate-y-1 hover:shadow-lg` (subtle).
- **Success Check:** Scale-in animation with SVG stroke draw for the mint checkmark.
- **Hero Mockup:** Gentle vertical float (looping CSS keyframe `translateY`).
- **Scroll Reveal:** `IntersectionObserver` triggered fade-up for Landing Page blocks.

---

## 7. Screen Implementation Notes

### Dashboard
- **Layout:** Fixed Sidebar + Scrollable Content.
- **Metric Cards:** Display currency-specific totals (₦ vs $).
- **Table:** Row hover state should highlight the entire row. Status column is the primary visual anchor.

### Public Proposal View (Mobile-First)
- **Layout:** Centered single column (max 800px).
- **Sticky Action Bar:** Remains at the bottom of the viewport on mobile with "Request Changes" and "Accept Proposal".
- **Interaction:** Clicking "Accept" triggers a lightweight confirmation modal for Name/Email.

### Invoice / Deposit Page
- **Focus:** High-visibility payment instructions (Bank Name, Account Number).
- **Tracking Form:** "I Have Paid" button enabled only after mandatory fields (Name, Method, Amount, Receipt) are filled. Payment reference is optional.

---

## 8. Content & Wording Rules
**Positioning:** BriefPay is a *Workflow & Tracking* tool, not a processor.
- **DO NOT USE:** "Pay Now," "Balance," "Wallet," "Processing," "Payment Successful."
- **USE:** "Accept Proposal," "View Payment Instructions," "I Have Paid," "Awaiting Verification," "Payment proof submitted."

---

## 9. Developer Build Notes
- **React Components:** Break down into atomic units (`Button`, `Input`, `Badge`, `Card`).
- **Tailwind Config:** Map the BriefPay colors to the `tailwind.config.js` theme object.
- **State Management:** Track proposal status transitions (`Draft` -> `Sent` -> `Awaiting Verification` -> `Paid`).
- **Form Handling:** Use `react-hook-form` or similar for validation on the tracking form.

---

## 10. Asset Checklist
- [ ] Logo SVG (Primary, White, Icon-only)
- [ ] Favicon Package (16, 32, 180px)
- [ ] Font Assets (Clash Display, Satoshi)
- [ ] Landing Page Mockups (Exported from {{DATA:SCREEN:SCREEN_6}})
- [ ] Lucide-React / Heroicons set (matching the minimal stroke style)
- [ ] Success/Empty state illustrations (SVG)
