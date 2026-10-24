import fs from "fs";
import path from "path";
import { prisma, isDatabaseConfigured } from "./db.js";

export interface CatalogProduct {
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
  stock: number; // -1 for unlimited / instant delivery
  featured?: boolean;
  warrantyInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogBrand {
  name: string;
  description?: string;
  count?: number;
}

export interface CatalogSubCategory {
  name: string;
  count?: number;
}

export interface CatalogData {
  brands: CatalogBrand[];
  subcategories: CatalogSubCategory[];
  products: CatalogProduct[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_FILE = path.join(DATA_DIR, "catalog.json");

// Initial data: ONLY KYC, Discord, and TikTok for brands!
const INITIAL_CATALOG: CatalogData = {
  brands: [
    { name: "KYC", description: "Verified KYC accounts, documents & merchant setups" },
    { name: "Discord", description: "Discord Nitro, aged accounts, server boosts & tokens" },
    { name: "TikTok", description: "Creator studio, monetization ready & high follower accounts" }
  ],
  subcategories: [
    { name: "Accounts" },
    { name: "Subscriptions" },
    { name: "Boosts" },
    { name: "Tokens" },
    { name: "Documents" },
    { name: "Licenses" },
    { name: "Services" }
  ],
  products: [
    // KYC Products
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

    // Discord Products
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

    // TikTok Products
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
  ]
};

function ensureCatalogFile(): CatalogData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CATALOG_FILE)) {
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(INITIAL_CATALOG, null, 2), "utf8");
      return INITIAL_CATALOG;
    }
    const raw = fs.readFileSync(CATALOG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.brands || !Array.isArray(parsed.brands) || !parsed.products || !Array.isArray(parsed.products)) {
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(INITIAL_CATALOG, null, 2), "utf8");
      return INITIAL_CATALOG;
    }
    return parsed;
  } catch (err) {
    console.error("[Catalog] Error reading catalog file:", err);
    return INITIAL_CATALOG;
  }
}

function writeCatalogFile(data: CatalogData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[Catalog] Error writing catalog file:", err);
  }
}

export function getCatalogWithCounts(): CatalogData {
  const data = ensureCatalogFile();
  
  // Calculate dynamic product counts
  const brandCounts: Record<string, number> = {};
  const subCategoryCounts: Record<string, number> = {};

  data.products.forEach((p) => {
    const bKey = (p.brand || "").toLowerCase().trim();
    const scKey = (p.subCategory || "").toLowerCase().trim();
    if (bKey) brandCounts[bKey] = (brandCounts[bKey] || 0) + 1;
    if (scKey) subCategoryCounts[scKey] = (subCategoryCounts[scKey] || 0) + 1;
  });

  const brands = data.brands.map((b) => ({
    ...b,
    count: brandCounts[b.name.toLowerCase().trim()] || 0
  }));

  const subcategories = data.subcategories.map((sc) => ({
    ...sc,
    count: subCategoryCounts[sc.name.toLowerCase().trim()] || 0
  }));

  return {
    brands,
    subcategories,
    products: data.products
  };
}

// Brand Operations
export function addBrand(name: string, description?: string): CatalogBrand {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Brand name is required");
  const data = ensureCatalogFile();
  const exists = data.brands.some((b) => b.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) throw new Error(`Brand '${trimmed}' already exists`);

  const newBrand: CatalogBrand = { name: trimmed, description: description?.trim() || "" };
  data.brands.push(newBrand);
  writeCatalogFile(data);
  return newBrand;
}

export function renameBrand(oldName: string, newName: string, description?: string): CatalogBrand {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedNew) throw new Error("New brand name is required");

  const data = ensureCatalogFile();
  const brandIndex = data.brands.findIndex((b) => b.name.toLowerCase() === trimmedOld.toLowerCase());
  if (brandIndex === -1) throw new Error(`Brand '${trimmedOld}' not found`);

  // Check collision if name changed
  if (trimmedOld.toLowerCase() !== trimmedNew.toLowerCase()) {
    const nameExists = data.brands.some((b) => b.name.toLowerCase() === trimmedNew.toLowerCase());
    if (nameExists) throw new Error(`Brand '${trimmedNew}' already exists`);
  }

  data.brands[brandIndex] = {
    name: trimmedNew,
    description: description !== undefined ? description.trim() : data.brands[brandIndex].description
  };

  // Migrate all products using old brand name to new brand name
  let updatedProductsCount = 0;
  data.products = data.products.map((p) => {
    if (p.brand.toLowerCase() === trimmedOld.toLowerCase()) {
      updatedProductsCount++;
      return { ...p, brand: trimmedNew };
    }
    return p;
  });

  writeCatalogFile(data);
  console.log(`[Catalog] Renamed brand '${trimmedOld}' to '${trimmedNew}', updated ${updatedProductsCount} products.`);
  return data.brands[brandIndex];
}

