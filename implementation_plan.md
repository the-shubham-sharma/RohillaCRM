# Implementation Plan: Rohilla Advertising External Customer Website & Customer Portal

Build a high-performance, responsive external customer website and self-service customer portal for **Rohilla Advertising** in `customer-portal/` connected to the existing Spring Boot backend and PostgreSQL database, without breaking or altering any internal CRM workflows.

---

## User Review Required

> [!IMPORTANT]
> **Zero Disruption to Existing CRM**: The internal CRM in `frontend/` (ports: 5173) and backend services remain completely intact. All 82 existing backend tests continue to pass.
>
> **Customer Portal (Port: 5174)**: A separate React + TypeScript + Vite customer-facing application is created in `customer-portal/` featuring a modern brand design, lead generation system, tokenized customer self-service links, and an employee login redirection gateway.

---

## Proposed Changes

### Backend Components (`backend/`)

#### 1. Domain Entities & Enums
- [NEW] `Lead.java` in `com.rohilla.crm.domain.entity`:
  - Stores customer inquiries with unique `leadCode` (e.g. `LEAD-2026-0001`), customer details, 10-digit validated phone number, project requirement, product/service type, quantity, size, location, design assistance flag, uploaded design file reference, and lead status (`NEW_LEAD`, `CONTACTED`, `CONVERTED`, `ARCHIVED`).
- [NEW] `LeadStatus.java` in `com.rohilla.crm.domain.enums`.
- [NEW] `CustomerToken.java` in `com.rohilla.crm.domain.entity`:
  - Tokenized, secure non-guessable link entity (`token`, `tokenType`, `referenceId`, `expiresAt`) preventing IDOR.
- [NEW] `CustomerTokenType.java` in `com.rohilla.crm.domain.enums` (`QUOTATION`, `DESIGN_PROOF`, `ORDER_STATUS`, `INVOICE`, `PAYMENT`).

#### 2. DTOs & Validation
- [NEW] `CustomerEnquiryRequest.java`: DTO with `@NotBlank`, `@Pattern` for strict Indian 10-digit mobile number validation using `PhoneUtils`.
- [NEW] `LeadResponseDto.java`: Lead summary with sanitized metadata and reference code.
- [NEW] `CustomerQuotationDto.java`, `CustomerDesignProofDto.java`, `CustomerOrderStatusDto.java`, `CustomerInvoiceDto.java`: Customer-facing secure payload DTOs that intentionally exclude private internal employee names, internal notes, or raw IDs.
- [NEW] `CustomerActionRequest.java`: DTO for approving, rejecting, or requesting changes with customer feedback.

#### 3. Repositories & Services
- [NEW] `LeadRepository.java`: JPA repository for leads querying and status filtering.
- [NEW] `CustomerTokenRepository.java`: JPA repository for token-based lookups.
- [NEW] `LeadService.java`: Business logic for validating enquiry requests, persisting new leads with unique `LEAD-2026-XXXX` codes, notifying managers, and listing leads for the CRM.
- [NEW] `CustomerPortalService.java`: Secure retrieval and action processing for quotations, design proofs, orders, and invoices via non-guessable tokens.

#### 4. REST Controllers & Security Config
- [NEW] `PublicCustomerController.java` (`/api/v1/public/...`):
  - `POST /api/v1/public/leads`: Submit customer enquiry (public, strict 10-digit phone validation).
  - `POST /api/v1/public/leads/upload`: Upload customer artwork for enquiry.
  - `GET /api/v1/public/quotations/{token}`: View customer quotation.
  - `POST /api/v1/public/quotations/{token}/action`: Approve / Reject / Request changes.
  - `GET /api/v1/public/design-proofs/{token}`: View design proof artwork and feedback.
  - `POST /api/v1/public/design-proofs/{token}/action`: Approve design / Request design rework.
  - `GET /api/v1/public/orders/{token}`: View customer order status milestones.
  - `GET /api/v1/public/invoices/{token}`: View invoice details and PDF data.
  - `POST /api/v1/public/payments/{token}/initiate`: Initiate Razorpay payment flow.
  - `POST /api/v1/public/payments/{token}/verify`: Verify payment.
- [NEW] `LeadController.java` (`/api/v1/leads`):
  - `GET /api/v1/leads`: Manager/Admin view of all customer leads.
  - `PATCH /api/v1/leads/{id}/status`: Manager update lead status.
- [MODIFY] `SecurityConfig.java`:
  - Allow `/api/v1/public/**` permitAll.
  - Protect `/api/v1/leads/**` with `hasAnyRole("ADMIN", "MANAGER")`.
  - Add `http://localhost:5174` to allowed CORS origins.
- [MODIFY] `DatabaseSeeder.java`:
  - Seed initial demo leads and sample customer tokens so all token routes (`/quotation/...`, `/design-approval/...`, `/order/...`, `/invoice/...`, `/payment/...`) can be tested immediately.

---

### Customer Portal Frontend (`customer-portal/`)

#### 1. Setup & Config
- [NEW] `customer-portal/package.json`: Vite, React 18, TypeScript, Axios, Lucide React icons.
- [NEW] `customer-portal/vite.config.ts`: Configured on port `5174` with proxy or direct API routing.
- [NEW] `customer-portal/tsconfig.json`, `customer-portal/index.html`.
- [NEW] `customer-portal/.env.example` (`VITE_API_BASE_URL=http://localhost:8080/api/v1`, `VITE_INTERNAL_CRM_URL=http://localhost:5173`).

