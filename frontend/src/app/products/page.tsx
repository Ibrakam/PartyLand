"use client";

import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/telegram";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategories, getProducts, getProduct, Product as ApiProduct, Category as ApiCategory } from "@/lib/api";
import Image from "next/image";
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

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const [isTelegram, setIsTelegram] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontProduct | null>(null);
  const [backendCategories, setBackendCategories] = useState<ApiCategory[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [backendProducts, setBackendProducts] = useState<FrontProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<FrontProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { prefersReducedMotion, default: defaultAnim, micro } = useReducedMotionSafe();

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
    
    // Загрузка товаров с бэкенда
    getProducts()
      .then((prods: ApiProduct[]) => {
        setApiProducts(prods);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
        setError("Не удалось загрузить товары");
        setLoading(false);
      });
  }, []);

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

  useEffect(() => {
    if (selectedCategory) {
      const filtered = backendProducts.filter(p => 
        p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(backendProducts);
    }
  }, [selectedCategory, backendProducts]);

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
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-3 justify-center" role="list">
              <motion.div
                role="listitem"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                transition={{ duration: micro.duration, ease: micro.ease }}
              >
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null 
                    ? "bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                    : "rounded-full border-sweet-pink hover:bg-sweet-pink-light focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                  }
                  aria-pressed={selectedCategory === null}
                  aria-label={t("categories.all") || "All categories"}
                >
                  {t("categories.all") || "Все"}
                </Button>
              </motion.div>
              {parentCategories.map((category) => (
                <motion.div
                  key={category.id}
                  role="listitem"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                  transition={{ duration: micro.duration, ease: micro.ease }}
                >
                  <Button
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={selectedCategory === category.name
                      ? "bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                      : "rounded-full border-sweet-pink hover:bg-sweet-pink-light focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                    }
                    aria-pressed={selectedCategory === category.name}
                    aria-label={`Filter by ${(language === "uz" && category.name_uz) ? category.name_uz : category.name}`}
                  >
                    {(language === "uz" && category.name_uz) ? category.name_uz : category.name}
                  </Button>
                </motion.div>
              ))}
            </div>
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
                key={selectedCategory || "all"}
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
                {selectedCategory 
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
