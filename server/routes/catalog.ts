import { Router } from "express";
import { prisma, isDatabaseConfigured } from "../db.js";
import {
  getCatalogWithCounts,
  addBrand,
  renameBrand,
  deleteBrand,
  addSubCategory,
  renameSubCategory,
  deleteSubCategory,
  addProduct,
  updateProduct,
  deleteProduct,
  resetCatalogToDefault,
} from "../catalog.js";
import { enrichReviewWithDiscord, saveVouchOrReview } from "../discord-helper.js";
import { handleDbError, requireAdmin, requireDatabase, requireOwnerOrAdmin, getVerifiedCaller } from "../middleware.js";

const router = Router();

// GET /api/catalog
router.get("/catalog", (req, res) => {
  try {
    const catalog = getCatalogWithCounts();
    return res.json(catalog);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to load catalog" });
  }
});

// GET /api/products
router.get("/products", (req, res) => {
  try {
    const catalog = getCatalogWithCounts();
    return res.json(catalog.products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req, res) => {
  if (req.params.id === "custom") {
    return res.json({
      id: "custom",
      name: "Custom Invoice",
      description: "Direct payment invoice sent by the administrator.",
      price: req.query.price ? parseFloat(req.query.price as string) : 0,
      image:
        "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1600",
      category: "INVOICE",
      stock: 1,
    });
  }

  try {
    const catalog = getCatalogWithCounts();
    const found = catalog.products.find((p) => p.id === req.params.id);
    if (found) {
      return res.json(found);
    }

    if (isDatabaseConfigured()) {
      const product = await prisma.product.findFirst({
        where: { OR: [{ productId: req.params.id }, { id: req.params.id }] },
      });
      if (product) {
        return res.json({
          id: product.productId || product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          stock: product.stock,
        });
      }
    }
    return res.status(404).json({ error: "Product not found" });
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch product details");
  }
});

// ADMIN BRAND MANAGEMENT
router.post("/admin/brands", requireAdmin, (req, res) => {
  try {
    const { name, description } = req.body;
    const brand = addBrand(name, description);
    return res.json({ success: true, brand });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to add brand" });
  }
});

router.put("/admin/brands/:name", requireAdmin, (req, res) => {
  try {
    const { name, description } = req.body;
    const brand = renameBrand(req.params.name, name, description);
    return res.json({ success: true, brand });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update brand" });
  }
});

router.delete("/admin/brands/:name", requireAdmin, (req, res) => {
  try {
    const result = deleteBrand(req.params.name);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete brand" });
  }
});

// ADMIN SUBCATEGORY MANAGEMENT
router.post("/admin/subcategories", requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    const subcategory = addSubCategory(name);
    return res.json({ success: true, subcategory });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to add subcategory" });
  }
});

router.put("/admin/subcategories/:name", requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    const subcategory = renameSubCategory(req.params.name, name);
    return res.json({ success: true, subcategory });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update subcategory" });
  }
});

router.delete("/admin/subcategories/:name", requireAdmin, (req, res) => {
  try {
    const result = deleteSubCategory(req.params.name);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete subcategory" });
  }
});

// ADMIN PRODUCT MANAGEMENT
router.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const product = await addProduct(req.body);
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create product" });
  }
});

router.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update product" });
  }
});

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete product" });
  }
});

router.post("/admin/catalog/reset", requireAdmin, (req, res) => {
  try {
    const catalog = resetCatalogToDefault();
    return res.json({ success: true, catalog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to reset catalog" });
  }
});

// PROXY LISTINGS
router.get("/proxies", async (req, res) => {
  try {
    const proxies = await prisma.proxyListing.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(proxies);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch proxies");
  }
});

router.post("/proxies/submit", requireDatabase, async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required to submit proxy listing." });
  }

  try {
    const newProxy = await prisma.proxyListing.create({
      data: {
        platform: req.body.platform,
        username: req.body.username,
        followers: req.body.followers,
        bin: req.body.bin,
        co: req.body.co,
        condition: req.body.condition,
        ogEmail: req.body.ogEmail,
        status: "Pending",
        sellerId: caller.userId,
        hasBadges: req.body.hasBadges || false,
        badges: req.body.badges || [],
        verified: req.body.verified || false,
      },
    });
    return res.json(newProxy);
  } catch (err) {
    return handleDbError(res, err, "Failed to submit proxy listing");
  }
});

