import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../lib/i18n";
import { useCurrency } from "../lib/currency";
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  SlidersHorizontal,
  ArrowUpRight, 
  ShoppingBag,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Shield
} from "lucide-react";
import { INITIAL_STORE_PRODUCTS, BRANDS_LIST, SUB_CATEGORIES_LIST, StoreProduct } from "../data/storeProducts";

export default function Store() {
  const [catalogBrands, setCatalogBrands] = useState<{ name: string; description?: string; count?: number | string }[]>(BRANDS_LIST);
  const [catalogSubCats, setCatalogSubCats] = useState<{ name: string; count?: number | string }[]>(SUB_CATEGORIES_LIST);
  const [catalogProducts, setCatalogProducts] = useState<StoreProduct[]>(INITIAL_STORE_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter states matching design
  const [searchQuery, setSearchQuery] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [subCatSearch, setSubCatSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("Recommended");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accordion open/closed states
  const [isBrandsAccordionOpen, setIsBrandsAccordionOpen] = useState(true);
  const [isSubCatsAccordionOpen, setIsSubCatsAccordionOpen] = useState(true);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const { currency, formatPrice } = useCurrency();
  const { t } = useTranslation();

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dynamic catalog (brands, subcategories, products)
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setCatalogProducts(data.products);
        }
        if (data.brands && Array.isArray(data.brands) && data.brands.length > 0) {
          setCatalogBrands(data.brands);
        }
        if (data.subcategories && Array.isArray(data.subcategories) && data.subcategories.length > 0) {
          setCatalogSubCats(data.subcategories);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading catalog:", err);
        setIsLoading(false);
      });
  }, []);

  // Dynamic brand list with real-time product counts
  const dynamicBrands = useMemo(() => {
    return catalogBrands.map((b) => {
      const count = catalogProducts.filter(
        (p) => p.brand.toLowerCase() === b.name.toLowerCase()
      ).length;
      return { name: b.name, count };
    });
  }, [catalogBrands, catalogProducts]);

  // Dynamic subcategory list with real-time product counts
  const dynamicSubCats = useMemo(() => {
    return catalogSubCats.map((sc) => {
      const count = catalogProducts.filter(
        (p) => p.subCategory.toLowerCase() === sc.name.toLowerCase()
      ).length;
      return { name: sc.name, count };
    });
  }, [catalogSubCats, catalogProducts]);

  // Filtered brands list based on inner search
  const filteredBrandsList = useMemo(() => {
    if (!brandSearch.trim()) return dynamicBrands;
    return dynamicBrands.filter((b) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
    );
  }, [brandSearch, dynamicBrands]);

  // Filtered sub-categories list based on inner search
  const filteredSubCatsList = useMemo(() => {
    if (!subCatSearch.trim()) return dynamicSubCats;
    return dynamicSubCats.filter((sc) =>
      sc.name.toLowerCase().includes(subCatSearch.toLowerCase().trim())
    );
  }, [subCatSearch, dynamicSubCats]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = catalogProducts.filter((product) => {
      // 1. Brand Filter
      const matchesBrand = !selectedBrand || product.brand.toLowerCase() === selectedBrand.toLowerCase();

      // 2. Sub-Category Filter
      const matchesSubCat = !selectedSubCategory || product.subCategory.toLowerCase() === selectedSubCategory.toLowerCase();

      // 3. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.subCategory.toLowerCase().includes(query);

      return matchesBrand && matchesSubCat && matchesSearch;
    });

    // Sort logic
    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "Newest") {
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    } else if (sortBy === "Most Popular") {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [catalogProducts, selectedBrand, selectedSubCategory, searchQuery, sortBy]);

  const handleClearAll = () => {
    setSelectedBrand(null);
    setSelectedSubCategory(null);
    setSearchQuery("");
    setBrandSearch("");
    setSubCatSearch("");
  };

  const activeFiltersCount = (selectedBrand ? 1 : 0) + (selectedSubCategory ? 1 : 0) + (searchQuery ? 1 : 0);

  const sortOptions = [
    "Recommended",
    "Price: Low to High",
    "Price: High to Low",
    "Newest",
    "Most Popular"
  ];

  // Quick Brand Pill tabs dynamically driven from brands (Topbar aesthetic)
  const quickBrandTabs = useMemo(() => {
    const tabs: { label: string; value: string | null }[] = [
      { label: t("All Brands", "All Brands"), value: null }
    ];
    dynamicBrands.forEach((b) => {
      tabs.push({ label: b.name, value: b.name });
    });
    return tabs;
  }, [dynamicBrands, t]);

  return (
    <div className="min-h-screen pb-24 pt-1 text-slate-100 space-y-6">
      {/* ========================================================================= */}
      {/* TOPBAR-INSPIRED FLOATING BRAND PILL STRIP                                 */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar p-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-1.5 min-w-max px-1">
          {quickBrandTabs.map((tab) => {
            const isActive = selectedBrand === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSelectedBrand(tab.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white/20 text-white border border-white/30 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] scale-100"
                    : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                {tab.value === null && <Layers className="w-3.5 h-3.5 text-white/60" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeFiltersCount > 0 && (
          <div className="pr-1 hidden sm:block shrink-0">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold border border-white/20 transition-all active:scale-95 cursor-pointer shadow-inner"
            >
              <RotateCcw className="w-3 h-3 text-white/60" />
              <span>{t("Reset", "Reset")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle & Sticky Bar */}
      <div className="lg:hidden flex items-center justify-between gap-3">
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.08] border border-white/15 text-white text-sm font-semibold hover:border-white/30 transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-xl"
        >
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span>{t("Filters", "Filters")}</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white text-xs font-semibold border border-white/15 hover:border-white/30 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer backdrop-blur-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white/60" />
            <span>{t("Clear all", "Clear all")}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-8">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Filter Sidebar (Frosted Acrylic Topbar Style)                 */}
        {/* ========================================================================= */}
        <aside
          className={`${
            isMobileFilterOpen ? "block" : "hidden"
          } lg:block w-full lg:w-[268px] flex-shrink-0 sticky top-24 z-20 space-y-4`}
        >
          {/* Filter Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-white tracking-tight font-sans">{t("Filter", "Filter")}</h2>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 hover:border-white/30 text-white/80 hover:text-white text-xs font-medium transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] active:scale-95 cursor-pointer backdrop-blur-xl"
              >
                <RotateCcw className="w-3 h-3 text-white/60 group-hover:text-white transition-transform group-hover:-rotate-90 duration-300" />
                <span>{t("Clear all", "Clear all")}</span>
              </button>
            )}
          </div>

          {/* BRANDS SECTION WITH FROSTED ACRYLIC CARD BACKGROUND */}
          <div className="bg-white/[0.08] border border-white/15 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] space-y-3 backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setIsBrandsAccordionOpen(!isBrandsAccordionOpen)}
              className="w-full flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white group-hover:text-white/90 transition-colors">
                  {t("Brands", "Brands")}
                </span>
                {selectedBrand && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                )}
              </div>
              <div className="text-white/50 group-hover:text-white transition-colors">
                {isBrandsAccordionOpen ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isBrandsAccordionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2.5 pt-1"
                >
                  {/* Inner Type to Filter Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder={t("Type to filter...", "Type to filter...")}
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] transition-colors"
                    />
                    {brandSearch && (
                      <button
                        onClick={() => setBrandSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Brands List with Counts and Radio-style selection */}
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredBrandsList.map((brand) => {
                      const isSelected = selectedBrand === brand.name;
                      return (
                        <button
                          key={brand.name}
                          type="button"
                          onClick={() => {
                            setSelectedBrand(isSelected ? null : brand.name);
                          }}
                          className={`w-full flex items-center justify-between py-2 px-3 rounded-2xl transition-all group text-left cursor-pointer ${
                            isSelected 
                              ? "bg-white/20 border border-white/30 text-white font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]" 
                              : "hover:bg-white/10 text-white/70 hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Custom Circular Radio Indicator */}
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-2 border-white bg-white text-black"
                                  : "border border-white/30 group-hover:border-white/50 bg-white/5"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                              )}
                            </div>

                            {/* Brand Name */}
                            <span
                              className={`text-xs transition-colors ${
                                isSelected
                                  ? "text-white font-semibold"
                                  : "text-white/80 group-hover:text-white font-medium"
                              }`}
                            >
                              {brand.name}
                            </span>
                          </div>

                          {/* Brand Count Pill */}
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                              isSelected
                                ? "bg-white/25 text-white font-semibold"
                                : "bg-white/[0.05] text-white/50 group-hover:text-white/80"
                            }`}
                          >
                            {brand.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SUB-CATEGORIES SECTION WITH FROSTED ACRYLIC CARD BACKGROUND */}
          <div className="bg-white/[0.08] border border-white/15 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] space-y-3 backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setIsSubCatsAccordionOpen(!isSubCatsAccordionOpen)}
              className="w-full flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white group-hover:text-white/90 transition-colors">
                  {t("Sub-Categories", "Sub-Categories")}
                </span>
                {selectedSubCategory && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                )}
              </div>
              <div className="text-white/50 group-hover:text-white transition-colors">
                {isSubCatsAccordionOpen ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isSubCatsAccordionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2.5 pt-1"
                >
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredSubCatsList.map((sc) => {
                      const isSelected = selectedSubCategory === sc.name;
                      return (
                        <button
                          key={sc.name}
                          type="button"
                          onClick={() => {
                            setSelectedSubCategory(isSelected ? null : sc.name);
                          }}
                          className={`w-full flex items-center justify-between py-2 px-3 rounded-2xl transition-all group text-left cursor-pointer ${
                            isSelected 
                              ? "bg-white/20 border border-white/30 text-white font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]" 
                              : "hover:bg-white/10 text-white/70 hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-2 border-white bg-white text-black"
                                  : "border border-white/30 group-hover:border-white/50 bg-white/5"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                              )}
                            </div>
                            <span
                              className={`text-xs transition-colors ${
                                isSelected
                                  ? "text-white font-semibold"
                                  : "text-white/80 group-hover:text-white font-medium"
                              }`}
                            >
                              {sc.name}
                            </span>
                          </div>

                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                              isSelected
                                ? "bg-white/25 text-white font-semibold"
                                : "bg-white/[0.05] text-white/50 group-hover:text-white/80"
                            }`}
                          >
                            {sc.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Search Bar, Active Chips, Product Grid (Topbar Aesthetic)    */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Top Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Type to filter input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search store products...", "Search store products...")}
                className="w-full h-12 bg-white/[0.08] border border-white/15 hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/[0.12] rounded-full pl-11 pr-10 text-sm text-white placeholder:text-white/40 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-xl focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort by Recommended Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="h-12 px-5 rounded-full bg-white/[0.08] border border-white/15 hover:border-white/30 hover:bg-white/[0.12] text-xs sm:text-sm text-white/90 hover:text-white flex items-center justify-between gap-2.5 whitespace-nowrap transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] active:scale-[0.98] backdrop-blur-xl"
              >
                <span>{t("Sort by", "Sort by")} <strong className="text-white font-semibold ml-1">{sortBy}</strong></span>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-[#09090c]/95 border border-white/20 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.3)] z-40 backdrop-blur-3xl"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          sortBy === option
                            ? "bg-white/20 text-white font-semibold border border-white/25 shadow-sm"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {(selectedBrand || selectedSubCategory || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/60">
              {selectedBrand && (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60 font-medium">Brand:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white rounded-full border border-white/25 text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]">
                    <span>{selectedBrand}</span>
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className="hover:text-white text-white/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              {selectedSubCategory && (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60 font-medium">Sub-Categories:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white rounded-full border border-white/25 text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]">
                    <span>{selectedSubCategory}</span>
                    <button
                      onClick={() => setSelectedSubCategory(null)}
                      className="hover:text-white text-white/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              {searchQuery && (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60 font-medium">Query:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white rounded-full border border-white/25 text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]">
                    <span>"{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="hover:text-white text-white/60 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="group inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.08] hover:bg-white/[0.18] text-white/80 hover:text-white rounded-full border border-white/15 hover:border-white/30 text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] ml-1 cursor-pointer transition-all active:scale-95 backdrop-blur-md"
              >
                <RotateCcw className="w-3 h-3 text-white/60 group-hover:text-white transition-transform group-hover:-rotate-90 duration-300" />
                <span>{t("Clear all", "Clear all")}</span>
              </button>
            </div>
          )}

          {/* Results Count Line */}
          <div className="pt-1 text-xs sm:text-sm text-white/60">
            About <strong className="font-bold text-white">{filteredProducts.length}</strong> results
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map((sk) => (
                <div
                  key={sk}
                  className="flex flex-col bg-white/[0.06] rounded-3xl border border-white/15 h-[380px] overflow-hidden backdrop-blur-xl shadow-sm"
                >
                  <div className="h-48 bg-white/[0.05] animate-pulse" />
                  <div className="p-5 flex flex-col flex-grow space-y-3">
                    <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="w-full h-3 bg-white/[0.06] rounded animate-pulse" />
                    <div className="w-1/2 h-5 bg-white/10 rounded animate-pulse mt-auto" />
                  </div>
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.08] rounded-3xl border border-white/15 p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">{t("No products found", "No products found")}</h3>
                <p className="text-white/60 max-w-md text-xs sm:text-sm leading-relaxed">
                  We couldn't find anything matching your filter criteria. Try clearing some filters or searching for another term.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.35)] active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-black transition-transform group-hover:-rotate-90 duration-300" />
                  <span>{t("Reset All Filters", "Reset All Filters")}</span>
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="h-full"
                    >
                      <Link
                        to={`/store/${product.id}`}
                        className="group relative flex flex-col bg-white/[0.08] hover:bg-white/[0.12] rounded-3xl overflow-hidden border border-white/15 hover:border-white/35 transition-all duration-300 h-full shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:-translate-y-1 backdrop-blur-2xl"
                      >
                        {/* Card Image */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                          {/* Top-Left Brand Tag */}
                          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-wider text-white font-bold border border-white/20 shadow-sm">
                            {product.brand || product.tag || "DIGITAL"}
                          </div>

                          {/* Top-Right Badge */}
                          {product.badge && (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full backdrop-blur-md border border-white/35 bg-white/20 px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-white shadow-[0_0_12px_rgba(255,255,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                              {product.badge}
                            </div>
                          )}

                          <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-white/60 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-white" />
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex flex-col flex-grow justify-between space-y-2.5">
                          <div>
                            <div className="text-[11px] font-medium text-white/55 uppercase tracking-wide mb-1">
                              {product.subCategory || "Verified"}
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-white/65 text-xs line-clamp-2 leading-relaxed mt-1">
                              {product.description}
                            </p>

                            {product.warrantyInfo && (
                              <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold w-fit shadow-sm">
                                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{product.warrantyInfo}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between pt-3 border-t border-white/10">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                                {formatPrice(product.price)}
                              </span>
                              {isDiscounted && (
                                <span className="text-xs text-white/40 line-through">
                                  {formatPrice(product.originalPrice!)}
                                </span>
                              )}
                            </div>
                            <span className={`text-[11px] font-semibold ${
                              product.stock === 0
                                ? "text-rose-400"
                                : product.stock === -1
                                ? "text-blue-400"
                                : "text-white/60"
                            }`}>
                              {product.stock === -1
                                ? "Instant Delivery"
                                : product.stock === 0
                                ? "Out of Stock"
                                : `${product.stock} in stock`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
