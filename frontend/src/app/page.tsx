"use client";

import { Navigation } from "@/components/Navigation";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { SearchBar } from "@/components/SearchBar";
import { PromoBanner } from "@/components/PromoBanner";
import { CategoryScroll } from "@/components/CategoryScroll";
import { ProductCardCompact } from "@/components/ProductCardCompact";
import { Sparkles } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { isTelegramWebApp, initTelegramWebApp } from "@/lib/telegram";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCategories,
  getProducts,
  getProduct,
  Product as ApiProduct,
  Category as ApiCategory,
} from "@/lib/api";

// Определяем API URL динамически
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Если через ngrok, используем прокси через Next.js
    if (hostname.includes('ngrok') || hostname.includes('ngrok-free.app')) {
      return '/api-proxy';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  return 'http://127.0.0.1:8000';
}

const API_BASE_URL = getApiBaseUrl();

// Helper function to get full image URL
function getImageUrl(image?: string | null): string {
  if (!image) {
    return "https://cdn.pixabay.com/photo/2022/11/03/19/00/birthday-7568225_1280.png";
  }
  if (image.startsWith("http")) {
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

export default function Home() {
  const { t, language } = useLanguage();
  const [isTelegram, setIsTelegram] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontProduct | null>(null);
  const [backendCategories, setBackendCategories] = useState<ApiCategory[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [backendProducts, setBackendProducts] = useState<FrontProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      name: language === "uz" && p.title_uz ? p.title_uz : p.title,
      description:
        language === "uz" && p.description_uz
          ? p.description_uz
          : p.description,
      price: Number(p.price) || 0,
      image: getImageUrl(p.image),
      category: p.category,
      longDescription:
        language === "uz" && p.description_uz
          ? p.description_uz
          : p.description,
    }));
    setBackendProducts(mapped);
  }, [apiProducts, language]);

  // Фильтрация продуктов по категории
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return backendProducts;
    return backendProducts.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [backendProducts, selectedCategory]);

  // Группировка продуктов по категориям для секций
  const productsByCategory = useMemo(() => {
    const grouped: { [key: string]: FrontProduct[] } = {};
    const parentCategories = backendCategories.filter((cat) => !cat.parent);

    parentCategories.forEach((category) => {
      const categoryName =
        language === "uz" && category.name_uz
          ? category.name_uz
          : category.name;
      const categoryProducts = backendProducts.filter(
        (p) => p.category === category.name
      );
      if (categoryProducts.length > 0) {
        grouped[categoryName] = categoryProducts;
      }
    });

    return grouped;
  }, [backendProducts, backendCategories, language]);

  const handleViewDetails = useCallback(async (id: number) => {
    const product = backendProducts.find((p) => p.id === id);
    if (product) {
      try {
        const fullProduct = await getProduct(id);
        const categoryName =
          typeof fullProduct.category === "object"
            ? language === "uz" && fullProduct.category?.name_uz
              ? fullProduct.category.name_uz
              : fullProduct.category?.name || ""
            : fullProduct.category;

        setSelectedProduct({
          id: fullProduct.id,
          name:
            language === "uz" && fullProduct.title_uz
              ? fullProduct.title_uz
              : fullProduct.title,
          description:
            language === "uz" && fullProduct.description_uz
              ? fullProduct.description_uz
              : fullProduct.description,
          price: Number(fullProduct.price) || 0,
          image: getImageUrl(fullProduct.image),
          category: categoryName || product.category,
          longDescription:
            language === "uz" && fullProduct.description_uz
              ? fullProduct.description_uz
              : fullProduct.description,
        });
      } catch {
        setSelectedProduct(product);
      }
    }
  }, [backendProducts, language]);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("hero.title") || "PartyLand",
    description:
      t("hero.description") ||
      "Everything you need for unforgettable children's parties",
    url: siteUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: backendProducts.slice(0, 10).map((product, index) => ({
        "@type": "Product",
        position: index + 1,
        name: product.name,
        description: product.description,
        image: product.image,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "UZS",
          availability: "https://schema.org/InStock",
        },
      })),
    },
  };

  return (
    <div className={`min-h-screen bg-background ${isTelegram ? "pb-20" : ""}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        suppressHydrationWarning
      />
      <Navigation />

      <main className="container mx-auto max-w-6xl px-4 py-4 md:py-6 space-y-6">
        {/* Search Bar */}
        <div className="w-full">
          <SearchBar />
        </div>

        {/* Promo Banner */}
        <PromoBanner />

        {/* Category Scroll */}
        {backendCategories.length > 0 && (
          <div className="py-2">
            <CategoryScroll
              categories={backendCategories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              language={language}
              getImageUrl={getImageUrl}
            />
          </div>
        )}

        {/* Product Sections */}
        {selectedCategory ? (
          /* Filtered Products Section */
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sweet-magenta" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {t("products.featured") || "Рекомендуемые товары"}
              </h2>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                <div className="flex gap-4 min-w-max">
                  {filteredProducts.map((product) => (
                    <ProductCardCompact
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      description={product.description}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="flex gap-4 overflow-x-auto">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-48 md:w-64 h-72 bg-white rounded-2xl border-2 border-sweet-pink animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {t("products.noProductsInCategory") ||
                    "В этой категории пока нет товаров"}
                </p>
              </div>
            )}
          </section>
        ) : (
          /* Product Sections by Category */
          Object.keys(productsByCategory).length > 0 ? (
            Object.entries(productsByCategory).map(([categoryName, products]) => (
              <section key={categoryName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sweet-magenta" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {categoryName}
                  </h2>
          </div>
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                  <div className="flex gap-4 min-w-max">
                    {products.map((product) => (
                      <ProductCardCompact
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image}
                        description={product.description}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
          </div>
        </div>
              </section>
            ))
          ) : backendProducts.length > 0 ? (
            /* Fallback: All Products */
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sweet-magenta" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {t("products.featured") || "Рекомендуемые товары"}
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                <div className="flex gap-4 min-w-max">
                  {backendProducts.map((product) => (
                    <ProductCardCompact
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      description={product.description}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
            </div>
            </section>
          ) : loading ? (
            <div className="flex gap-4 overflow-x-auto">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-48 md:w-64 h-72 bg-white rounded-2xl border-2 border-sweet-pink animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12" role="alert">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("noProducts") || "Товары не найдены"}
              </p>
            </div>
          )
        )}
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
