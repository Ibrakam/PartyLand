"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { Category as ApiCategory } from "@/lib/api";

interface CategoryScrollProps {
  categories: ApiCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryName: string | null) => void;
  language: "ru" | "uz";
  getImageUrl: (image?: string | null) => string;
}

export const CategoryScroll = memo(function CategoryScroll({
  categories,
  selectedCategory,
  onCategorySelect,
  language,
  getImageUrl,
}: CategoryScrollProps) {
  const { prefersReducedMotion, micro } = useReducedMotionSafe();
  // Исключаем старые тестовые категории
  const parentCategories = categories.filter((cat) => 
    !cat.parent && 
    cat.name !== 'Fruits' && 
    cat.name !== 'cars'
  );

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
      <div className="flex items-center gap-3 min-w-max">
        {/* All Categories Button */}
        <motion.div
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          transition={{ duration: micro.duration, ease: micro.ease }}
        >
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCategorySelect(null)}
            className={
              selectedCategory === null
                ? "bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full px-6 py-6 h-auto font-semibold focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                : "rounded-full border-2 border-sweet-pink hover:bg-sweet-pink-light text-foreground px-6 py-6 h-auto font-semibold focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
            }
            aria-pressed={selectedCategory === null}
          >
            Все
          </Button>
        </motion.div>

        {/* Category Cards */}
        {parentCategories.map((category) => {
          const isSelected = selectedCategory === category.name;
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
              className="flex-shrink-0"
            >
              <button
                onClick={() => onCategorySelect(category.name)}
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-sweet-magenta shadow-lg scale-105"
                    : "border-sweet-pink hover:border-sweet-magenta/50"
                }`}
                aria-pressed={isSelected}
                aria-label={`Filter by ${categoryName}`}
              >
                <Image
                  src={getImageUrl(category.image)}
                  alt={categoryName}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="96px"
                />
                <div
                  className={`absolute inset-0 transition-opacity ${
                    isSelected
                      ? "bg-sweet-magenta/20"
                      : "bg-black/10 hover:bg-black/20"
                  }`}
                />
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] md:text-xs font-semibold text-white text-center line-clamp-1">
                    {categoryName}
                  </p>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