export function deleteBrand(name: string): { success: boolean; deletedBrand: string; productsRemaining: number } {
  const trimmed = name.trim();
  const data = ensureCatalogFile();
  const brandIndex = data.brands.findIndex((b) => b.name.toLowerCase() === trimmed.toLowerCase());
  if (brandIndex === -1) throw new Error(`Brand '${trimmed}' not found`);

  data.brands.splice(brandIndex, 1);
  // Also remove products of this brand or keep them as 'Other'
  data.products = data.products.filter((p) => p.brand.toLowerCase() !== trimmed.toLowerCase());

  writeCatalogFile(data);
  return { success: true, deletedBrand: trimmed, productsRemaining: data.products.length };
}

// Subcategory Operations
export function addSubCategory(name: string): CatalogSubCategory {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Subcategory name is required");
  const data = ensureCatalogFile();
  const exists = data.subcategories.some((sc) => sc.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) throw new Error(`Subcategory '${trimmed}' already exists`);

  const newSubCat: CatalogSubCategory = { name: trimmed };
  data.subcategories.push(newSubCat);
  writeCatalogFile(data);
  return newSubCat;
}

export function renameSubCategory(oldName: string, newName: string): CatalogSubCategory {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedNew) throw new Error("New subcategory name is required");

  const data = ensureCatalogFile();
  const scIndex = data.subcategories.findIndex((sc) => sc.name.toLowerCase() === trimmedOld.toLowerCase());
  if (scIndex === -1) throw new Error(`Subcategory '${trimmedOld}' not found`);

  if (trimmedOld.toLowerCase() !== trimmedNew.toLowerCase()) {
    const nameExists = data.subcategories.some((sc) => sc.name.toLowerCase() === trimmedNew.toLowerCase());
    if (nameExists) throw new Error(`Subcategory '${trimmedNew}' already exists`);
  }

  data.subcategories[scIndex] = { name: trimmedNew };

  // Migrate all products using old subCategory
  data.products = data.products.map((p) => {
    if (p.subCategory.toLowerCase() === trimmedOld.toLowerCase()) {
      return { ...p, subCategory: trimmedNew };
    }
    return p;
  });

  writeCatalogFile(data);
  return data.subcategories[scIndex];
}

export function deleteSubCategory(name: string): { success: boolean; deletedSubCategory: string } {
  const trimmed = name.trim();
  const data = ensureCatalogFile();
  const scIndex = data.subcategories.findIndex((sc) => sc.name.toLowerCase() === trimmed.toLowerCase());
  if (scIndex === -1) throw new Error(`Subcategory '${trimmed}' not found`);

  data.subcategories.splice(scIndex, 1);
  writeCatalogFile(data);
  return { success: true, deletedSubCategory: trimmed };
}