router.patch("/proxies/:id/status", requireDatabase, async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const existing = await prisma.proxyListing.findFirst({
      where: { OR: [{ proxyId: req.params.id }, { id: req.params.id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: "Proxy listing not found" });
    }

    const isAdmin = caller.role === "admin";
    const isOwner = existing.sellerId === caller.userId || existing.sellerId === caller.username;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Access denied: Unauthorized." });
    }

    // Non-admins can only cancel/delist their own listing
    if (!isAdmin && req.body.status !== "Cancelled" && req.body.status !== "Delisted") {
      return res.status(403).json({ error: "Only administrators can approve or alter listing status." });
    }

    const proxy = await prisma.proxyListing.update({
      where: { id: existing.id },
      data: { status: req.body.status },
    });
    return res.json(proxy);
  } catch (err) {
    return handleDbError(res, err, "Failed to update proxy listing status");
  }
});

// REVIEWS
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { approvalStatus: "Approved" },
      orderBy: { createdAt: "desc" },
    });
    const enriched = await Promise.all(reviews.map((r) => enrichReviewWithDiscord(r)));
    return res.json(enriched);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch reviews");
  }
});

router.get("/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId: req.params.id,
        approvalStatus: "Approved",
      },
      orderBy: { createdAt: "desc" },
    });
    const enriched = await Promise.all(reviews.map((r) => enrichReviewWithDiscord(r)));
    return res.json(enriched);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch product reviews");
  }
});

router.get("/products/:id/review-eligibility", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.json({ eligible: false });

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ userId: userId }, { id: userId }] },
    });

    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId: req.params.id,
      },
    });
    if (existingReview) {
      return res.json({
        eligible: false,
        hasReviewed: true,
        discordLinked: !!user?.discordId,
      });
    }

    const websiteOrders = await prisma.order.findMany({
      where: {
        userId,
        productId: req.params.id,
        status: "Completed",
      },
    });
    if (websiteOrders.length > 0) {
      return res.json({
        eligible: true,
        type: "website",
        discordLinked: !!user?.discordId,
      });
    }

    return res.json({ eligible: false, discordLinked: !!user?.discordId });
  } catch (err) {
    return handleDbError(res, err, "Failed to check review eligibility");
  }
});

router.post("/bot/reviews", async (req, res) => {
  const {
    discordId,
    username,
    displayName,
    globalName,
    avatarUrl,
    rating,
    reviewText,
    productId,
    productName,
    images,
  } = req.body;

  if (!reviewText || !rating) {
    return res.status(400).json({ error: "rating and reviewText are required" });
  }

  try {
    const newReview = await saveVouchOrReview({
      discordId,
      username,
      displayName,
      globalName,
      avatarUrl,
      rating: parseInt(rating, 10),
      reviewText,
      productId,
      productName: productName || "Prime License",
      images: images || [],
      isVerifiedPurchase: true,
      isDiscordVerified: true,
      source: "DiscordBot",
      approvalStatus: "Approved",
    });
    return res.status(201).json(newReview);
  } catch (err) {
    return handleDbError(res, err, "Failed to create Discord bot review");
  }
});

router.post("/products/:id/reviews", requireOwnerOrAdmin, async (req, res) => {
  const { userId, username, rating, reviewText, images } = req.body;

  try {
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId: req.params.id,
      },
    });
    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this product." });
    }

    const websiteOrders = await prisma.order.findMany({
      where: {
        userId,
        productId: req.params.id,
        status: "Completed",
      },
    });

    let isVerifiedPurchase = websiteOrders.length > 0;
    let isDiscordVerified = false;
    let discordId: string | undefined;

    const user = await prisma.user.findFirst({ where: { OR: [{ userId }, { id: userId }] } });
    if (user?.discordId) {
      isVerifiedPurchase = true;
      isDiscordVerified = true;
      discordId = user.discordId;
    }

    if (!isVerifiedPurchase) {
      return res.status(400).json({ error: "Must purchase product to review." });
    }

    const newReview = await saveVouchOrReview({
      userId,
      discordId,
      username: username || user?.username,
      displayName: user?.username,
      rating: parseInt(rating, 10),
      reviewText,
      productId: req.params.id,
      images: images || [],
      isVerifiedPurchase,
      isDiscordVerified,
      source: "Web",
      approvalStatus: "Pending",
    });
    return res.json(newReview);
  } catch (err) {
    return handleDbError(res, err, "Failed to submit review");
  }
});

router.post("/reviews/:id/report", async (req, res) => {
  try {
    const existing = await prisma.review.findFirst({
      where: { OR: [{ reviewId: req.params.id }, { id: req.params.id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = await prisma.review.update({
      where: { id: existing.id },
      data: { reported: true, reportReason: req.body.reason },
    });
    return res.json(review);
  } catch (err) {
    return handleDbError(res, err, "Failed to report review");
  }
});

export default router;
