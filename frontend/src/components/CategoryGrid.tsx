"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { Category as ApiCategory } from "@/lib/api";

interface CategoryGridProps {
  categories: ApiCategory[];
  language: "ru" | "uz";
  getImageUrl: (image?: string | null) => string;
}

export function CategoryGrid({ categories, language, getImageUrl }: CategoryGridProps) {
  const { prefersReducedMotion, micro } = useReducedMotionSafe();

  const parentCategories = categories.filter((cat) => !cat.parent);
  if (parentCategories.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto max-w-6xl px-1 sm:px-3" aria-label="Категории">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {parentCategories.map((category) => {
          const categoryName =
            language === "uz" && category.name_uz
              ? category.name_uz
              : category.name;

          return (
            <motion.div
              key={category.id}
              whileHover={prefersReducedMotion ? {} : { y: -4 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={{ duration: micro.duration, ease: micro.ease }}
              className="h-full"
            >
              <Link
                href={`/products?category=${category.slug}`}
                className="group relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-sweet-pink/15 bg-white/95 px-3 py-3 text-left shadow-[0_14px_36px_-24px_rgba(255,93,159,0.55)] transition-shadow hover:shadow-[0_20px_44px_-22px_rgba(255,93,159,0.55)] sm:px-4 sm:py-4"
              >
                <div className="relative z-10 flex flex-1 flex-col justify-center space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug group-hover:text-sweet-magenta transition-colors line-clamp-2">
                    {categoryName}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === "uz" ? "Mahsulotlarni ko'rish" : "Посмотреть товары"}
                  </p>
                </div>
                <div className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sweet-pink-light/55 via-white to-white">
                  {category.image ? (
                    <Image
                      src={getImageUrl(category.image)}
                      alt={categoryName}
                      fill
                      sizes="70px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl">🎈</span>
                  )}
                </div>
                <span className="pointer-events-none absolute -right-6 bottom-0 h-16 w-16 rounded-full bg-sweet-pink/12 blur-2xl" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
