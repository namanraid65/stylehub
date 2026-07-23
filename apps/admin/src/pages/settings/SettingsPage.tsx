import React, { useState } from 'react';
import {
  Settings, Shield, DollarSign, Globe, Save, Loader2,
  CheckCircle2, Bell, AlertTriangle, HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

type ActiveTab = 'general' | 'payments' | 'security' | 'notifications';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [general, setGeneral] = useState({
    platformName: 'StyleHub',
    supportEmail: 'support@stylehub.in',
    contactPhone: '+91 98765 43210',
    metaTitle: 'StyleHub — Premium Multi-Vendor Fashion Marketplace',
    metaDesc: 'Discover the latest in premium designer fashion, ethnic wear, footwear and more.',
  });

  const [finance, setFinance] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedComm = localStorage.getItem('stylehub_platform_commission');
      if (savedComm) {
        return {
          commission: Number(savedComm),
          deliveryFee: 99,
          freeDeliveryThreshold: 1999,
          taxRate: 18,
        };
      }
    }
    return {
      commission: 12, // 12% default admin commission
      deliveryFee: 99,
      freeDeliveryThreshold: 1999,
      taxRate: 18,
    };
  });

  const [security, setSecurity] = useState({
    enableMfa: true,
    requireVerification: true,
    sessionTimeout: 60, // 60 minutes
  });

  const handleSave = () => {
    setSaving(true);
    setSuccess(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('stylehub_platform_commission', String(finance.commission));
    }

    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };


  const navItems = [
    { id: 'general', label: 'General Configuration', icon: Globe },
    { id: 'payments', label: 'Commission & Delivery', icon: DollarSign },
    { id: 'security', label: 'Security & Auth', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure platform parameters and settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 self-start sm:self-auto min-w-[130px]">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Nav */}
        <div className="w-full md:w-[240px] shrink-0 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl border text-left transition-all',
                  active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Form Panels */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-display">General Configuration</CardTitle>
                <CardDescription>Setup metadata, names, and contact emails for the platform brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={general.platformName}
                      onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Contact Phone Number</Label>
                  <Input
                    id="contactPhone"
                    value={general.contactPhone}
                    onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle">SEO Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={general.metaTitle}
                    onChange={(e) => setGeneral({ ...general, metaTitle: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metaDesc">SEO Meta Description</Label>
                  <Input
                    id="metaDesc"
                    value={general.metaDesc}
                    onChange={(e) => setGeneral({ ...general, metaDesc: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-display">Commission & Delivery</CardTitle>
                <CardDescription>Configure marketplace commission rates, shipping costs, and GST taxes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="commission">Admin Commission Rate (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      value={finance.commission}
                      onChange={(e) => setFinance({ ...finance, commission: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="taxRate">Standard GST Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={finance.taxRate}
                      onChange={(e) => setFinance({ ...finance, taxRate: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryFee">Flat Delivery Fee (₹)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      value={finance.deliveryFee}
                      onChange={(e) => setFinance({ ...finance, deliveryFee: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="freeThreshold">Free Delivery Threshold (₹)</Label>
                    <Input
                      id="freeThreshold"
                      type="number"
                      value={finance.freeDeliveryThreshold}
                      onChange={(e) => setFinance({ ...finance, freeDeliveryThreshold: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-display">Security & Auth</CardTitle>
                <CardDescription>Manage user account authentication, MFA options, and login security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Require Email Verification</Label>
                    <p className="text-xs text-muted-foreground">New customers must verify email before checking out.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={security.requireVerification}
                    onChange={(e) => setSecurity({ ...security, requireVerification: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Enable Two-Factor Auth (MFA)</Label>
                    <p className="text-xs text-muted-foreground">Require MFA codes during admin panel logins.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={security.enableMfa}
                    onChange={(e) => setSecurity({ ...security, enableMfa: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sessionTimeout">Session Timeout Duration (Minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
