# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Product Name
Suggested name: Rentivo (or any final chosen brand)

---

## 2. Product Vision

Build a **multi-tenant SaaS platform** for car rental companies that allows them to fully manage their operations digitally, including:

- Vehicle fleet management
- Customer management
- Reservations and rentals
- Contracts and payments
- Vehicle credit/financing tracking
- Maintenance and alerts
- Reporting and analytics
- Subscription billing (SaaS model)

The platform must be **production-ready**, scalable, secure, and commercialized as an annual subscription.

---

## 3. Business Model (SaaS)

- Subscription-based SaaS
- Annual pricing per company
- Example pricing:
  - 3000 MAD / year (Basic plan)
  - 5000 MAD / year (Pro plan)
- Each company is a tenant in a multi-tenant system
- Subscription expiration = access restriction

---

## 4. Target Users

### 4.1 Admin (Car Rental Company Owner)
- Full control over system

### 4.2 Employees
- Agents
- Accountants
- Managers

### 4.3 Super Admin (Platform Owner)
- Manage companies
- Subscriptions
- System monitoring

---

## 5. Core Requirements

### 5.1 Multi-Tenant Architecture (IMPORTANT)
- Each company = tenant
- Data isolation using `tenant_id`
- Shared database architecture preferred
- Secure access control per tenant

---

## 6. Core Modules

---

### 6.1 Authentication & Authorization
- Login / Register
- JWT authentication
- Role-based access control (RBAC)
- Roles:
  - Super Admin
  - Admin
  - Agent
  - Accountant

---

### 6.2 Company Management (SaaS Layer)
- Create company
- Manage subscription
- Activate / deactivate tenant
- Subscription expiration handling
- Plan management

---

### 6.3 Vehicle Management
Each vehicle includes:
- Brand
- Model
- Year
- Plate number
- Mileage
- Fuel type
- Transmission
- Price per day
- Status (available / rented / maintenance)
- Photos

Features:
- Add / update / delete vehicles
- Vehicle availability tracking
- Vehicle history

---

### 6.4 Client Management
- Full customer profile:
  - Name
  - Phone
  - Email
  - CIN / Passport
  - Driving license
  - License expiry date
- Blacklist system
- Rental history per client

---

### 6.5 Reservation & Rental System
- Create reservation
- Check availability
- Prevent double booking
- Start / end rental
- Automatic pricing calculation
- Status tracking:
  - Reserved
  - Active
  - Completed
  - Cancelled

---

### 6.6 Contracts Module
- Auto-generate rental contract (PDF)
- Include:
  - Client info
  - Vehicle info
  - Rental period
  - Price
  - Terms & conditions
- Digital signature support (optional)

---

### 6.7 Payment System
- Track payments:
  - Cash
  - Bank transfer
  - Card
- Partial payments support
- Outstanding balance tracking
- Invoice generation

---

### 6.8 Vehicle Return Management
- Return inspection:
  - Fuel level
  - Mileage
  - Damage report
- Late return penalty calculation
- Final invoice generation

---

### 6.9 Maintenance Module
- Maintenance scheduling
- Service history
- Alerts:
  - Oil change
  - Insurance expiration
  - Technical inspection

---

### 6.10 Vehicle Credit / Financing Module (VERY IMPORTANT)
Each vehicle can have financing:

- Bank name
- Loan amount
- Interest rate
- Monthly payment
- Duration
- Start/end date

Features:
- Generate amortization schedule
- Track payments
- Detect overdue payments
- Alerts system:
  - 7 days before due date
  - overdue notifications
- Remaining balance tracking
- Profitability calculation per vehicle

---

### 6.11 Dashboard & Analytics
Real-time KPIs:

- Total vehicles
- Available vehicles
- Active rentals
- Monthly revenue
- Profit per vehicle
- Credit liabilities
- Overdue payments

Include charts and analytics.

---

### 6.12 Reports Module
- Revenue reports
- Vehicle performance reports
- Client activity reports
- Credit reports
- Export PDF / Excel

---

### 6.13 Subscription & Billing System
- SaaS billing system
- Annual subscription tracking
- Stripe integration (or equivalent)
- Automatic renewal system
- Subscription expiration handling

---

## 7. UI/UX Requirements

### Design Style:
- Modern SaaS design
- Clean UI
- Glassmorphism optional
- 3D visual elements in dashboards
- Smooth animations

### Colors:
- Primary: #2563EB (Blue)
- Secondary: #0F172A (Dark)
- Accent: #10B981 (Green)
- Warning: #F59E0B
- Danger: #EF4444

### UI Pages:
- Login / Register
- Dashboard
- Vehicles
- Clients
- Reservations
- Contracts
- Payments
- Credits
- Maintenance
- Reports
- Settings

---

## 8. Technical Architecture

### Frontend:
- React / Next.js
- TailwindCSS
- Chart.js / Recharts
- 3D UI (Three.js optional)

### Backend:
- Node.js (NestJS or Express)
- REST API or GraphQL

### Database:
- PostgreSQL

### Storage:
- Cloud storage for images (S3-like)

### Authentication:
- JWT + Refresh tokens

---

## 9. Database Design (High-Level)

Tables:

- tenants (companies)
- users
- roles
- vehicles
- clients
- reservations
- contracts
- payments
- maintenance
- credits
- credit_payments
- subscriptions
- invoices

Each table must include:
- tenant_id (multi-tenancy)

---

## 10. Non-Functional Requirements

- High scalability
- Secure multi-tenancy isolation
- Fast API responses
- Responsive design (mobile + desktop)
- Backup system
- Logging system
- Error tracking

---

## 11. Development Approach (MANDATORY)

The AI must follow strict phased development:

### Phase 1: Architecture Design
- System architecture
- Database schema
- API structure

### Phase 2: Database Setup
- Create schema
- Migrations
- Seed data

### Phase 3: Backend Development
- Authentication
- Core APIs

### Phase 4: Frontend Development
- UI implementation
- Pages and navigation

### Phase 5: Business Modules
- Vehicles
- Clients
- Reservations
- Credits
- Payments

### Phase 6: SaaS Layer
- Subscription system
- Multi-tenancy enforcement

### Phase 7: Testing
- Unit tests
- Integration tests
- End-to-end tests

### Phase 8: Deployment
- Production deployment
- CI/CD pipeline

---

## 12. Critical Rules for Development

- NEVER skip testing phase
- NEVER move to next phase without validation
- Ensure multi-tenancy isolation in every module
- Ensure production readiness
- Ensure security best practices

---

## 13. Future Enhancements

- Mobile app (Flutter)
- GPS tracking
- AI analytics for profitability
- WhatsApp/SMS notifications
- Smart pricing system