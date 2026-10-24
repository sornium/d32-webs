import { Router } from "express";
import {
  getStoreSettings,
  saveStoreSettings,
  validateDiscountCode,
} from "../services/storeSettings.js";
import { requireAdmin } from "../middleware.js";

const router = Router();

// GET /api/store/settings (Public store configuration - discount codes redacted for security)
router.get("/store/settings", (req, res) => {
  const settings = getStoreSettings();
  return res.json({
    storeName: settings.storeName,
    vatEnabled: settings.vatEnabled,
    vatRate: settings.vatRate,
    vatCountryLabel: settings.vatCountryLabel,
    handlingFeePercent: settings.handlingFeePercent,
  });
});

// GET /api/admin/store/settings (Admin-only full settings with discount codes)
router.get("/admin/store/settings", requireAdmin, (req, res) => {
  const settings = getStoreSettings();
  return res.json(settings);
});

// PUT /api/admin/store/settings
router.put("/admin/store/settings", requireAdmin, (req, res) => {
  const updated = saveStoreSettings(req.body);
  return res.json(updated);
});

// POST /api/discounts/validate
router.post("/discounts/validate", (req, res) => {
  const { code, subtotal } = req.body;
  const result = validateDiscountCode(code, Number(subtotal) || 0);
  return res.json(result);
});

export default router;
