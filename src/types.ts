export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  name: string;
  image?: string;
  role: 'admin' | 'customer';
  twoFactorEnabled?: boolean;
  discordId?: string;
  googleId?: string;
  tiktokId?: string;
  instagramId?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  badge?: string;
  tag?: string;
  stock?: number;
  featured?: boolean;
  warrantyInfo?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  userId: string;
  products: { product: Product; quantity: number }[];
  total: number;
  status: 'Pending' | 'Payment Verified' | 'Preparing' | 'Delivering' | 'Completed' | 'Refunded' | 'Cancelled';
  date: string;
}
