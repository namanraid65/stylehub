# StyleHub — Multi-Vendor Fashion & Lifestyle Marketplace

StyleHub is a premium, high-performance multi-vendor e-commerce platform built on a modern **MERN (MongoDB, Express, React/Next.js, Node.js)** monorepo stack. The system is designed specifically for fashion and lifestyle marketplaces, supporting multiple independent boutiques, cart-splitting across vendors, drag-and-drop CMS layout management, real-time analytics, verified customer reviews, interactive Q&As, and dynamically generated PDF invoices.

---

## 🏗️ Monorepo Architecture & Structure

StyleHub is structured as a **Turborepo monorepo** managed with **pnpm workspaces** for maximum modularity, clean separation of concerns, and shared package caching:

```
├── apps
│   ├── api          # Express.js (TypeScript) backend server with RESTful API
│   ├── admin        # Vite + React (TypeScript) dashboard for Admins & Vendors
│   └── web          # Next.js (App Router) storefront for Customer shopping
├── packages
│   ├── types        # Shared TypeScript interfaces & enums (roles, statuses)
│   └── validators   # Shared Zod schemas (request bodies, form validations)
```

---

## ✨ Features Checklist

### 🛍️ Customer Storefront (`apps/web`)
*   **Rich Premium UI/UX:** Built with a curated cream/rose palette, elegant fonts, glassmorphism, micro-animations, and full responsive support for mobile devices.
*   **Granular Catalog Filters:** Filter styles by category, brand, size, color, gender, and price range.
*   **Robust Product Details (PDP):** Image galleries with lightboxes, color-swatch selection, size guides, real-time stock indicator updates, Q&A sections, and reviews.
*   **Multi-Vendor Cart & Checkout:** Customers can buy from multiple vendors simultaneously. Payouts, taxes, and shipping rates are calculated and split per vendor dynamically.
*   **Confetti Order Confirmation & Invoice:** Dynamically generated PDF invoices on the fly using `@react-pdf/renderer` showing exact ordered items and totals.
*   **Zustand Persisted Stores:** Local state persistence for the cart, wishlist, address book, and notifications center.

### 💼 Vendor & Admin Panel (`apps/admin`)
*   **Real-Time Business Analytics:** Chart breakdowns of monthly revenues, sales distribution by order status, and top-selling products using Recharts.
*   **Catalog & Inventory Control:** Vendors can create products, manage sizes/colors, set separate compare-at pricing, and update stock counts.
*   **Order Fulfillment Dashboard:** Split-order tracking where each vendor manages their respective shipping/processing status independently.
*   **Enquiry Management:** Inbox for vendors to read customer queries (quotes, bulk request forms, custom designs) and respond directly.
*   **CMS Block Layout Editor:** Admins can configure the homepage layout and policies (terms, returns) dynamically using pre-built visual blocks.
*   **Review & Q&A Moderation:** Admins approve/reject customer reviews and manage product Q&A publishing.

---

## 🛠️ Technology Stack

*   **Monorepo Tooling:** Turborepo, pnpm Workspaces
*   **Frontend Storefront:** Next.js 15 (App Router, Tailwind CSS, Lucide React, Zustand)
*   **Admin/Vendor Dashboard:** React 19 (Vite, Tailwind CSS, Shadcn UI, Axios, Zustand)
*   **Backend Server:** Node.js, Express, TypeScript, Zod, Morgan, Winston Logger
*   **Database:** MongoDB, Mongoose
*   **Security:** JWT Access/Refresh tokens (rotation checks, HttpOnly cookies), Helmet, CORS headers, MongoDB injection sanitization, rate-limiting.

---

## 💾 Database Indexing Strategy

To guarantee optimal database performance during high-concurrency traffic, MongoDB indexes have been placed on critical query paths:

1.  **Product Model:**
    *   `{ vendor: 1, status: 1 }`: For fast vendor-catalog retrieval.
    *   `{ category: 1, status: 1, createdAt: -1 }`: Optimizes catalog browsing and category filters.
    *   `{ status: 1, isFeatured: 1 }`: Accelerates homepage product marquee rendering.
    *   Text Index `{ name: 'text', brand: 'text', description: 'text', tags: 'text' }`: Empowers full-text search with relative weights.
2.  **Order Model:**
    *   `{ orderNumber: 1 }` (Unique): For fast lookup of individual order tracking details.
    *   `{ customer: 1, createdAt: -1 }`: Optimizes customer order history loading.
    *   `{ 'fulfillments.vendorId': 1 }`: Allows vendors to pull their specific sub-orders quickly.
3.  **Review & Q&A Models:**
    *   `{ product: 1, isApproved: 1, createdAt: -1 }` (Reviews): Speeds up review loading on PDPs.
    *   `{ product: 1, customer: 1, order: 1 }` (Unique): Restricts customers to one review per purchased item.

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18 or higher)
*   pnpm (v8 or higher) — `npm i -g pnpm`
*   MongoDB Server (Local instance running on `mongodb://localhost:27017` or Atlas URI)

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository_url> stylehub
cd stylehub

# Install all monorepo dependencies
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` in the root directory to `.env`:
```bash
cp .env.example .env
```
Ensure the values are correct:
*   `MONGO_URI=mongodb://localhost:27017/stylehub`
*   `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set to secure strings.

Copy `apps/api/.env.example` to `apps/api/.env`:
```bash
cp apps/api/.env.example apps/api/.env
```

### Step 3: Seed Mock Data
A seeding script is provided to pre-populate the database with categories, vendors, products with color/size variants, CMS pages, banners, and sample orders:
```bash
pnpm --filter api seed
```

### Step 4: Run Development Servers
Start the Express API server, Next.js storefront, and Vite Admin Panel concurrently:
```bash
pnpm dev
```
*   **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
*   **Admin/Vendor Panel:** [http://localhost:3001](http://localhost:3001)
*   **Express API Server:** [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Evaluation Credentials

Use these credentials to log in and evaluate different roles:

*   **System Administrator:**
    *   **Email:** `admin@stylehub.in`
    *   **Password:** `password123`
    *   *Access:* Can moderate reviews, edit CMS blocks, approve vendors, inspect platform-wide logs, and view consolidated analytics.
*   **Vendor Store manager:**
    *   **Email:** `vendor@desicouture.in`
    *   **Password:** `password123`
    *   *Access:* Can manage inventory, update variant stocks, view store-specific order fulfillment splits, and respond to buyer enquiries.
*   **Customer Guest Shopping:**
    *   Add any item to the bag, click checkout, and input address and payment preferences (COD or Test Card). Order numbers are stored in local storage for account dashboard lookups.
