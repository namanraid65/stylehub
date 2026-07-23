import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage              = lazy(() => import('./pages/auth/LoginPage'));
const OrdersPage             = lazy(() => import('./pages/orders/OrdersPage'));
const VendorsPage            = lazy(() => import('./pages/vendor/VendorsPage'));
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'));
const CustomersPage          = lazy(() => import('./pages/customers/CustomersPage'));
const SettingsPage           = lazy(() => import('./pages/settings/SettingsPage'));

// Admin catalogue
const AdminProductsPage      = lazy(() => import('./pages/products/ProductsPage'));
const CategoriesPage         = lazy(() => import('./pages/categories/CategoriesPage'));
const ReviewsPage            = lazy(() => import('./pages/reviews/ReviewsPage'));

// New feature pages
const EnquiriesPage          = lazy(() => import('./pages/enquiries/EnquiriesPage'));
const AnalyticsPage          = lazy(() => import('./pages/analytics/AnalyticsPage'));
const ActivityLogPage        = lazy(() => import('./pages/activity/ActivityLogPage'));
const CMSPageEditor          = lazy(() => import('./pages/cms/CMSPageEditor'));
const DiscountsPage          = lazy(() => import('./pages/discounts/DiscountsPage'));
const VendorPayoutsPage      = lazy(() => import('./pages/vendor/VendorPayoutsPage'));

// Vendor pages
const StoreProfilePage       = lazy(() => import('./pages/vendor/StoreProfilePage'));
const VendorProductsPage     = lazy(() => import('./pages/vendor/VendorProductsPage'));
const ProductFormPage        = lazy(() => import('./pages/vendor/ProductFormPage'));
const VendorOrdersPage       = lazy(() => import('./pages/vendor/VendorOrdersPage'));
const VendorEnquiriesPage    = lazy(() => import('./pages/vendor/VendorEnquiriesPage'));



// ─── Full-page loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-full min-h-[400px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// ─── 401 Page ─────────────────────────────────────────────────────────────────
const UnauthorizedPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-8">
    <p className="text-7xl font-bold font-display bg-clip-text text-transparent gradient-violet">401</p>
    <p className="text-xl font-semibold">Unauthorized</p>
    <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
    <a href="/dashboard" className="text-primary hover:underline text-sm">← Back to Dashboard</a>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public routes ─────────────────────────────────────────────────── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/"             element={<Navigate to="/dashboard" replace />} />

        {/* ── Protected shell — ALL authenticated pages live here ───────────── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* ── Shared (admin + vendor) ──────────────────────────────────── */}
          <Route path="/dashboard"    element={<DashboardPage />} />

          {/* Admin-only platform pages */}
          <Route
            path="/orders"
            element={<ProtectedRoute allowedRoles={['admin']}><OrdersPage /></ProtectedRoute>}
          />
          <Route
            path="/reviews"
            element={<ProtectedRoute allowedRoles={['admin']}><ReviewsPage /></ProtectedRoute>}
          />
          <Route
            path="/enquiries"
            element={<ProtectedRoute allowedRoles={['admin']}><EnquiriesPage /></ProtectedRoute>}
          />
          <Route
            path="/products"
            element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsPage /></ProtectedRoute>}
          />

          <Route
            path="/categories"
            element={<ProtectedRoute allowedRoles={['admin']}><CategoriesPage /></ProtectedRoute>}
          />
          <Route
            path="/vendors"
            element={<ProtectedRoute allowedRoles={['admin']}><VendorsPage /></ProtectedRoute>}
          />
          <Route
            path="/customers"
            element={<ProtectedRoute allowedRoles={['admin']}><CustomersPage /></ProtectedRoute>}
          />
          <Route
            path="/cms"
            element={<ProtectedRoute allowedRoles={['admin']}><CMSPageEditor /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute allowedRoles={['admin']}><AnalyticsPage /></ProtectedRoute>}
          />
          <Route
            path="/activity"
            element={<ProtectedRoute allowedRoles={['admin']}><ActivityLogPage /></ProtectedRoute>}
          />
          <Route
            path="/discounts"
            element={<ProtectedRoute allowedRoles={['admin', 'vendor']}><DiscountsPage /></ProtectedRoute>}
          />

          {/* ── Vendor-only section ───────────────────────────────────────── */}

          {/* Store profile */}
          <Route
            path="/vendor/store"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <StoreProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/payouts"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <VendorPayoutsPage />
              </ProtectedRoute>
            }
          />


          {/* Product list (vendor sees their own products) */}
          <Route
            path="/vendor/products"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <VendorProductsPage />
              </ProtectedRoute>
            }
          />

          {/* Create new product */}
          <Route
            path="/vendor/products/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <ProductFormPage mode="create" />
              </ProtectedRoute>
            }
          />

          {/* Edit existing product */}
          <Route
            path="/vendor/products/:productId/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <ProductFormPage mode="edit" />
              </ProtectedRoute>
            }
          />

          {/* Vendor orders */}
          <Route
            path="/vendor/orders"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <VendorOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Vendor enquiries */}
          <Route
            path="/vendor/enquiries"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <VendorEnquiriesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
