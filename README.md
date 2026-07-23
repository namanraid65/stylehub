# 🛍️ StyleHub — Multi-Vendor Fashion & Lifestyle Marketplace

![StyleHub Banner](https://img.shields.io/badge/StyleHub-E--Commerce%20Marketplace-C84B31?style=for-the-badge&logo=shopify&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-MERN%20Monorepo%20(Next.js%2015%20%7C%20Vite%20%7C%20Express%20%7C%20MongoDB)-111111?style=for-the-badge)

**StyleHub** is a premium, high-performance multi-vendor e-commerce platform built on a modern **MERN (MongoDB, Express, Next.js 15, Node.js)** monorepo architecture. Designed specifically for fashion, apparel, and boutique marketplace operations, StyleHub features real-time cloud synchronization, interactive garment zoom lenses, instant email billing, dynamic low-stock scarcity badges, Amazon/Myntra style sale campaign management, digital wallet rewards, scan & pay UPI simulation, and AI-powered boutique vendor tools.

---

## 🔥 Key Highlight Features

### 🏷️ 1. Amazon & Myntra Style Sales & Discount Manager
* **Admin & Vendor Sales Campaigns:** Launch platform-wide or store-specific sale events via the **Discounts & Promotions** dashboard (`/discounts`).
* **Target Scopes:**
  - **All Products:** Platform-wide or storewide percentage/flat discounts (*e.g., "Flat 20% OFF Everything"*).
  - **By Category:** Target specific apparel/shoe categories (*e.g., "Ethnic Wear Sale"* or *"30% OFF Shoes"*).
  - **Selected Products:** Apply custom deal badges to specific product IDs.
* **Badges & Strikethroughs:** Automatically calculates sale prices, strikethrough original prices, and displays promotional badges (*"FESTIVE SALE 20% OFF"*).

### ⚡ 2. Real-Time Customer Engagement & Order Tracking
* **Flash Deal Countdown Banner (`FlashSaleBanner.tsx`):** Animated live countdown timer with stock scarcity progress bars (*"⚡ Only 16 items left in stock!"*).
* **Live Package Order Tracker (`OrderTrackerStepper.tsx`):** Interactive shipment progress timeline (*Placed ➔ Packing ➔ Shipped ➔ Delivery*) with Awb tracking IDs in the customer account dashboard (`/account`).


### 📧 3. Gmail & SMTP Email Invoicing ("Bill on Gmail")
* **Automated Order Receipts:** Dispatches HTML order invoices directly to the customer's email address (*Gmail SMTP / Resend API*) upon checkout completion, complete with GST breakdown and downloadable PDF invoices.


### 🏪 4. AI Fashion Writer & Vendor Enterprise Tools
* **AI Fashion Description Generator (`AiDescriptionGeneratorModal.tsx`):** One-click **"Auto-Generate with AI"** magic button in the Vendor Product form to write catchy, high-converting product descriptions and highlights.
* **Bulk CSV Product Importer (`BulkProductCsvModal.tsx`):** Drag-and-drop CSV batch upload modal for vendors with sample CSV template downloads.
* **Vendor Settlement Ledger (`VendorPayoutsPage.tsx`):** Dedicated payout ledger tracking gross sales, platform commission deductions, and bank settlements.

### 🔄 5. Automatic Cart & Wishlist Cloud Sync (`SyncObserver`)
* **Cross-Device & Guest Sync:** Cart & wishlist items automatically persist across browser sessions using **Zustand** local storage and sync to MongoDB via `/api/cart/sync` and `/api/auth/wishlist/sync` upon login.

### 🔍 6. Garment Image Magnification Lens (PDP Zoom)
* **High-Precision Magnifier:** Product Detail Pages (PDP) feature a cursor-following zoom lens enabling buyers to inspect fine fabric textures, stitching details, and print quality.

### ⚠️ 7. Low Stock & Scarcity Urgency Badges
* **Dynamic Indicators:** Real-time stock alerts (*e.g., "⚡ Only 2 left in stock!"*) on product pages and variant selectors to prevent overselling.


---

## 🏗️ Monorepo Architecture & Structure

StyleHub is structured as a **Turborepo monorepo** using **pnpm workspaces**:

```text
stylehub/
├── apps/
│   ├── api/          # Express.js (TypeScript) REST API with MongoDB & Cloudinary/Multer
│   ├── admin/        # Vite + React (TypeScript) + Tailwind Dashboard for Admins & Vendors
│   └── web/          # Next.js 15 (App Router) Storefront for Customer Shopping
└── packages/
    ├── types/        # Shared TypeScript interfaces & enums (Order, Product, User, Cart)
    └── validators/   # Shared Zod validation schemas (Auth, Orders, Products, Cart)
```

---

## 🚀 Setup & Local Installation

### Prerequisites
* **Node.js:** v20.x or higher
* **pnpm:** v9.x or higher (`npm i -g pnpm`)
* **MongoDB:** Local instance on `mongodb://localhost:27017` or a MongoDB Atlas URI

### Step 1: Clone and Install
```bash
git clone https://github.com/namanraid65/stylehub.git
cd stylehub

# Install all monorepo dependencies
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in `apps/api`:
```bash
cp apps/api/.env.example apps/api/.env
```

### Step 3: Seed Database
Populate the database with sample boutique vendors, multi-variant products, categories, CMS layouts, and discounts:
```bash
pnpm --filter @stylehub/api db:seed
```

To clear and re-create fresh test orders across all vendors:
```bash
cd apps/api && npx ts-node src/scripts/reset-orders.ts
```

### Step 4: Run Development Servers
Start all applications concurrently:
```bash
pnpm dev
```

* 🛍️ **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
* 💼 **Admin & Vendor Dashboard:** [http://localhost:3001](http://localhost:3001)
* ⚙️ **Express API Server:** [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Evaluation Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@stylehub.in` | `password123` | Create platform discount sales, moderate reviews, edit CMS, inspect analytics, platform settings, & all orders. |
| **Vendor Manager (DesiCouture)** | `vendor@desicouture.in` | `password123` | Manage DesiCouture boutique, use AI description generator, import CSV products, view store orders & payouts. |
| **Customer Accounts** | `aarav@gmail.com`<br>`priya@gmail.com` | `password123` | Test flash sales, StyleCoins wallet, UPI QR code payment, order tracking, and image zoom lens. |

---

