// ─── Simple stub factory for placeholder section pages ────────────────────────
import React from 'react';
import { LucideProps } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Tag, Store, ShoppingCart, FileText, Settings, Star, Users, MessageSquare } from 'lucide-react';

interface StubPageProps {
  title:       string;
  description: string;
  icon:        React.FC<LucideProps>;
  cta?:        string;
}

const StubPage: React.FC<StubPageProps> = ({ title, description, icon: Icon, cta }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-display">{title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
      {cta && (
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> {cta}
        </Button>
      )}
    </div>
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">Coming soon</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          This section is under construction. Check back soon!
        </p>
      </CardContent>
    </Card>
  </div>
);

export const CategoriesPage  = () => <StubPage title="Categories"  description="Manage your product category tree"     icon={Tag}           cta="Add Category" />;
export const VendorsPage     = () => <StubPage title="Vendors"     description="Manage vendor accounts & approvals"     icon={Store}         cta="Invite Vendor" />;
export const OrdersPage      = () => <StubPage title="Orders"      description="Browse and manage customer orders"      icon={ShoppingCart} />;
export const ReviewsPage     = () => <StubPage title="Reviews"     description="Moderate customer product reviews"      icon={Star} />;
export const EnquiriesPage   = () => <StubPage title="Enquiries"   description="Respond to customer enquiries"          icon={MessageSquare} />;
export const CMSPage         = () => <StubPage title="CMS"         description="Edit homepage sections & banners"       icon={FileText}      cta="Add Section" />;