#### 2. Design System & CSS
- [NEW] `customer-portal/src/index.css`:
  - High-end modern commercial agency aesthetic with rich navy/slate dark mode, warm gold/amber accents, glassmorphism cards, micro-animations, responsive layout tokens, and typography.

#### 3. Core Components & Layouts
- [NEW] `Navbar.tsx`: Sticky responsive header with logo, navigation links (Home, About, Services, Portfolio, Contact), primary "Get a Quote" CTA button, and "Employee Login" button. Mobile drawer menu.
- [NEW] `Footer.tsx`: Rich footer with company info, quick links, services directory, contact details, business hours, privacy/terms links, and employee login.
- [NEW] `MainLayout.tsx` & `PortalLayout.tsx`: Standard web page layout and clean distraction-free customer portal layout.
- [NEW] `ServiceCard.tsx`, `PortfolioCard.tsx`, `WorkflowTimeline.tsx`, `Toast.tsx`.

#### 4. Public Web Pages
- [NEW] `Home.tsx` (`/`): Hero with CTA buttons ("Get a Quote", "Explore Our Services"), 8 core services grid, about highlight, portfolio preview, 4-step workflow showcase, customer assurance, and contact CTA.
- [NEW] `About.tsx` (`/about`): Rohilla Advertising story, production infrastructure (large format solvent/UV printers, CNC router, laser cutters, acrylic bending, fabrication floor), quality commitment, and on-site installation expertise.
- [NEW] `Services.tsx` (`/services`): Detailed catalog of all 8 core services (Outdoor Advertising, Flex Printing, Standees, Banners, Posters, Hoardings/Billboards, LED/Acrylic Signages, and On-Site Installation) with material specifications, use cases, and direct "Get a Quote" pre-fill actions.
- [NEW] `Portfolio.tsx` (`/portfolio`): Interactive filterable project showcase (Outdoor Hoardings, Acrylic & LED Signage, Retail Branding, Flex Banners, Standees & Events) with image lightbox / modal preview.
- [NEW] `Contact.tsx` (`/contact`): Office address (Sector 14 / Udyog Vihar, Gurugram), phone numbers (+91-9811001100, +91-9811002200), email, operating hours, interactive map view, and contact form.
- [NEW] `GetQuote.tsx` (`/get-quote`, `/enquiry`): Full quote request form with mandatory Indian 10-digit phone validation, product picker, size & quantity, design assistance toggle (YES/NO), artwork file upload, and instant unique `LEAD-2026-XXXX` reference confirmation.
- [NEW] `EmployeeLogin.tsx` (`/employee-login`): Secure employee login interface authenticating via Spring Boot `/api/v1/auth/login`, verifying role, saving session, and redirecting to the internal CRM on `http://localhost:5173`.

#### 5. Secure Customer Portal Token Pages
- [NEW] `CustomerQuotation.tsx` (`/quotation/:token`): Quotation view with itemized breakdown, tax/GST calculations, terms, validity, and [APPROVE], [REQUEST CHANGES], [REJECT] actions.
- [NEW] `CustomerDesignApproval.tsx` (`/design-approval/:token`): High-resolution design proof viewer, artwork details, and [APPROVE DESIGN] or [REQUEST CHANGES] with feedback and reference upload.
- [NEW] `CustomerOrderStatus.tsx` (`/order/:token`): Real-time order progress stepper (Order Confirmed → Design Approved → In Production → QC Passed → Dispatched / Installed) without exposing internal employee identities.
- [NEW] `CustomerInvoice.tsx` (`/invoice/:token`): Printable & downloadable official tax invoice with payments history and remaining balance.
- [NEW] `CustomerPayment.tsx` (`/payment/:token`): Payment checkout interface with invoice details, amount breakdown, and [PAY NOW] Razorpay flow.

---

## Verification Plan

### Automated Tests
1. **Backend Tests**: Run `mvn clean test` in `backend/` to verify all existing and new unit/integration tests pass (100% success).
2. **Customer Portal Frontend Build**: Run `npm run build` in `customer-portal/` to verify zero TypeScript errors and clean production bundling.
3. **Internal CRM Frontend Build**: Run `npm run build` in `frontend/` to ensure no regression or disruption.

### Manual Verification
1. Open customer website at `http://localhost:5174`.
2. Verify responsive navigation, Hero, Services, About, Portfolio, and Contact pages.
3. Submit a new lead with 10-digit Indian phone number:
   - Test invalid phone format (e.g. 98ABC01111, 12345) -> Blocked.
   - Test valid phone (e.g. 9810001111) -> Success, returns `LEAD-2026-XXXX`.
4. Check Manager CRM API (`/api/v1/leads`) to verify the new lead appears in `NEW_LEAD` status.
5. Test Employee Login at `/employee-login` with `admin@rohilla.com` and verify successful redirection to the internal CRM.
6. Test tokenized links:
   - `/quotation/demo-quote-token-001`
   - `/design-approval/demo-design-token-001`
   - `/order/demo-order-token-001`
   - `/invoice/demo-invoice-token-001`
   - `/payment/demo-payment-token-001`
