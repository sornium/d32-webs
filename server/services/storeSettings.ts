import fs from "fs";
import path from "path";

export interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number; // e.g., 10 for 10%
  active: boolean;
  minOrder?: number;
  description?: string;
  expiresAt?: string;
}

export interface StoreSettings {
  storeName: string;
  vatEnabled: boolean;
  vatRate: number; // e.g., 0.05 for 5%
  vatCountryLabel: string;
  handlingFeePercent: number; // e.g., 0.025 for 2.5%
  discounts: DiscountCode[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "store_settings.json");

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "d32.store",
  vatEnabled: true,
  vatRate: 0.05, // 5% VAT standard
  vatCountryLabel: "Standard Digital VAT (5%)",
  handlingFeePercent: 0.025, // 2.5%
  discounts: [
    {
      id: "disc_welcome10",
      code: "WELCOME10",
      discountPercent: 10,
      active: true,
      description: "10% off your first order",
    },
    {
      id: "disc_d32vip",
      code: "D32VIP",
      discountPercent: 15,
      active: true,
      minOrder: 50,
      description: "15% off orders over $50",
    },
    {
      id: "disc_prime20",
      code: "PRIME20",
      discountPercent: 20,
      active: true,
      description: "20% off Prime licenses",
    },
  ],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getStoreSettings(): StoreSettings {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn("[StoreSettings] Using default settings due to read error:", err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  ensureDataDir();
  const current = getStoreSettings();
  const updated: StoreSettings = {
    ...current,
    ...settings,
    discounts: settings.discounts || current.discounts,
  };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("[StoreSettings] Error saving settings:", err);
  }
  return updated;
}

export function validateDiscountCode(
  code: string,
  subtotal: number
): { valid: boolean; discountPercent: number; discountAmount: number; message: string; discount?: DiscountCode } {
  if (!code || typeof code !== "string") {
    return { valid: false, discountPercent: 0, discountAmount: 0, message: "Invalid discount code" };
  }

  const clean = code.trim().toUpperCase();
  const settings = getStoreSettings();
  const found = settings.discounts.find((d) => d.code.toUpperCase() === clean && d.active);

  if (!found) {
    return { valid: false, discountPercent: 0, discountAmount: 0, message: "Coupon code not found or expired" };
  }

  if (found.minOrder && subtotal < found.minOrder) {
    return {
      valid: false,
      discountPercent: 0,
      discountAmount: 0,
      message: `Minimum order amount of $${found.minOrder.toFixed(2)} required for this coupon.`,
    };
  }

  const discountAmount = Math.round((subtotal * (found.discountPercent / 100)) * 100) / 100;

  return {
    valid: true,
    discountPercent: found.discountPercent,
    discountAmount,
    message: `${found.discountPercent}% discount applied successfully!`,
    discount: found,
  };
}
