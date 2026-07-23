import apiClient from './client';

export interface CmsBlock {
  id:       string;
  type:     'hero' | 'rich_text' | 'image' | 'featured_products' | 'banner_strip' | 'testimonials' | 'faq' | 'cta' | 'spacer';
  order:    number;
  isActive: boolean;
  data:     Record<string, unknown>;
  label?:   string;
}

export interface CmsPage {
  _id?:        string;
  slug:        string;
  title:       string;
  description?:string;
  seoTitle?:   string;
  seoDesc?:    string;
  blocks:      CmsBlock[];
  isPublished: boolean;
  updatedAt?:  string;
}

export interface Banner {
  _id?:      string;
  id?:       string;
  title:     string;
  subtitle?: string;
  imageUrl:  string;
  linkUrl?:  string;
  linkLabel?:string;
  placement: string;
  order:     number;
  isActive:  boolean;
  bgColor?:  string;
}

const cmsApi = {
  // Pages
  getPages: () =>
    apiClient.get<{ pages: CmsPage[] }>('/cms/pages'),

  getPageBySlug: (slug: string) =>
    apiClient.get<{ page: CmsPage }>(`/cms/pages/${slug}`),

  createPage: (data: Partial<CmsPage>) =>
    apiClient.post<{ page: CmsPage }>('/cms/pages', data),

  updatePage: (slug: string, data: Partial<CmsPage>) =>
    apiClient.put<{ page: CmsPage }>(`/cms/pages/${slug}`, data),

  togglePublish: (slug: string, isPublished: boolean) =>
    apiClient.patch<{ page: CmsPage }>(`/cms/pages/${slug}/publish`, { isPublished }),

  deletePage: (slug: string) =>
    apiClient.delete<{ message: string }>(`/cms/pages/${slug}`),

  updateBlocks: (slug: string, blocks: CmsBlock[]) =>
    apiClient.put<{ page: CmsPage }>(`/cms/pages/${slug}/blocks`, { blocks }),

  // Banners
  getBanners: (placement?: string) =>
    apiClient.get<{ banners: Banner[] }>('/cms/banners', { params: { placement } }),

  createBanner: (data: Partial<Banner>) =>
    apiClient.post<{ banner: Banner }>('/cms/banners', data),

  updateBanner: (id: string, data: Partial<Banner>) =>
    apiClient.put<{ banner: Banner }>(`/cms/banners/${id}`, data),

  deleteBanner: (id: string) =>
    apiClient.delete<{ message: string }>(`/cms/banners/${id}`),
};

export default cmsApi;
