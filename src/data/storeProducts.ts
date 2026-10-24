export interface StoreProduct {
  id: string;
  name: string;
  brand: string;
  subCategory: string;
  category: string;
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

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  // KYC Brand
  {
    id: "kyc-wise-eu",
    name: "KYC Verified Wise Personal & Business [EU/UK + Full Docs & Selfies]",
    brand: "KYC",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 85.00,
    originalPrice: 120.00,
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1000",
    description: "Fully verified Wise account with multi-currency IBAN support, clean transaction history, full document pack, and selfie verification pass.",
    badge: "Tier 2 Verified",
    tag: "KYC",
    stock: 15,
    warrantyInfo: "30-Day Instant Replacement Guarantee",
    featured: true
  },
  {
    id: "kyc-stripe-us",
    name: "KYC Verified Stripe Account [US / Instant Payouts Active]",
    brand: "KYC",
    subCategory: "Accounts",
    category: "SERVICES",
    price: 149.00,
    originalPrice: 210.00,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
    description: "Verified US Stripe merchant account with automated 2-day payouts activated, clean SSN/EIN paperwork, and zero chargeback flags.",
    badge: "Merchant Grade",
    tag: "KYC",
    stock: 8,
    warrantyInfo: "60-Day Payout & Compliance Guarantee",
    featured: true
  },
  {
    id: "kyc-binance-bybit",
    name: "KYC Tier 2 Binance / Bybit Crypto Account [Proof of Address Pass]",
    brand: "KYC",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 65.00,
    originalPrice: 95.00,
    image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=1000",
    description: "Level 2 advanced identity verified crypto exchange account with unlimited withdrawal limits, 2FA recovery keys, and clean IP history.",
    badge: "High Limit",
    tag: "KYC",
    stock: 22,
    warrantyInfo: "45-Day Account Replacement Warranty"
  },
  {
    id: "kyc-bundle-docs",
    name: "KYC Global Identity Verification Pack [High-Res Clean ID + Utility Bill]",
    brand: "KYC",
    subCategory: "Documents",
    category: "DIGITAL",
    price: 39.00,
    originalPrice: 60.00,
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1000",
    description: "High resolution fresh passport/national ID scan pair with matching dated utility bill (English/EU) passed through MRZ check.",
    badge: "100% Pass Rate",
    tag: "KYC",
    stock: 50,
    warrantyInfo: "Free Verification Re-check Guarantee"
  },

  // Discord Brand
  {
    id: "discord-nitro-1y",
    name: "Discord Nitro 1 Year [Gift Link / Direct]",
    brand: "Discord",
    subCategory: "Subscriptions",
    category: "SUBSCRIPTION",
    price: 34.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1000",
    description: "Full Discord Nitro 12-Month subscription gift code. Global activation without revokes.",
    badge: "Hot Deal",
    tag: "DISCORD",
    stock: 48,
    warrantyInfo: "12-Month Non-Revoke Warranty",
    featured: true
  },
  {
    id: "discord-aged-2016",
    name: "Discord Aged Account [2016 Early Badge]",
    brand: "Discord",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 49.00,
    originalPrice: 65.00,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000",
    description: "Clean registered 2016 Discord account with OG creation badge and clean history.",
    badge: "Rare",
    tag: "DISCORD",
    stock: 14,
    warrantyInfo: "Lifetime Creation Badge Warranty"
  },
  {
    id: "discord-aged-2017-pva",
    name: "Discord Aged Account [2017 / Phone Verified / OGE]",
    brand: "Discord",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 35.00,
    originalPrice: 50.00,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
    description: "Original 2017 Discord account with full email ownership and aged credentials.",
    tag: "DISCORD",
    stock: 28,
    warrantyInfo: "90-Day Full Access Warranty"
  },
  {
    id: "discord-server-boost-14x",
    name: "Discord 14x Server Boosts [3 Months]",
    brand: "Discord",
    subCategory: "Boosts",
    category: "SERVICES",
    price: 19.99,
    originalPrice: 35.00,
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1000",
    description: "Instantly unlock Level 3 perks for your server for 90 days with guaranteed uptime.",
    badge: "Popular",
    tag: "DISCORD",
    stock: 99,
    warrantyInfo: "90-Day Uptime Replacement Guarantee"
  },
  {
    id: "discord-bot-token-pack",
    name: "Discord Phone Verified Tokens [HQ / Email]",
    brand: "Discord",
    subCategory: "Tokens",
    category: "DIGITAL",
    price: 12.50,
    originalPrice: 20.00,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
    description: "High quality phone & email verified Discord tokens with custom avatars and bio.",
    tag: "DISCORD",
    stock: 250,
    warrantyInfo: "24-Hour Token Replacement Window"
  },

  // TikTok Brand
  {
    id: "tiktok-live-creator",
    name: "TikTok Creator Account [Live Studio Enabled]",
    brand: "TikTok",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 39.00,
    originalPrice: 60.00,
    image: "https://images.unsplash.com/photo-1579869847556-9a259c716bbd?auto=format&fit=crop&q=80&w=1000",
    description: "TikTok account with 1,000+ followers and instant TikTok Live Studio streaming access.",
    badge: "Fast Delivery",
    tag: "TIKTOK",
    stock: 19,
    warrantyInfo: "14-Day Stream Feature Guarantee",
    featured: true
  },
  {
    id: "tiktok-creativity-monetized",
    name: "TikTok US Creator Rewards Program Ready",
    brand: "TikTok",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 89.00,
    originalPrice: 120.00,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000",
    description: "US-region aged TikTok account eligible for the Creator Rewards Program monetization.",
    badge: "Monetized",
    tag: "TIKTOK",
    stock: 8,
    warrantyInfo: "30-Day Monetization Status Guarantee"
  },
  {
    id: "tiktok-aged-10k",
    name: "TikTok Aged Account [10k+ Organic Real Followers]",
    brand: "TikTok",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 49.00,
    originalPrice: 75.00,
    image: "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&q=80&w=1000",
    description: "Organic aged TikTok account with 10k+ genuine active followers, clean algorithm standing, and live features.",
    badge: "Top Value",
    tag: "TIKTOK",
    stock: 12,
    warrantyInfo: "30-Day Follower Stability Warranty"
  }
];

// Initial Brands section: ONLY KYC, Discord, and TikTok for now
export const BRANDS_LIST = [
  { name: "KYC", count: "4" },
  { name: "Discord", count: "5" },
  { name: "TikTok", count: "3" },
];

export const SUB_CATEGORIES_LIST = [
  { name: "Accounts", count: "7" },
  { name: "Subscriptions", count: "1" },
  { name: "Boosts", count: "1" },
  { name: "Tokens", count: "1" },
  { name: "Documents", count: "1" },
  { name: "Licenses", count: "0" },
  { name: "Services", count: "2" },
];
