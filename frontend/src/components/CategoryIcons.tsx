"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { Category as ApiCategory } from "@/lib/api";

interface CategoryIconsProps {
  categories: ApiCategory[];
  language: "ru" | "uz";
  getImageUrl: (image?: string | null) => string;
}

export const CategoryIcons = memo(function CategoryIcons({
  categories,
  language,
  getImageUrl,
}: CategoryIconsProps) {
  const { prefersReducedMotion, micro } = useReducedMotionSafe();
  // Берем только родительские категории (без parent), исключаем старые тестовые категории
  const parentCategories = categories.filter((cat) => 
    !cat.parent && 
    cat.name !== 'Fruits' && 
    cat.name !== 'cars'
  );

  if (parentCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 px-4 bg-white" aria-label="Категории товаров">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4 md:gap-6">
          {parentCategories.map((category) => {
            const categoryName =
              language === "uz" && category.name_uz
                ? category.name_uz
                : category.name;

            return (
              <motion.div
                key={category.id}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                transition={{ duration: micro.duration, ease: micro.ease }}
                className="flex flex-col items-center"
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={`Перейти к категории ${categoryName}`}
                >
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center overflow-hidden">
                    {category.image ? (
                      <Image
                        src={getImageUrl(category.image)}
                        alt={categoryName}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="80px"
                      />
                    ) : (
                      <span className="text-2xl md:text-3xl">🎈</span>
                    )}
                  </div>
                  <span className="text-xs md:text-sm text-center text-foreground font-medium group-hover:text-sweet-magenta transition-colors line-clamp-2">
                    {categoryName}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

