import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  Search,
  Package,
  Layers,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Sparkles,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "../store";

export interface AdminProduct {
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
  stock: number;
  warrantyInfo?: string;
  featured?: boolean;
}

export interface AdminBrand {
  name: string;
  description?: string;
  count?: number;
}

export interface AdminSubCategory {
  name: string;
  count?: number;
}

export default function AdminCatalogManager() {
  const { user } = useStore();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const [selectedSubCatFilter, setSelectedSubCatFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawers
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<AdminProduct>>({
    name: "",
    brand: "KYC",
    subCategory: "Accounts",
    category: "DIGITAL",
    price: 49,
    originalPrice: 79,
    stock: 20,
    warrantyInfo: "30-Day Instant Replacement Guarantee",
    description: "",
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1000",
    badge: "Verified",
    tag: "",
    featured: false,
  });

  // Brand Modals
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrand | null>(null);
  const [brandFormData, setBrandFormData] = useState({ name: "", description: "" });

  // Subcategory Modals
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
  const [editingSubCat, setEditingSubCat] = useState<AdminSubCategory | null>(null);
  const [subCatFormData, setSubCatFormData] = useState({ name: "" });

  // Load catalog
  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/catalog");
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
        setSubcategories(data.subcategories || []);
        setProducts(data.products || []);
      } else {
        toast.error("Failed to load catalog data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading catalog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesBrand = !selectedBrandFilter || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();
      const matchesSubCat = !selectedSubCatFilter || p.subCategory.toLowerCase() === selectedSubCatFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      return matchesBrand && matchesSubCat && matchesSearch;
    });
  }, [products, selectedBrandFilter, selectedSubCatFilter, searchQuery]);

  // Headers for API
  const getHeaders = () => {
    const currentToken = useStore.getState().token;
    return {
      "Content-Type": "application/json",
      "X-User-Id": user?.id || "",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  // -------------------------------------------------------------
  // BRAND ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandFormData({ name: "", description: "" });
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: AdminBrand) => {
    setEditingBrand(brand);
    setBrandFormData({ name: brand.name, description: brand.description || "" });
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandFormData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    try {
      if (editingBrand) {
        const res = await fetch(`/api/admin/brands/${encodeURIComponent(editingBrand.name)}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(brandFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to rename brand");
        toast.success(`Brand '${editingBrand.name}' renamed to '${brandFormData.name}'`);
      } else {
        const res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(brandFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to add brand");
        toast.success(`Brand '${brandFormData.name}' added successfully`);
      }
      setIsBrandModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDeleteBrand = async (brandName: string) => {
    const brandProducts = products.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase());
    const confirmMsg = brandProducts.length > 0
      ? `Are you sure you want to remove brand '${brandName}'? This will also delete ${brandProducts.length} product(s) belonging to it.`
      : `Are you sure you want to remove brand '${brandName}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/brands/${encodeURIComponent(brandName)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete brand");
      toast.success(`Brand '${brandName}' deleted`);
      if (selectedBrandFilter?.toLowerCase() === brandName.toLowerCase()) {
        setSelectedBrandFilter(null);
      }
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete brand");
    }
  };

  // -------------------------------------------------------------
  // SUBCATEGORY ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddSubCat = () => {
    setEditingSubCat(null);
    setSubCatFormData({ name: "" });
    setIsSubCatModalOpen(true);
  };

  const handleOpenEditSubCat = (sc: AdminSubCategory) => {
    setEditingSubCat(sc);
    setSubCatFormData({ name: sc.name });
    setIsSubCatModalOpen(true);
  };

  const handleSaveSubCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatFormData.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    try {
      if (editingSubCat) {
        const res = await fetch(`/api/admin/subcategories/${encodeURIComponent(editingSubCat.name)}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(subCatFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to rename subcategory");
        toast.success(`Subcategory '${editingSubCat.name}' renamed to '${subCatFormData.name}'`);
      } else {
        const res = await fetch("/api/admin/subcategories", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(subCatFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to add subcategory");
        toast.success(`Subcategory '${subCatFormData.name}' added`);
      }
      setIsSubCatModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDeleteSubCat = async (scName: string) => {
    if (!window.confirm(`Delete subcategory '${scName}'?`)) return;

    try {
      const res = await fetch(`/api/admin/subcategories/${encodeURIComponent(scName)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete subcategory");
      toast.success(`Subcategory '${scName}' deleted`);
      if (selectedSubCatFilter?.toLowerCase() === scName.toLowerCase()) {
        setSelectedSubCatFilter(null);
      }
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subcategory");
    }
  };

  // -------------------------------------------------------------
  // PRODUCT ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddProduct = (defaultBrand?: string) => {
    setEditingProduct(null);
    setProductFormData({
      name: "",
      brand: defaultBrand || selectedBrandFilter || (brands[0]?.name || "KYC"),
      subCategory: subcategories[0]?.name || "Accounts",
      category: "DIGITAL",
      price: 29.99,
      originalPrice: 49.99,
      stock: 25,
      warrantyInfo: "30-Day Instant Replacement Guarantee",
      description: "Verified digital product with instant automated delivery.",
      image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1000",
      badge: "Instant Delivery",
      tag: "",
      featured: false,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setProductFormData({
      ...product,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productFormData.brand?.trim()) {
      toast.error("Brand is required");
      return;
    }
    if (productFormData.price === undefined || isNaN(Number(productFormData.price))) {
      toast.error("Valid price is required");
      return;
    }

    try {
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${encodeURIComponent(editingProduct.id)}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(productFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update product");
        toast.success(`Product '${productFormData.name}' updated successfully`);
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(productFormData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create product");
        toast.success(`Product '${productFormData.name}' created successfully`);
      }
      setIsProductModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to remove '${productName}'?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete product");
      toast.success(`Product removed`);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Quick Stock Adjuster
  const handleQuickStockAdjust = async (product: AdminProduct, delta: number) => {
    const current = product.stock ?? 10;
    const nextStock = current === -1 ? 10 : Math.max(0, current + delta);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ stock: nextStock }),
      });
      if (res.ok) {
        toast.success(`Stock updated to ${nextStock}`);
        fetchCatalog();
      }
    } catch (err) {
      toast.error("Failed to adjust stock");
    }
  };

  // Reset catalog to initial KYC, Discord, TikTok
  const handleResetCatalog = async () => {
    if (!window.confirm("Reset catalog back to initial KYC, Discord, and TikTok products? Custom products and brands will be replaced.")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/catalog/reset", {
        method: "POST",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Catalog reset to KYC, Discord & TikTok");
        fetchCatalog();
      }
    } catch (err) {
      toast.error("Failed to reset catalog");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER & GLOBAL ACTIONS                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.05] border border-white/10 backdrop-blur-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Brands & Product Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wide">
              admin.d32.store
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Manage brands, subcategories, product listings, pricing, warranty guarantees, and live stock levels dynamically without modifying source code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddBrand}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Brand</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddSubCat}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Subcategory</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddProduct()}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Create Product</span>
          </button>

          <button
            type="button"
            onClick={handleResetCatalog}
            title="Reset catalog to default KYC, Discord, and TikTok"
            className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BRANDS MANAGEMENT SECTION                                              */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Brands ({brands.length})
            </h3>
            <span className="text-xs text-zinc-500">
              Only KYC, Discord, and TikTok by default. Click to filter products.
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenAddBrand}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Brand</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {brands.map((b) => {
            const isFilterActive = selectedBrandFilter?.toLowerCase() === b.name.toLowerCase();
            return (
              <div
                key={b.name}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isFilterActive
                    ? "bg-white/[0.14] border-white/40 shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
                    : "bg-white/[0.06] hover:bg-white/[0.09] border-white/10"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedBrandFilter(isFilterActive ? null : b.name)}
                      className="text-left font-bold text-white text-base hover:text-emerald-300 transition-colors flex items-center gap-2"
                    >
                      <span>{b.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-zinc-300">
                        {b.count ?? 0} {b.count === 1 ? "product" : "products"}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBrand(b)}
                        title="Rename / Edit Brand"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrand(b.name)}
                        title="Delete Brand"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {b.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedBrandFilter(isFilterActive ? null : b.name)}
                    className={`font-semibold transition-colors ${
                      isFilterActive ? "text-emerald-400" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {isFilterActive ? "✓ Active Filter" : "Filter Products"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddProduct(b.name)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to {b.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBCATEGORIES MANAGEMENT BAR                                           */}
      {/* ========================================================================= */}
      <div className="p-4.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Subcategories ({subcategories.length})
            </h3>
            <span className="text-[11px] text-zinc-500">
              Manage product types and filters
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSubCat}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subcategory</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subcategories.map((sc) => {
            const isFilterActive = selectedSubCatFilter?.toLowerCase() === sc.name.toLowerCase();
            return (
              <div
                key={sc.name}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                  isFilterActive
                    ? "bg-white/20 border-white/35 text-white font-semibold shadow-inner"
                    : "bg-white/[0.05] hover:bg-white/[0.09] border-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSubCatFilter(isFilterActive ? null : sc.name)}
                  className="font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <span>{sc.name}</span>
                  <span className="text-[10px] opacity-60 font-mono">({sc.count ?? 0})</span>
                </button>

                <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSubCat(sc)}
                    className="hover:text-white p-0.5"
                    title="Rename Subcategory"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubCat(sc.name)}
                    className="hover:text-rose-400 p-0.5"
                    title="Delete Subcategory"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PRODUCTS MANAGEMENT TABLE & CONTROLS                                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Product Inventory & Warranty Management
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
              {filteredProducts.length} of {products.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-9 bg-white/[0.06] border border-white/10 focus:border-white/30 rounded-xl pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>

            {/* Clear filters if active */}
            {(selectedBrandFilter || selectedSubCatFilter || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrandFilter(null);
                  setSelectedSubCatFilter(null);
                  setSearchQuery("");
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddProduct()}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Product</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid / Table */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white/[0.04] border border-white/10 p-6 space-y-3">
            <Package className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No products found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No products match your current brand, subcategory, or search query.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddProduct()}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold transition-all active:scale-95"
            >
              + Create Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const hasStock = p.stock === -1 || p.stock > 0;
              return (
                <div
                  key={p.id}
                  className="rounded-3xl bg-white/[0.06] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header Image & Tags */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/15 bg-black/40 shrink-0 shadow-inner"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                            {p.brand}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-zinc-300 font-medium">
                            {p.subCategory}
                          </span>
                          {p.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                          {p.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Warranty Tag */}
                    {p.warrantyInfo ? (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{p.warrantyInfo}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/5 text-zinc-500 text-xs">
                        <Shield className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span>No warranty information specified</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing, Stock & Quick Management */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      {/* Price */}
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-white">
                            ${Number(p.price).toFixed(2)}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-xs text-zinc-500 line-through">
                              ${Number(p.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Level with Quick Tweak */}
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Stock Level</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              p.stock === -1
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : p.stock === 0
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-white/15 text-white border border-white/25"
                            }`}
                          >
                            {p.stock === -1 ? "Instant (∞)" : `${p.stock} left`}
                          </span>

                          {/* Quick Adjust buttons */}
                          {p.stock !== -1 && (
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickStockAdjust(p, -1)}
                                disabled={p.stock <= 0}
                                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStockAdjust(p, 5)}
                                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/store/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View in store</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT PRODUCT MODAL                                            */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0d0d12] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-white">
                  {editingProduct ? "Edit Product" : "Create New Product"}
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure product details, brand, warranty terms, and stock levels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productFormData.name || ""}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="e.g. KYC Verified Merchant Account [EU/UK]"
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              {/* Brand & Subcategory Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Brand *
                  </label>
                  <select
                    value={productFormData.brand || "KYC"}
                    onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    className="w-full bg-[#121218] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Subcategory *
                  </label>
                  <select
                    value={productFormData.subCategory || "Accounts"}
                    onChange={(e) => setProductFormData({ ...productFormData, subCategory: e.target.value })}
                    className="w-full bg-[#121218] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {subcategories.map((sc) => (
                      <option key={sc.name} value={sc.name}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productFormData.price ?? 49}
                    onChange={(e) => setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="49.99"
                    className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Original Price (Optional for Strikethrough)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.originalPrice || ""}
                    onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="89.99"
                    className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Stock Available & Instant Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Stock Available (Units) *
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={productFormData.stock ?? 20}
                    disabled={productFormData.stock === -1}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Enter stock count or check instant"
                    className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 disabled:opacity-40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={productFormData.stock === -1}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.checked ? -1 : 20 })}
                    className="w-4 h-4 rounded text-black bg-white"
                  />
                  <span className="text-xs text-white font-semibold">
                    Unlimited / Instant Automated Delivery (-1)
                  </span>
                </label>
              </div>

              {/* Warranty Information */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Warranty Information (Displayed to customers)</span>
                </label>
                <input
                  type="text"
                  value={productFormData.warrantyInfo || ""}
                  onChange={(e) => setProductFormData({ ...productFormData, warrantyInfo: e.target.value })}
                  placeholder="e.g. 30-Day Instant Replacement Guarantee"
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-500">Presets:</span>
                  {[
                    "30-Day Replacement Guarantee",
                    "60-Day Full Warranty",
                    "90-Day Non-Revoke Warranty",
                    "Lifetime Access Guarantee",
                    "24-Hour Token Replacement",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, warrantyInfo: preset })}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-zinc-300 hover:text-white"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={productFormData.description || ""}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Full description of features, deliverables, and instructions."
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              {/* Image URL & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={productFormData.image || ""}
                    onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Badge / Tag (e.g. Hot Deal, Tier 2)
                  </label>
                  <input
                    type="text"
                    value={productFormData.badge || ""}
                    onChange={(e) => setProductFormData({ ...productFormData, badge: e.target.value })}
                    placeholder="e.g. Tier 2 Verified, Hot Deal"
                    className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95"
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CREATE / EDIT BRAND MODAL                                              */}
      {/* ========================================================================= */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d0d12] border border-white/20 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white">
                {editingBrand ? `Rename Brand: ${editingBrand.name}` : "Add New Brand"}
              </h3>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                  placeholder="e.g. KYC, Discord, TikTok, Telegram"
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                {editingBrand && (
                  <p className="text-[11px] text-amber-400">
                    Note: Renaming this brand will automatically update all existing products under '{editingBrand.name}'.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={brandFormData.description}
                  onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                  placeholder="Brief summary of services for this brand..."
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold"
                >
                  {editingBrand ? "Save Brand" : "Add Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CREATE / EDIT SUBCATEGORY MODAL                                        */}
      {/* ========================================================================= */}
      {isSubCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d0d12] border border-white/20 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white">
                {editingSubCat ? `Rename Subcategory: ${editingSubCat.name}` : "Add Subcategory"}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubCatModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubCat} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  value={subCatFormData.name}
                  onChange={(e) => setSubCatFormData({ name: e.target.value })}
                  placeholder="e.g. Accounts, Boosts, Documents, Licenses"
                  className="w-full bg-white/[0.06] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSubCatModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold"
                >
                  {editingSubCat ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
