import { Gender, ProductStatus, SizeCategory } from './enums';

export interface IVariant {
  _id: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  price?: number; // Override base price if set
  stock: number;
  images: string[];
  weight?: number;
  barcode?: string;
  sizeCategory: SizeCategory;
}

export interface IProduct {
  _id: string;
  vendor: string;
  store: string;
  category: string | ICategory;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  tags: string[];
  images: string[];
  gender: Gender;
  material?: string;
  careInstructions?: string;
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  variants: IVariant[];
  totalStock: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  parent?: string | ICategory;
  image?: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
}

export interface IStore {
  _id: string;
  vendor: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  tags: string[];
  location?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  rating: number;
  totalSales: number;
  isActive: boolean;
}

// Lightweight version for cards / search results
export type IProductCard = Pick<
  IProduct,
  | '_id'
  | 'name'
  | 'slug'
  | 'images'
  | 'basePrice'
  | 'compareAtPrice'
  | 'avgRating'
  | 'reviewCount'
  | 'brand'
  | 'gender'
  | 'status'
  | 'totalStock'
>;
