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

  const parentCategories = categories.filter((cat) => !cat.parent);
  if (parentCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-5" aria-label="Категории товаров">
      <div className="container mx-auto max-w-6xl">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1">
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
                className="flex flex-col items-center gap-2"
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="flex flex-col items-center gap-2"
                  aria-label={`Перейти к категории ${categoryName}`}
                >
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[3px] border-sweet-pink-light bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
                    {category.image ? (
                      <Image
                        src={getImageUrl(category.image)}
                        alt={categoryName}
                        fill
                        className="object-cover rounded-full"
                        loading="lazy"
                        sizes="80px"
                      />
                    ) : (
                      <span className="text-2xl">🎈</span>
                    )}
                  </div>
                  <span className="max-w-[5.5rem] text-center text-xs font-medium text-foreground">
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

