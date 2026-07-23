import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Store, Globe, Mail, Phone, Instagram, Twitter, Facebook,
  Loader2, CheckCircle2, Camera, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import ImageUploadZone from '../../components/vendor/ImageUploadZone';
import vendorApi from '../../api/vendor.api';
import { useUser } from '../../stores/auth.store';
import { cn } from '../../lib/utils';

// ─── Validation schema ────────────────────────────────────────────────────────
const storeSchema = z.object({
  storeName:        z.string().min(3, 'Store name must be at least 3 characters').max(80),
  storeDescription: z.string().min(20, 'Write at least 20 characters').max(1000),
  businessEmail:    z.string().email().optional().or(z.literal('')),
  businessPhone:    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  returnPolicy:     z.string().max(500).optional(),
  instagram:        z.string().url().optional().or(z.literal('')),
  facebook:         z.string().url().optional().or(z.literal('')),
  twitter:          z.string().url().optional().or(z.literal('')),
  website:          z.string().url().optional().or(z.literal('')),
});

type StoreFormValues = z.infer<typeof storeSchema>;

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  approved:  { label: 'Approved',  variant: 'success' },
  pending:   { label: 'Pending Review', variant: 'warning' },
  rejected:  { label: 'Rejected',  variant: 'destructive' },
  suspended: { label: 'Suspended', variant: 'destructive' },
};

const StoreProfilePage: React.FC = () => {
  const user = useUser();
  const [logoUrl, setLogoUrl]     = useState<string[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [storeStatus, setStoreStatus] = useState<string>('pending');
  const [loading, setLoading]     = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName:        '',
      storeDescription: '',
      businessEmail:    user?.email ?? '',
      businessPhone:    '',
      returnPolicy:     'Returns accepted within 7 days of delivery in original condition.',
    },
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getMyStore();
        const profile = res.data?.data || (res as any).data;
        if (profile) {
          setStoreStatus(profile.status || 'pending');
          if (profile.storeLogo) setLogoUrl([profile.storeLogo]);
          if (profile.storeBanner) setBannerUrl([profile.storeBanner]);
          reset({
            storeName: profile.storeName || '',
            storeDescription: profile.storeDescription || '',
            businessEmail: profile.businessEmail || user?.email || '',
            businessPhone: profile.businessPhone || '',
            returnPolicy: profile.returnPolicy || 'Returns accepted within 7 days of delivery in original condition.',
            instagram: profile.socialLinks?.instagram || '',
            facebook: profile.socialLinks?.facebook || '',
            twitter: profile.socialLinks?.twitter || '',
            website: profile.socialLinks?.website || '',
          });
        }
      } catch (err) {
        console.error('Failed to load vendor profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, reset]);

  const onSubmit = async (data: StoreFormValues) => {
    setSaving(true);
    setSaved(false);
    try {
      await vendorApi.updateMyStore({
        storeName:        data.storeName,
        storeDescription: data.storeDescription,
        businessEmail:    data.businessEmail || undefined,
        businessPhone:    data.businessPhone || undefined,
        returnPolicy:     data.returnPolicy,
        storeLogo:        logoUrl[0],
        storeBanner:      bannerUrl[0],
        socialLinks: Object.fromEntries(
          Object.entries({
            instagram: data.instagram || '',
            facebook:  data.facebook  || '',
            twitter:   data.twitter   || '',
            website:   data.website   || '',
          }).filter(([, v]) => v !== ''),
        ) as { instagram?: string; facebook?: string; twitter?: string; website?: string },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Store Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set up your storefront — how customers will see you.
          </p>
        </div>
        {(() => {
          const cfg = STATUS_BADGE[storeStatus];
          return cfg ? (
            <Badge variant={cfg.variant} className="gap-1.5 py-1 px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {cfg.label}
            </Badge>
          ) : null;
        })()}
      </div>

      {/* Pending notice */}
      {storeStatus === 'pending' && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Approval</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Complete your store profile and our team will review within 24 hours.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Store visuals ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" /> Store Visuals
            </CardTitle>
            <CardDescription>Your logo appears on product listings. Banner shows on your store page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex gap-4 items-start">
              {/* Preview circle */}
              <div className="h-20 w-20 shrink-0 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
                {logoUrl[0] ? (
                  <img src={logoUrl[0]} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <ImageUploadZone
                  images={logoUrl}
                  onChange={setLogoUrl}
                  maxImages={1}
                  label="Store Logo"
                  aspect="square"
                />
              </div>
            </div>

            <Separator />

            {/* Banner */}
            <ImageUploadZone
              images={bannerUrl}
              onChange={setBannerUrl}
              maxImages={1}
              label="Store Banner (recommended: 1200 × 400 px)"
              aspect="banner"
            />
          </CardContent>
        </Card>

        {/* ── Store info ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" /> Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  placeholder="e.g. UrbanThreads Official"
                  error={errors.storeName?.message}
                  {...register('storeName')}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="storeDescription">Store Description *</Label>
                <Textarea
                  id="storeDescription"
                  rows={4}
                  placeholder="Tell customers what makes your store special — style, values, speciality…"
                  error={errors.storeDescription?.message}
                  {...register('storeDescription')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessEmail">Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="store@example.com"
                    className="pl-9"
                    error={errors.businessEmail?.message}
                    {...register('businessEmail')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="businessPhone"
                    placeholder="9876543210"
                    className="pl-9"
                    error={errors.businessPhone?.message}
                    {...register('businessPhone')}
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Textarea
                  id="returnPolicy"
                  rows={2}
                  placeholder="Describe your return/exchange policy…"
                  error={errors.returnPolicy?.message}
                  {...register('returnPolicy')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Social links ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" /> Social & Web Links
            </CardTitle>
            <CardDescription>Help customers find you on social media.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { id: 'instagram', Icon: Instagram, placeholder: 'https://instagram.com/yourstore',  label: 'Instagram' },
              { id: 'facebook',  Icon: Facebook,  placeholder: 'https://facebook.com/yourstore',   label: 'Facebook' },
              { id: 'twitter',   Icon: Twitter,   placeholder: 'https://twitter.com/yourstore',    label: 'Twitter/X' },
              { id: 'website',   Icon: Globe,     placeholder: 'https://yourwebsite.com',          label: 'Website' },
            ].map(({ id, Icon, placeholder, label }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id={id}
                    placeholder={placeholder}
                    className="pl-9"
                    error={(errors as Record<string, { message?: string }>)[id]?.message}
                    {...register(id as keyof StoreFormValues)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Save button ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" /> Saved successfully!
            </span>
          )}
          <Button type="submit" disabled={saving || !isDirty} className="min-w-[140px] gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              'Save Store Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StoreProfilePage;
