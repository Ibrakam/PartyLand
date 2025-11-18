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
    <section className="container mx-auto max-w-6xl px-2 sm:px-3" aria-label="Категории">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {parentCategories.map((category) => {
          const categoryName =
            language === "uz" && category.name_uz
              ? category.name_uz
              : category.name;

          return (
            <motion.div
              key={category.id}
              whileHover={prefersReducedMotion ? {} : { y: -4 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
              transition={{ duration: micro.duration, ease: micro.ease }}
              className="h-full"
            >
              <Link
                href={`/products?category=${category.slug}`}
                className="group relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-3xl border border-sweet-pink/15 bg-white/95 px-4 py-4 shadow-[0_16px_44px_-30px_rgba(255,93,159,0.55)] transition-shadow hover:shadow-[0_22px_56px_-28px_rgba(255,93,159,0.55)]"
              >
                <div className="relative z-10 max-w-[70%] space-y-1.5">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug group-hover:text-sweet-magenta transition-colors line-clamp-2">
                    {categoryName}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                    {language === "uz" ? "Mahsulotlarni ko'rish" : "Посмотреть товары"}
                  </p>
                </div>
                <div className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sweet-pink-light/70 via-white to-white">
                  {category.image ? (
                    <Image
                      src={getImageUrl(category.image)}
                      alt={categoryName}
                      fill
                      sizes="(max-width: 768px) 80px, 120px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🎈</span>
                  )}
                </div>
                <span className="pointer-events-none absolute -right-6 bottom-0 h-20 w-20 rounded-full bg-sweet-pink/15 blur-2xl" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
