"use client";

export const dynamic = 'force-dynamic';

import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/telegram";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategories, getProducts, getProduct, Product as ApiProduct, Category as ApiCategory } from "@/lib/api";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";

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
  const { prefersReducedMotion, default: defaultAnim, micro } = useReducedMotionSafe();

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
      <section className="bg-gradient-to-br from-sweet-pink-light via-sweet-pink to-sweet-purple/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("nav.products")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("products.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {backendCategories.length > 0 && (
        <section className="py-6 px-4 bg-white border-b border-sweet-pink/20 sticky top-20 z-40" aria-label="Category filter">
          <div className="container mx-auto max-w-6xl space-y-4">
            {/* Parent Categories */}
            <div className="flex flex-wrap items-center gap-3 justify-center" role="list">
              <motion.div
                role="listitem"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                transition={{ duration: micro.duration, ease: micro.ease }}
              >
                <Button
                  variant={selectedCategorySlug === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(null)}
                  className={selectedCategorySlug === null 
                    ? "bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                    : "rounded-full border-sweet-pink hover:bg-sweet-pink-light focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                  }
                  aria-pressed={selectedCategorySlug === null}
                  aria-label={t("categories.all") || "All categories"}
                >
                  {t("categories.all") || "Все"}
                </Button>
              </motion.div>
              {parentCategories.map((category) => {
                const categoryName = (language === "uz" && category.name_uz) ? category.name_uz : category.name;
                const isSelected = selectedCategorySlug === category.slug;
                return (
                  <motion.div
                    key={category.id}
                    role="listitem"
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={{ duration: micro.duration, ease: micro.ease }}
                  >
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategorySelect(category.slug)}
                      className={isSelected
                        ? "bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                        : "rounded-full border-sweet-pink hover:bg-sweet-pink-light focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                      }
                      aria-pressed={isSelected}
                      aria-label={`Filter by ${categoryName}`}
                    >
                      {categoryName}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Subcategories */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 justify-center border-t border-sweet-pink/20 pt-4" role="list" aria-label="Subcategories">
                <motion.div
                  role="listitem"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                  transition={{ duration: micro.duration, ease: micro.ease }}
                >
                  <Button
                    variant={selectedSubcategorySlug === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSubcategorySelect(null)}
                    className={selectedSubcategorySlug === null 
                      ? "bg-sweet-purple hover:bg-sweet-purple/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-purple focus-visible:ring-offset-2"
                      : "rounded-full border-sweet-purple/50 hover:bg-sweet-purple/10 focus-visible:ring-2 focus-visible:ring-sweet-purple focus-visible:ring-offset-2"
                    }
                    aria-pressed={selectedSubcategorySlug === null}
                  >
                    Все подкатегории
                  </Button>
                </motion.div>
                {subcategories.map((subcategory) => {
                  const subcategoryName = (language === "uz" && subcategory.name_uz) ? subcategory.name_uz : subcategory.name;
                  const isSelected = selectedSubcategorySlug === subcategory.slug;
                  return (
                    <motion.div
                      key={subcategory.id}
                      role="listitem"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                      transition={{ duration: micro.duration, ease: micro.ease }}
                    >
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSubcategorySelect(subcategory.slug)}
                        className={isSelected
                          ? "bg-sweet-purple hover:bg-sweet-purple/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-purple focus-visible:ring-offset-2"
                          : "rounded-full border-sweet-purple/50 hover:bg-sweet-purple/10 focus-visible:ring-2 focus-visible:ring-sweet-purple focus-visible:ring-offset-2"
                        }
                        aria-pressed={isSelected}
                        aria-label={`Filter by ${subcategoryName}`}
                      >
                        {subcategoryName}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          {filteredProducts.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground" aria-live="polite">
                  {t("products.found") || "Найдено"} {filteredProducts.length} {t("products.items") || "товаров"}
                </p>
              </div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease }}
                key={`${selectedCategorySlug || "all"}-${selectedSubcategorySlug || "all"}`}
                role="list"
                aria-label="Product list"
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    role="listitem"
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
                      image={product.image}
                      category={product.category}
                      onViewDetails={handleViewDetails}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="status" aria-label="Loading products">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12" role="alert">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
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
