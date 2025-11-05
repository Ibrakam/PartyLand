"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { formatUZS } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductCardCompactProps {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
  onViewDetails?: (id: number) => void;
  className?: string;
}

export const ProductCardCompact = memo(function ProductCardCompact({
  id,
  name,
  price,
  image,
  description,
  onViewDetails,
  className = "",
}: ProductCardCompactProps) {
  const { prefersReducedMotion, micro } = useReducedMotionSafe();
  const { t, language } = useLanguage();
  const viewDetailsLabel =
    t("product.viewDetails") ||
    (language === "uz" ? "Batafsil" : "Подробнее");
  const detailAria =
    language === "uz"
      ? `${name} haqida batafsil`
      : `Подробнее о ${name}`;
  const deliveryNote =
    t("product.deliveryNote") ||
    (language === "uz" ? "+ yetkazib berish" : "+ доставка");
  const truncatedDescription = description
    ? description.length > 110
      ? `${description.slice(0, 110).trim()}…`
      : description
    : null;

  return (
    <motion.div
      className={`flex-shrink-0 w-56 md:w-72 ${className}`}
      initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: micro.duration, ease: micro.ease }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
      style={{ willChange: prefersReducedMotion ? "opacity" : "transform, opacity" }}
    >
      <Card
        className="group relative flex h-full flex-col overflow-hidden rounded-[34px] border border-white/40 bg-[radial-gradient(circle_at_top,#ffe3f4,transparent_70%)] shadow-[0_18px_40px_-28px_rgba(255,93,159,0.6)] transition-[box-shadow,transform] duration-400 hover:shadow-[0_22px_48px_-26px_rgba(255,93,159,0.66)] cursor-pointer"
        onClick={() => onViewDetails?.(id)}
      >
        <div
          className="pointer-events-none absolute inset-x-6 top-[-12%] h-56 bg-[radial-gradient(circle_at_top,#ffd7ed_0%,rgba(255,215,237,0)_70%)]"
          aria-hidden="true"
        />

        {/* Product Image */}
        <div className="relative flex h-48 md:h-56 w-full items-center justify-center px-6 pt-10">
          <div className="absolute inset-x-10 top-4 h-32 rounded-[50%] bg-gradient-to-b from-white/80 via-white/40 to-transparent blur-3xl" />
          <div className="relative flex h-full w-full items-center justify-center rounded-[38px] bg-gradient-to-b from-[#ffe3f4] via-white/65 to-white">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain transition-transform duration-400 group-hover:scale-[1.04]"
              loading="lazy"
              sizes="(max-width: 768px) 224px, 288px"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="relative z-10 flex flex-1 flex-col gap-4 px-6 pb-8 pt-4">
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold text-[#6b645e] line-clamp-2 min-h-[2.8rem]">
              {name}
            </h3>
            {truncatedDescription && (
              <p className="text-xs md:text-sm leading-snug text-[#8c827c] line-clamp-3">
                {truncatedDescription}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold text-[#ff6cab]">
                {formatUZS(price)}
              </span>
              <span className="text-[0.7rem] text-[#ba92a8]">
                {deliveryNote}
              </span>
            </div>
            <button
              className="flex h-10 min-w-[5.25rem] items-center justify-center rounded-full bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] px-3 text-[0.7rem] font-semibold text-white shadow-[0_14px_28px_-22px_rgba(255,92,167,0.78)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2"
              aria-label={detailAria}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(id);
              }}
            >
              {viewDetailsLabel}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
