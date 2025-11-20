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
    <section className="w-full px-3 py-6" aria-label="Категории" style={{ backgroundColor: '#FDF2F8' }}>
      <div className="w-full max-w-none">
        {/* На мобильных - сетка 2x2, на больших экранах - горизонтальная прокрутка */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {parentCategories.map((category) => {
            const categoryName =
              language === "uz" && category.name_uz
                ? category.name_uz
                : category.name;

            return (
              <motion.div
                key={category.id}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: micro.duration, ease: micro.ease }}
                className="h-full"
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group relative flex h-[130px] items-start justify-between overflow-hidden rounded-3xl bg-white p-5 shadow-lg border border-pink-100 hover:shadow-xl transition-all duration-300"
                >
                  {/* Иконка - за текстом */}
                  <div className="absolute right-3 top-3 bottom-3 flex items-center justify-center z-0">
                    {category.image ? (
                      <div className="relative w-20 h-20">
                        <Image
                          src={getImageUrl(category.image)}
                          alt={categoryName}
                          fill
                          className="object-contain"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <span className="text-5xl">🎈</span>
                    )}
                  </div>
                  
                  {/* Текстовая часть */}
                  <div className="relative z-10 flex flex-1 flex-col justify-start h-full pr-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">
                        {categoryName}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Розовый градиент-фон */}
                  <div 
                    className="absolute inset-0 opacity-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.08) 0%, rgba(255, 182, 193, 0.05) 50%, rgba(255, 192, 203, 0.03) 100%)'
                    }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        {/* Для больших экранов - горизонтальная прокрутка */}
        <div className="hidden md:block">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {parentCategories.map((category) => {
              const categoryName =
                language === "uz" && category.name_uz
                  ? category.name_uz
                  : category.name;

              return (
                <motion.div
                  key={category.id}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: micro.duration, ease: micro.ease }}
                  className="flex-shrink-0"
                >
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="group relative flex h-[130px] w-[280px] items-start justify-between overflow-hidden rounded-3xl bg-white p-5 shadow-lg border border-pink-100 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Иконка - за текстом */}
                    <div className="absolute right-3 top-3 bottom-3 flex items-center justify-center z-0 opacity-30">
                      {category.image ? (
                        <div className="relative w-20 h-20">
                          <Image
                            src={getImageUrl(category.image)}
                            alt={categoryName}
                            fill
                            className="object-contain"
                            sizes="80px"
                          />
                        </div>
                      ) : (
                        <span className="text-5xl opacity-20">🎈</span>
                      )}
                    </div>
                    
                    {/* Текстовая часть */}
                    <div className="relative z-10 flex flex-1 flex-col justify-start h-full pr-3">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-800 leading-tight">
                          {categoryName}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Розовый градиент-фон */}
                    <div 
                      className="absolute inset-0 opacity-8"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.08) 0%, rgba(255, 182, 193, 0.05) 50%, rgba(255, 192, 203, 0.03) 100%)'
                      }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
