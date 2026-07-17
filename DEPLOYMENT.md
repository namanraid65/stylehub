# 🚀 StyleHub Deployment Guide & System Documentation

This guide provides step-by-step instructions to deploy the StyleHub Multi-Vendor Marketplace (MERN + Turborepo monorepo) to production environments using **MongoDB Atlas**, **Railway** (or **Render**), and **Vercel**.

---

## 📁 Environment Variables Matrix

To run StyleHub in production, you must configure environment variables across the backend, storefront, and admin services.

| Variable Name | Service | Purpose | Recommended Production Value |
| :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | Backend (API) | Execution environment | `production` |
| **`PORT`** | Backend (API) | Network port | *Set automatically by host* (e.g., Railway/Render) |
| **`MONGO_URI`** | Backend (API) | Database connection | MongoDB Atlas Connection String |
| **`JWT_ACCESS_SECRET`** | Backend (API) | Signs access tokens | Long, secure random hex string |
| **`JWT_REFRESH_SECRET`**| Backend (API) | Signs refresh tokens | Long, secure random hex string |
| **`WEB_URL`** | Backend (API) | URL of customer storefront | Storefront production URL (e.g., `https://stylehub-web.vercel.app`) |
| **`ADMIN_URL`** | Backend (API) | URL of admin panel | Admin panel production URL (e.g., `https://stylehub-admin.vercel.app`) |
| **`NEXT_PUBLIC_API_URL`**| Storefront (Web) | Backend API endpoint | Backend production API URL + `/api` (e.g., `https://stylehub-api.railway.app/api`) |
| **`VITE_API_URL`** | Admin Panel | Backend API endpoint | Backend production API URL + `/api` (e.g., `https://stylehub-api.railway.app/api`) |

---

## 💾 1. MongoDB Atlas Setup

StyleHub uses MongoDB as its primary database. Follow these steps to set up a cloud-hosted MongoDB Atlas instance:

1. **Create an Account / Log In**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. **Create a Cluster**:
   - Select the **M0 Shared Free Tier**.
   - Choose your preferred provider (AWS/GCP/Azure) and a region close to your target audience.
   - Click **Create Cluster**.
3. **Configure Database Access (Credentials)**:
   - Go to **Database Access** under the *Security* section in the sidebar.
   - Click **Add New Database User**.
   - Select **Password Authentication**. Set a username (e.g., `db_user`) and a secure password.
   - Under *Database User Privileges*, assign `Read and write to any database`.
   - Save the credentials.
4. **Configure Network Access (IP Whitelisting)**:
   - Go to **Network Access** under the *Security* section in the sidebar.
   - Click **Add IP Address**.
   - Since Railway/Render/Vercel use dynamic IP addresses, select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**.
5. **Retrieve Connection String**:
   - Go to **Database** under the *Deployment* section in the sidebar.
   - Click **Connect** on your cluster.
   - Select **Drivers** (Choose Node.js, version 4+).
   - Copy the connection string. It will look like this:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<username>` and `<password>` with the credentials created in Step 3. Set the database name by inserting `stylehub` right before the `?` (e.g., `...mongodb.net/stylehub?retryWrites=...`).

---

## ⚙️ 2. Railway Backend API Deployment (Recommended)

Railway is the simplest and most performant platform to deploy monorepo Node.js services.

### Step-by-Step Deployment:
1. Log in to [Railway.app](https://railway.app) using your GitHub account.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository (`namanraid65/stylehub`).
4. Click **Add Variables** but *do not build yet*.
5. Configure the following variables in the **Variables** tab:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://...` (your Atlas URI)
   - `JWT_ACCESS_SECRET` = `(generate a 64-character random string)`
   - `JWT_REFRESH_SECRET` = `(generate a 64-character random string)`
   - `WEB_URL` = `(your future Vercel storefront URL)`
   - `ADMIN_URL` = `(your future Vercel admin URL)`
6. Configure the Build and Start commands under the **Settings** tab:
   - **Root Directory**: Leave blank (monorepo root).
   - **Build Command**: `pnpm build --filter=@stylehub/api...` (builds the API package and all its workspace dependencies).
   - **Start Command**: `pnpm --filter=@stylehub/api start`
