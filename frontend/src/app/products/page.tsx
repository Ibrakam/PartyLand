"use client";

export const dynamic = 'force-dynamic';

import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/telegram";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategories, getProducts, getProduct, Product as ApiProduct, Category as ApiCategory } from "@/lib/api";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { SlidersHorizontal } from "lucide-react";

// Определяем API URL - всегда используем продакшн сервер
function getApiBaseUrl(): string {
  // Всегда используем продакшн сервер
  return 'http://81.162.55.70:8001';
}

const API_BASE_URL = getApiBaseUrl();

// Helper function to get full image URL
function getImageUrl(image?: string | null): string {
  if (!image) {
    return "https://cdn.pixabay.com/photo/2022/11/03/19/00/birthday-7568225_1280.png";
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE_URL}${image}`;
}

type FrontProduct = { 
  id: number; 
  name: string; 
  description: string; 
  price: number; 
  heliumPrice: number | null;
  hasHeliumOption: boolean;
  image: string; 
  category: string;
  longDescription?: string;
};

function ProductsPageContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const subcategorySlug = searchParams.get('subcategory');
  
  const [isTelegram, setIsTelegram] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontProduct | null>(null);
  const [backendCategories, setBackendCategories] = useState<ApiCategory[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [backendProducts, setBackendProducts] = useState<FrontProduct[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(categorySlug);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string | null>(subcategorySlug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("default");
  const [pageSize, setPageSize] = useState("30");
  const { prefersReducedMotion, default: defaultAnim, micro } = useReducedMotionSafe();

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  // Синхронизируем состояние с URL параметрами
  useEffect(() => {
    setSelectedCategorySlug(categorySlug);
    setSelectedSubcategorySlug(subcategorySlug);
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    const isInTelegram = isTelegramWebApp();
    setIsTelegram(isInTelegram);
    
    if (isInTelegram) {
      initTelegramWebApp();
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Загрузка категорий с бэкенда
    getCategories()
      .then((cats) => {
        setBackendCategories(cats);
      })
      .catch((error) => {
        console.error("Failed to load categories:", error);
        setError("Не удалось загрузить категории");
      });
    
    // Загрузка товаров с бэкенда - фильтруем по категории если есть
    const categoryToLoad = categorySlug || undefined;
    getProducts(categoryToLoad)
      .then((prods: ApiProduct[]) => {
        setApiProducts(prods);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
        setError("Не удалось загрузить товары");
        setLoading(false);
      });
  }, [categorySlug]);

  useEffect(() => {
    if (apiProducts.length === 0) return;
    const mapped: FrontProduct[] = apiProducts.map((p) => ({
      id: p.id,
      name: (language === "uz" && p.title_uz) ? p.title_uz : p.title,
      description: (language === "uz" && p.description_uz) ? p.description_uz : p.description,
      price: Number(p.price) || 0,
      heliumPrice: p.helium_price ? Number(p.helium_price) : null,
      hasHeliumOption: Boolean(p.has_helium_option),
      image: getImageUrl(p.image),
      category: typeof p.category === 'string' ? p.category : (p.category as ApiCategory)?.name || '',
      longDescription: (language === "uz" && p.description_uz) ? p.description_uz : p.description,
    }));
    setBackendProducts(mapped);
  }, [apiProducts, language]);

  // Находим выбранную категорию и подкатегории
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return backendCategories.find(cat => cat.slug === selectedCategorySlug && !cat.parent);
  }, [selectedCategorySlug, backendCategories]);

  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return backendCategories.filter(cat => cat.parent === selectedCategory.id);
  }, [selectedCategory, backendCategories]);

  // Фильтруем продукты
  const filteredProducts = useMemo(() => {
    let products = backendProducts;
    
    // Фильтр по категории
    if (selectedCategorySlug) {
      const category = backendCategories.find(cat => cat.slug === selectedCategorySlug);
      if (category) {
        // Если выбрана подкатегория
        if (selectedSubcategorySlug) {
          const subcategory = backendCategories.find(cat => cat.slug === selectedSubcategorySlug && cat.parent === category.id);
          if (subcategory) {
            products = products.filter(p => {
              const productCategory = typeof p.category === 'string' ? p.category : '';
              return productCategory.toLowerCase() === subcategory.name.toLowerCase();
            });
          }
        } else {
          // Фильтруем по родительской категории и всем подкатегориям
          const categoryNames = [category.name];
          subcategories.forEach(sub => categoryNames.push(sub.name));
          products = products.filter(p => {
            const productCategory = typeof p.category === 'string' ? p.category : '';
            return categoryNames.some(name => productCategory.toLowerCase() === name.toLowerCase());
          });
        }
      }
    }
    
    return products;
  }, [backendProducts, selectedCategorySlug, selectedSubcategorySlug, backendCategories, subcategories]);

  const sortedProducts = useMemo(() => {
    const products = [...filteredProducts];
    switch (sortOption) {
      case "price_asc":
        return products.sort((a, b) => a.price - b.price);
      case "price_desc":
        return products.sort((a, b) => b.price - a.price);
      case "new":
        return products.sort((a, b) => b.id - a.id);
      default:
        return products;
    }
  }, [filteredProducts, sortOption]);

  const parsedPageSize = useMemo(() => {
    const parsed = parseInt(pageSize, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return sortedProducts.length || 0;
    }
    return parsed;
  }, [pageSize, sortedProducts.length]);

  const visibleProducts = useMemo(() => {
    if (parsedPageSize === 0) {
      return sortedProducts;
    }
    return sortedProducts.slice(0, parsedPageSize);
  }, [sortedProducts, parsedPageSize]);

  const handleViewDetails = useCallback(async (id: number) => {
    const product = backendProducts.find(p => p.id === id);
    if (product) {
      try {
        const fullProduct = await getProduct(id);
        const categoryName = typeof fullProduct.category === 'object' 
          ? (language === "uz" && fullProduct.category?.name_uz) 
            ? fullProduct.category.name_uz 
            : fullProduct.category?.name || ''
          : fullProduct.category;
        
        setSelectedProduct({
          id: fullProduct.id,
          name: (language === "uz" && fullProduct.title_uz) ? fullProduct.title_uz : fullProduct.title,
          description: (language === "uz" && fullProduct.description_uz) ? fullProduct.description_uz : fullProduct.description,
          price: Number(fullProduct.price) || 0,
          heliumPrice: fullProduct.helium_price ? Number(fullProduct.helium_price) : null,
          hasHeliumOption: Boolean(fullProduct.has_helium_option),
          image: getImageUrl(fullProduct.image),
          category: categoryName || product.category,
          longDescription: (language === "uz" && fullProduct.description_uz) ? fullProduct.description_uz : fullProduct.description,
        });
      } catch {
        setSelectedProduct(product);
      }
    }
  }, [backendProducts, language]);

  const parentCategories = backendCategories.filter(cat => !cat.parent);

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategorySlug(slug);
    setSelectedSubcategorySlug(null);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
      params.delete('subcategory');
    } else {
      params.delete('category');
      params.delete('subcategory');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSubcategorySelect = (slug: string | null) => {
    setSelectedSubcategorySlug(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('subcategory', slug);
    } else {
      params.delete('subcategory');
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className={`min-h-screen ${isTelegram ? 'pb-20' : ''}`}>
      <Navigation />
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": t("nav.products") || "Products",
            "description": t("products.description") || "Browse our collection of party supplies",
            "url": typeof window !== 'undefined' ? window.location.href : "/products",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": product.name,
                "description": product.description,
                "image": product.image,
                "offers": {
                  "@type": "Offer",
                  "price": product.price,
                  "priceCurrency": "UZS",
                  "availability": "https://schema.org/InStock"
                }
              }))
            }
          })
        }}
      />

      {/* Header Section */}
      <section className="bg-gradient-to-br from-sweet-pink-light via-sweet-pink to-sweet-purple/30 py-8 sm:py-10 md:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              {t("nav.products")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t("products.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {backendCategories.length > 0 && (
        <section className="bg-white border-b border-sweet-pink/10  top-20 z-40 shadow-sm touch-pan-x" aria-label="Category filter">
          <div className="container mx-auto max-w-7xl">
            {/* Parent Categories */}
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
                <div className="flex gap-3 sm:gap-4 min-w-max pb-2" role="list">
                  <motion.button
                    type="button"
                    role="listitem"
                    onClick={() => handleCategorySelect(null)}
                    className={`group flex w-24 sm:w-28 flex-col items-center gap-2 rounded-3xl border px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus:outline-none focus:ring-0 ${
                       selectedCategorySlug === null
                        ? "bg-white shadow-xl border-transparent after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-sweet-magenta/60 after:shadow-[0_8px_24px_rgba(255,93,159,0.25)]"
                        : "bg-white/95 hover:bg-white shadow-sm border-sweet-pink/20"
                     }`}
                     aria-pressed={selectedCategorySlug === null}
                     aria-label={translate("categories.all", "Все категории")}
                     whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                     whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                     transition={{ duration: micro.duration, ease: micro.ease }}
                  >
                    <span
                      className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-2xl transition-all ${
                        selectedCategorySlug === null
                          ? "border-sweet-magenta/70 shadow-lg"
                          : "border-sweet-pink/30 group-hover:border-sweet-magenta/40"
                      }`}
                    >
                      <span role="img" aria-hidden="true">
                        🎉
                      </span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground text-center leading-tight">
                      {translate("categories.all", "Все категории")}
                    </span>
                  </motion.button>
                  {parentCategories.map((category) => {
                    const categoryName =
                      language === "uz" && category.name_uz ? category.name_uz : category.name;
                    const imageUrl = category.image ? getImageUrl(category.image) : null;
                    const isSelected = selectedCategorySlug === category.slug;
                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        role="listitem"
                        onClick={() => handleCategorySelect(category.slug)}
                        className={`group flex w-24 sm:w-28 flex-col items-center gap-2 rounded-3xl border px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus:outline-none focus:ring-0 ${
                          isSelected
                            ? "bg-white shadow-xl border-transparent after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-sweet-magenta/60 after:shadow-[0_8px_24px_rgba(255,93,159,0.25)]"
                            : "bg-white/95 hover:bg-white shadow-sm border-sweet-pink/20"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Filter by ${categoryName}`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                        transition={{ duration: micro.duration, ease: micro.ease }}
                      >
                        <span
                          className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-2xl transition-all ${
                            isSelected
                              ? "border-sweet-magenta/70 shadow-lg"
                              : "border-sweet-pink/30 group-hover:border-sweet-magenta/40"
                          }`}
                        >
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={categoryName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 64px, 80px"
                            />
                          ) : (
                            <span role="img" aria-hidden="true">
                              🎈
                            </span>
                          )}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-foreground text-center leading-tight line-clamp-2">
                          {categoryName}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subcategories */}
             {selectedCategory && subcategories.length > 0 && (
               <div className="border-t border-sweet-pink/10 bg-gradient-to-b from-white to-sweet-pink-light/20">
                <div className="px-3 sm:px-4 py-3 sm:py-4">
                  <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4" role="list" aria-label="Subcategories">
                    <div className="flex items-stretch gap-2 sm:gap-3 min-w-max">
                      <motion.button
                        type="button"
                        role="listitem"
                        onClick={() => handleSubcategorySelect(null)}
                        className={`group flex min-w-[170px] items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus:outline-none focus:ring-0 ${
                          selectedSubcategorySlug === null
                            ? "border-sweet-magenta/40 shadow-lg bg-white"
                            : "border-sweet-pink/20 hover:shadow-md hover:border-sweet-magenta/30"
                        }`}
                        aria-pressed={selectedSubcategorySlug === null}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                        transition={{ duration: micro.duration, ease: micro.ease }}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                            {translate("categories.allSubcategories", "Все подкатегории")}
                          </p>
                          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">
                            {translate("categories.allSubcategoriesHint", "Показать все товары")}
                          </p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sweet-pink-light/70 text-lg">
                          🎊
                        </span>
                      </motion.button>
                      {subcategories.map((subcategory) => {
                        const subcategoryName =
                          language === "uz" && subcategory.name_uz
                            ? subcategory.name_uz
                            : subcategory.name;
                        const imageUrl = subcategory.image ? getImageUrl(subcategory.image) : null;
                        const isSelected = selectedSubcategorySlug === subcategory.slug;
                        return (
                          <motion.button
                            key={subcategory.id}
                            type="button"
                            role="listitem"
                            onClick={() => handleSubcategorySelect(subcategory.slug)}
                            className={`group flex min-w-[160px] items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none focus:outline-none focus:ring-0 ${
                              isSelected
                                ? "border-sweet-magenta/40 shadow-lg"
                                : "border-sweet-pink/20 hover:shadow-md hover:border-sweet-magenta/30"
                            }`}
                            aria-pressed={isSelected}
                            aria-label={`Filter by ${subcategoryName}`}
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                            transition={{ duration: micro.duration, ease: micro.ease }}
                          >
                            <span className="flex-1 min-w-0 pr-2 text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2">
                              {subcategoryName}
                            </span>
                            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sweet-pink-light/60">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={subcategoryName}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <span role="img" aria-hidden="true">
                                  🎈
                                </span>
                              )}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
               </div>
             )}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main className="py-6 sm:py-8 md:py-12 px-3 sm:px-4 bg-gradient-to-b from-white via-sweet-pink-light/10 to-white min-h-[60vh]">
        <div className="container mx-auto max-w-7xl">
          {visibleProducts.length > 0 ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5">
                 <Button
                  variant="outline"
                  className="rounded-full border-2 border-sweet-pink/30 bg-white px-4 py-1.5 text-xs sm:text-sm font-semibold text-foreground shadow-sm hover:border-sweet-magenta/50 hover:bg-white"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {translate("products.filter", "Фильтр")}
                 </Button>
                <div className="flex gap-3">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-40 rounded-full border-2 border-sweet-pink/30 bg-white text-sm font-semibold text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta/40 focus-visible:ring-offset-0 hover:border-sweet-magenta/50">
                      <SelectValue placeholder={translate("products.sortDefault", "По умолчанию")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-2 border-sweet-pink/20 bg-white/95 text-foreground shadow-xl backdrop-blur-sm">
                      <SelectItem value="default" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">
                        {translate("products.sortDefault", "По умолчанию")}
                      </SelectItem>
                      <SelectItem value="price_asc" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">
                        {translate("products.sortPriceAsc", "Цена ↑")}
                      </SelectItem>
                      <SelectItem value="price_desc" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">
                        {translate("products.sortPriceDesc", "Цена ↓")}
                      </SelectItem>
                      <SelectItem value="new" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">
                        {translate("products.sortNew", "Новинки")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger className="w-28 rounded-full border-2 border-sweet-pink/30 bg-white text-sm font-semibold text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta/40 focus-visible:ring-offset-0 hover:border-sweet-magenta/50">
                      <SelectValue placeholder={translate("products.perPage", "По 30")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-2 border-sweet-pink/20 bg-white/95 text-foreground shadow-xl backdrop-blur-sm">
                      <SelectItem value="15" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">15</SelectItem>
                      <SelectItem value="30" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">30</SelectItem>
                      <SelectItem value="60" className="rounded-2xl font-medium text-foreground focus:bg-sweet-pink-light/70 focus:text-sweet-magenta data-[state=checked]:bg-sweet-pink-light/80 data-[state=checked]:text-sweet-magenta data-[state=checked]:font-semibold">60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-5 sm:mb-6 md:mb-8 px-1 sm:px-2">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium" aria-live="polite">
                  {t("products.found") || "Найдено"} <span className="text-sweet-magenta font-bold text-base sm:text-lg md:text-xl">{sortedProducts.length}</span> {t("products.items") || "товаров"}
                </p>
              </div>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease }}
                key={`${selectedCategorySlug || "all"}-${selectedSubcategorySlug || "all"}-${sortOption}-${pageSize}`}
                role="list"
                aria-label="Product list"
              >
                {visibleProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    role="listitem"
                    className="w-full snap-start"
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: defaultAnim.duration,
                      ease: defaultAnim.ease,
                      delay: prefersReducedMotion ? 0 : index * 0.03,
                    }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      heliumPrice={product.heliumPrice}
                      hasHeliumOption={product.hasHeliumOption}
                      image={product.image}
                      category={product.category}
                      onViewDetails={handleViewDetails}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8" role="status" aria-label="Loading products">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 md:py-24" role="alert">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 font-medium text-lg">{error}</p>
            </div>
          ) : (
            <div className="text-center py-16 md:py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sweet-pink-light mb-4">
                <svg className="w-8 h-8 text-sweet-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-muted-foreground text-base md:text-lg font-medium">
                {selectedCategorySlug 
                  ? (t("products.noProductsInCategory") || "В этой категории пока нет товаров")
                  : (t("noProducts") || "Товары не найдены")
                }
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto max-w-6xl py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