// Product Operations
export async function addProduct(payload: Partial<CatalogProduct>): Promise<CatalogProduct> {
  if (!payload.name?.trim()) throw new Error("Product name is required");
  if (!payload.brand?.trim()) throw new Error("Brand is required");
  if (payload.price === undefined || payload.price === null || isNaN(Number(payload.price))) {
    throw new Error("Valid price is required");
  }

  const data = ensureCatalogFile();
  const id = payload.id?.trim() || `${payload.brand.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
  
  const newProduct: CatalogProduct = {
    id,
    name: payload.name.trim(),
    brand: payload.brand.trim(),
    subCategory: payload.subCategory?.trim() || "Accounts",
    category: payload.category?.trim() || "DIGITAL",
    price: Number(payload.price),
    originalPrice: payload.originalPrice ? Number(payload.originalPrice) : undefined,
    image: payload.image?.trim() || "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1000",
    description: payload.description?.trim() || "Verified premium product with instant delivery.",
    badge: payload.badge?.trim(),
    tag: payload.tag?.trim() || payload.brand.trim().toUpperCase(),
    stock: payload.stock !== undefined ? Number(payload.stock) : -1,
    warrantyInfo: payload.warrantyInfo?.trim() || "",
    featured: Boolean(payload.featured),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.products.unshift(newProduct);
  writeCatalogFile(data);

  // Sync with Prisma if configured
  if (isDatabaseConfigured()) {
    try {
      await prisma.product.upsert({
        where: { productId: newProduct.id },
        update: {
          name: newProduct.name,
          description: newProduct.description,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          image: newProduct.image,
        },
        create: {
          productId: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          image: newProduct.image,
        }
      });
    } catch (e) {
      console.warn("[Catalog] Prisma sync skipped for addProduct:", e);
    }
  }

  return newProduct;
}

export async function updateProduct(id: string, payload: Partial<CatalogProduct>): Promise<CatalogProduct> {
  const data = ensureCatalogFile();
  const pIndex = data.products.findIndex((p) => p.id === id);
  if (pIndex === -1) throw new Error(`Product with ID '${id}' not found`);

  const existing = data.products[pIndex];
  const updated: CatalogProduct = {
    ...existing,
    name: payload.name !== undefined ? payload.name.trim() : existing.name,
    brand: payload.brand !== undefined ? payload.brand.trim() : existing.brand,
    subCategory: payload.subCategory !== undefined ? payload.subCategory.trim() : existing.subCategory,
    category: payload.category !== undefined ? payload.category.trim() : existing.category,
    price: payload.price !== undefined ? Number(payload.price) : existing.price,
    originalPrice: payload.originalPrice !== undefined ? (payload.originalPrice ? Number(payload.originalPrice) : undefined) : existing.originalPrice,
    image: payload.image !== undefined ? payload.image.trim() : existing.image,
    description: payload.description !== undefined ? payload.description.trim() : existing.description,
    badge: payload.badge !== undefined ? payload.badge.trim() : existing.badge,
    tag: payload.tag !== undefined ? payload.tag.trim() : existing.tag,
    stock: payload.stock !== undefined ? Number(payload.stock) : existing.stock,
    warrantyInfo: payload.warrantyInfo !== undefined ? payload.warrantyInfo.trim() : existing.warrantyInfo,
    featured: payload.featured !== undefined ? Boolean(payload.featured) : existing.featured,
    updatedAt: new Date().toISOString(),
  };

  data.products[pIndex] = updated;
  writeCatalogFile(data);

  // Sync with Prisma if configured
  if (isDatabaseConfigured()) {
    try {
      await prisma.product.upsert({
        where: { productId: updated.id },
        update: {
          name: updated.name,
          description: updated.description,
          category: updated.category,
          price: updated.price,
          stock: updated.stock,
          image: updated.image,
        },
        create: {
          productId: updated.id,
          name: updated.name,
          description: updated.description,
          category: updated.category,
          price: updated.price,
          stock: updated.stock,
          image: updated.image,
        }
      });
    } catch (e) {
      console.warn("[Catalog] Prisma sync skipped for updateProduct:", e);
    }
  }

  return updated;
}

export async function deleteProduct(id: string): Promise<{ success: boolean; deletedId: string }> {
  const data = ensureCatalogFile();
  const pIndex = data.products.findIndex((p) => p.id === id);
  if (pIndex === -1) throw new Error(`Product with ID '${id}' not found`);

  data.products.splice(pIndex, 1);
  writeCatalogFile(data);

  // Sync with Prisma if configured
  if (isDatabaseConfigured()) {
    try {
      await prisma.product.deleteMany({
        where: { productId: id }
      });
    } catch (e) {
      console.warn("[Catalog] Prisma delete skipped:", e);
    }
  }

  return { success: true, deletedId: id };
}

export function resetCatalogToDefault(): CatalogData {
  writeCatalogFile(INITIAL_CATALOG);
  return getCatalogWithCounts();
}