7. Click **Deploy**. Railway will automatically allocate a Port, provision a domain, and start your Express API server.
8. Go to **Settings** -> **Public Networking** -> click **Generate Domain** to get your public API URL (e.g., `https://stylehub-api-production.up.railway.app`).

---

## ⚙️ 3. Alternative: Render Backend API Deployment

Render is a robust alternative for deploying Node.js apps.

### Step-by-Step Deployment:
1. Log in to [Render.com](https://render.com) using your GitHub account.
2. Click **New** -> **Web Service**.
3. Connect your repository (`namanraid65/stylehub`).
4. Configure the Web Service settings:
   - **Name**: `stylehub-api`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `(Leave blank - keep at monorepo root)`
   - **Build Command**: `pnpm build --filter=@stylehub/api...`
   - **Start Command**: `pnpm --filter=@stylehub/api start`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `(your Atlas connection string)`
   - `JWT_ACCESS_SECRET` = `(secure string)`
   - `JWT_REFRESH_SECRET` = `(secure string)`
   - `WEB_URL` = `(your future Vercel storefront URL)`
   - `ADMIN_URL` = `(your future Vercel admin URL)`
6. Click **Create Web Service**.
7. Render will deploy your API and provide a public URL (e.g., `https://stylehub-api.onrender.com`).
   > [!NOTE]
   > On Render's Free tier, services spun down after 15 minutes of inactivity will take ~50 seconds to start back up on the next request.

---

## 🎨 4. Vercel Storefront (`apps/web`) Deployment

Vercel natively understands Turborepo monorepos and optimizes static/server page rendering.

### Step-by-Step Deployment:
1. Log in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your repository (`namanraid65/stylehub`).
4. On the configuration screen:
   - Set **Project Name** to `stylehub-web` (or any custom name).
   - Set **Framework Preset** to **Next.js**.
   - Set **Root Directory** to `apps/web`.
   - Vercel will automatically configure Turborepo commands. Confirm the settings:
     - **Build Command Override**: `cd ../.. && pnpm build --filter=@stylehub/web...`
     - **Output Directory Override**: Default (`.next`).
     - **Install Command Override**: Default (`pnpm install`).
5. Open the **Environment Variables** section and add:
   - `NEXT_PUBLIC_API_URL` = `(your production API URL + /api, e.g., https://stylehub-api.up.railway.app/api)`
6. Click **Deploy**. Vercel will build and host your customer storefront.
7. Copy the generated deployment URL (e.g., `https://stylehub-web.vercel.app`) and add/update it as the `WEB_URL` variable in your Backend service (Railway/Render).

---

## 💼 5. Vercel Admin/Vendor Panel (`apps/admin`) Deployment

Vite applications are fast to build and serve as static assets.

### Step-by-Step Deployment:
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your repository (`namanraid65/stylehub`).
4. On the configuration screen:
   - Set **Project Name** to `stylehub-admin`.
   - Set **Framework Preset** to **Vite**.
   - Set **Root Directory** to `apps/admin`.
   - Confirm the build overrides:
     - **Build Command Override**: `cd ../.. && pnpm build --filter=@stylehub/admin...`
     - **Output Directory Override**: Default (`dist`).
     - **Install Command Override**: Default (`pnpm install`).
5. Open the **Environment Variables** section and add:
   - `VITE_API_URL` = `(your production API URL + /api, e.g., https://stylehub-api.up.railway.app/api)`
6. Click **Deploy**. Vercel will compile the Vite client application.
7. Copy the generated deployment URL (e.g., `https://stylehub-admin.vercel.app`) and add/update it as the `ADMIN_URL` variable in your Backend service (Railway/Render).

---

## 📈 Database Seeding & Setup Verification

Once your backend is successfully deployed, verify its connection and populate the production database:

1. Locate the **health endpoint** of your API:
   - Navigate to `https://<your-api-url>/api/health`
   - You should receive: `{"status":"OK", "database":"connected"}`.
2. Run the seeding script locally pointing to your production database, or trigger it using Railway/Render console terminal:
   - Locally, temporary override `.env` variable `MONGO_URI` with the Atlas URI and run:
     ```bash
     pnpm --filter @stylehub/api db:seed
     ```
   - This pre-populates default admin, vendor, product catalogs, CMS templates, and settings.

---

## 🔑 Demo Evaluation Credentials

Log in with these credentials to review the marketplace roles:

### 👑 System Administrator
- **Login URL**: `https://<your-admin-url>/login`
- **Email**: `admin@stylehub.in`
- **Password**: `password123`
- **Capabilities**: Full CMS block layout overrides, customer review approval/deletion, QA moderation, platform-wide analytics, and audit log inspection.

### 💼 Vendor Store Manager
- **Login URL**: `https://<your-admin-url>/login`
- **Email**: `vendor@desicouture.in`
- **Password**: `password123`
- **Capabilities**: Inventory control, variant management (sizes, colors, comparisons), sub-order fulfillment flow tracking, customer bulk enquiries inbox, and store-specific revenue analytics.

### 🛒 Customer Storefront User
- **Login URL**: `https://<your-web-url>/`
- **Actions**: Add items, split orders by vendor automatically at checkout, download dynamically generated PDF invoices, post product reviews, and submit questions.

---

## 📪 Postman Collection Structure

Use this structure to test, audit, and debug the API endpoints.

```json
{
  "info": {
    "name": "StyleHub Marketplace API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        { "name": "Register Customer", "request": { "method": "POST", "url": "{{API_URL}}/auth/register" } },
        { "name": "Register Vendor", "request": { "method": "POST", "url": "{{API_URL}}/auth/vendor/register" } },
        { "name": "Login", "request": { "method": "POST", "url": "{{API_URL}}/auth/login" } },
        { "name": "Refresh Access Token", "request": { "method": "POST", "url": "{{API_URL}}/auth/refresh-token" } },
        { "name": "Get Profile Info", "request": { "method": "GET", "url": "{{API_URL}}/auth/me" } },
        { "name": "Update Profile Info", "request": { "method": "PUT", "url": "{{API_URL}}/auth/me" } },
        { "name": "Logout", "request": { "method": "POST", "url": "{{API_URL}}/auth/logout" } }
      ]
    },
    {
      "name": "Products & Categories",
      "item": [
        { "name": "List Categories", "request": { "method": "GET", "url": "{{API_URL}}/categories" } },
        { "name": "List Products (with query filters)", "request": { "method": "GET", "url": "{{API_URL}}/products?category=apparel&size=M&color=black&search=kurta" } },
        { "name": "Get Product by Slug", "request": { "method": "GET", "url": "{{API_URL}}/products/{{SLUG}}" } },
        { "name": "Create Product (Vendor/Admin Only)", "request": { "method": "POST", "url": "{{API_URL}}/products" } },
        { "name": "Update Product (Vendor/Admin Only)", "request": { "method": "PUT", "url": "{{API_URL}}/products/{{ID}}" } },
        { "name": "Delete Product (Vendor/Admin Only)", "request": { "method": "DELETE", "url": "{{API_URL}}/products/{{ID}}" } }
      ]
    },
    {
      "name": "Shopping Cart & Coupons",
      "item": [
        { "name": "Get Cart", "request": { "method": "GET", "url": "{{API_URL}}/cart" } },
        { "name": "Add/Update Item in Cart", "request": { "method": "POST", "url": "{{API_URL}}/cart/items" } },
        { "name": "Remove Item from Cart", "request": { "method": "DELETE", "url": "{{API_URL}}/cart/items/{{PRODUCT_ID}}" } },
        { "name": "Apply Discount Coupon", "request": { "method": "POST", "url": "{{API_URL}}/cart/coupons/apply" } }
      ]
    },
    {
      "name": "Order Management & Checkout",
      "item": [
        { "name": "Place Order (Checkout)", "request": { "method": "POST", "url": "{{API_URL}}/orders/checkout" } },
        { "name": "Get Customer Order History", "request": { "method": "GET", "url": "{{API_URL}}/orders/my-orders" } },
        { "name": "Get Order Details", "request": { "method": "GET", "url": "{{API_URL}}/orders/{{ORDER_ID}}" } },
        { "name": "Get Vendor Sub-Orders", "request": { "method": "GET", "url": "{{API_URL}}/orders/vendor-sub-orders" } },
        { "name": "Update Sub-Order Fulfillment (Vendor Only)", "request": { "method": "PATCH", "url": "{{API_URL}}/orders/{{ORDER_ID}}/fulfillment" } }
      ]
    },
    {
      "name": "Product Reviews & Q&As",
      "item": [
        { "name": "Get Product Reviews", "request": { "method": "GET", "url": "{{API_URL}}/reviews/{{PRODUCT_ID}}" } },
        { "name": "Submit Product Review (Verified Buyer)", "request": { "method": "POST", "url": "{{API_URL}}/reviews" } },
        { "name": "Moderate Reviews (Admin Only)", "request": { "method": "PATCH", "url": "{{API_URL}}/reviews/{{REVIEW_ID}}/moderate" } },
        { "name": "Get Product Q&A", "request": { "method": "GET", "url": "{{API_URL}}/qa/{{PRODUCT_ID}}" } },
        { "name": "Ask a Question", "request": { "method": "POST", "url": "{{API_URL}}/qa/ask" } },
        { "name": "Answer a Question (Vendor Only)", "request": { "method": "POST", "url": "{{API_URL}}/qa/answer/{{QA_ID}}" } }
      ]
    },
    {
      "name": "CMS & Settings Management",
      "item": [
        { "name": "Get Homepage Layout Blocks", "request": { "method": "GET", "url": "{{API_URL}}/cms/homepage" } },
        { "name": "Update Homepage Layout (Admin Only)", "request": { "method": "POST", "url": "{{API_URL}}/cms/homepage" } },
        { "name": "Get CMS Page by Slug", "request": { "method": "GET", "url": "{{API_URL}}/cms/pages/{{SLUG}}" } },
        { "name": "Update General Marketplace Settings", "request": { "method": "POST", "url": "{{API_URL}}/cms/settings" } }
      ]
    },
    {
      "name": "Analytics & Audit Logs",
      "item": [
        { "name": "Get Vendor Business Dashboard Data", "request": { "method": "GET", "url": "{{API_URL}}/analytics/vendor" } },
        { "name": "Get Admin consolidated analytics", "request": { "method": "GET", "url": "{{API_URL}}/analytics/admin" } },
        { "name": "Retrieve System Audit Logs (Admin Only)", "request": { "method": "GET", "url": "{{API_URL}}/activity/logs" } }
      ]
    }
  ]
}
```

---

## ✅ Final Feature Verification Checklist

Verify the entire feature set of StyleHub using this matrix:

### 🛒 Customer Storefront (`apps/web`)
- [ ] **Elegant UI/UX**: Cream, rose, and charcoal color hierarchy with premium Outfit & Inter typography.
- [ ] **Responsive Design**: Mobile-first navigation drawers, responsive grid catalog layouts, and fluid detail pages.
- [ ] **Multi-vendor Shopping Cart**: Cart merges and persists items. Sub-totals, tax estimations, and shipping fees are calculated per vendor.
- [ ] **Advanced Catalog Search & Filter**: Sidebar with filters for sizes (XS, S, M, L, XL, XXL), colors, pricing bounds, category selection, and typing full-text search.
- [ ] **Product Detail Page (PDP)**: Multiple images, dynamic inventory alerts (e.g., *Only 2 left in stock!*), customer reviews with averages, and Q&A accordion.
- [ ] **Cart Splitting & Invoice Generation**: Checkout groups purchased products by vendor, registers sub-orders, and triggers a downloadable PDF invoice detailing calculations.
- [ ] **Global State Stores**: Zustand persists Cart, Wishlist, Addresses, and Notifications locally.

### 💼 Vendor & Admin Operations (`apps/admin`)
- [ ] **Unified Authentication Screen**: Custom login paths router switching views based on user roles (`admin` vs `vendor`).
- [ ] **Consolidated Business Analytics**: Responsive Recharts area charts, bar graphs, and pie slices mapping revenues, order volume, and category demand.
- [ ] **Catalog & Stock Inventory**: Add products, describe details, specify multiple image paths, map variants, and adjust stock counts.
- [ ] **Fulfillment Interface**: Order grids where vendors can mark items as *Processing*, *Shipped*, or *Delivered* for their specific items.
- [ ] **CMS Dynamic Layout Canvas**: Simple widget list allowing administrators to drag and reposition banners, featured grids, categories, and policy footer text.
- [ ] **User Feedback Moderation Panel**: Approve, reject, or flag customer reviews and check incoming customer questions.
