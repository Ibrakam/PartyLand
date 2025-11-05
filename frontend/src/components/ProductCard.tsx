"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Plus, Minus } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { formatUZS } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  onAddToCart?: (id: number, quantity: number) => void;
  onViewDetails?: (id: number) => void;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuantity, setShowQuantity] = useState(false);
  const { addItem } = useCart();
  const { prefersReducedMotion, micro } = useReducedMotionSafe();
  const { t, language } = useLanguage();
  const categoryTags = category
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const addToCartLabel =
    t("product.addToCart") ||
    (language === "uz" ? "Savatga qo'shish" : "В корзину");
  const viewDetailsLabel =
    language === "uz" ? `${name} haqida batafsil` : `Подробнее о ${name}`;
  const favoriteAddLabel =
    t("product.favoriteAdd") ||
    (language === "uz" ? "Sevimlilarga qo'shish" : "Добавить в избранное");
  const favoriteRemoveLabel =
    t("product.favoriteRemove") ||
    (language === "uz"
      ? "Sevimlilardan olib tashlash"
      : "Убрать из избранного");
  const decreaseLabel =
    t("product.decreaseQuantity") ||
    (language === "uz" ? "Miqdorni kamaytirish" : "Уменьшить количество");
  const increaseLabel =
    t("product.increaseQuantity") ||
    (language === "uz" ? "Miqdorni oshirish" : "Увеличить количество");
  const gradientButtonClasses =
    "w-full rounded-full bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] hover:from-[#ff92c4] hover:via-[#ff6fb1] hover:to-[#ff4b9e] text-white shadow-[0_16px_32px_-22px_rgba(255,92,167,0.8)] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2";
  const gradientAccentClasses =
    "bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5]";

  const handleAddToCart = () => {
    addItem({ id, name, price, image }, quantity);
    const successMessage =
      language === "uz"
        ? `${quantity} ta ${name} savatchaga qo'shildi!`
        : `${quantity} шт. ${name} добавлено в корзину!`;
    toast.success(successMessage);

    if (onAddToCart) {
      onAddToCart(id, quantity);
    }
    setShowQuantity(false);
    setQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: micro.duration, ease: micro.ease }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      style={{ willChange: prefersReducedMotion ? "opacity" : "transform, opacity" }}
    >
      <Card className="group relative flex flex-col overflow-hidden rounded-[38px] border border-white/40 bg-[radial-gradient(circle_at_top,#ffe3f4,transparent_70%)] shadow-[0_20px_45px_-30px_rgba(255,93,159,0.65)] transition-all duration-400 hover:shadow-[0_24px_55px_-26px_rgba(255,93,159,0.7)]">
        {/* Floating highlight behind the product */}
        <div
          className="pointer-events-none absolute inset-x-6 top-[-10%] h-64 bg-[radial-gradient(circle_at_top,#ffd7ed_0%,rgba(255,215,237,0.0)_70%)]"
          aria-hidden="true"
        />

        {/* Favorite Button */}
        <motion.button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute left-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2"
          aria-label={isFavorite ? favoriteRemoveLabel : favoriteAddLabel}
          whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
          transition={{ duration: micro.duration, ease: micro.ease }}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? "fill-[#ff6cab] text-[#ff6cab]" : "text-[#ff6cab]"}`}
          />
        </motion.button>

        {/* Product Image zone */}
        <div
          className="relative z-10 flex w-full flex-col items-center px-8 pt-16 pb-10"
          onClick={() => onViewDetails?.(id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onViewDetails?.(id);
            }
          }}
          aria-label={viewDetailsLabel}
        >
          <div className="absolute inset-x-12 top-8 h-48 rounded-[50%] bg-gradient-to-b from-white/80 via-white/40 to-transparent blur-[50px]" />
          <div className="relative flex h-56 w-full items-center justify-center rounded-[46px] bg-gradient-to-b from-[#ffe3f4] via-white/65 to-white">
            <Image
              src={image}
              alt={name}
              width={240}
              height={240}
              className="max-h-[220px] w-auto object-contain transition-transform duration-400 group-hover:scale-[1.04]"
              loading="lazy"
              sizes="(max-width: 768px) 70vw, 33vw"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="relative z-10 flex flex-1 flex-col gap-5 px-8 pb-10 pt-4">
          <div className="space-y-3">
            <div
              className="cursor-pointer space-y-2"
              onClick={() => onViewDetails?.(id)}
            >
              <h3 className="text-2xl font-semibold text-[#675f5a]">{name}</h3>
              <p className="text-sm leading-relaxed text-[#8c827c] line-clamp-3">
                {description}
              </p>
            </div>

            {categoryTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#f4e6dd] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b39d8b]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-3xl font-bold text-[#ff6cab]">
              {formatUZS(price)}
            </div>

            {/* Quantity Selector & Add to Cart */}
            {showQuantity ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-full border border-[#f3dce4] bg-white/95 p-1.5">
                  <motion.button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={`${gradientAccentClasses} flex h-11 w-11 items-center justify-center text-xl font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2`}
                    aria-label={decreaseLabel}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
                    transition={{ duration: micro.duration, ease: micro.ease }}
                  >
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <span className="flex-1 text-center text-lg font-semibold text-[#6f6460]">
                    {quantity}
                  </span>
                  <motion.button
                    onClick={() => setQuantity(quantity + 1)}
                    className={`${gradientAccentClasses} flex h-11 w-11 items-center justify-center text-xl font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2`}
                    aria-label={increaseLabel}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
                    transition={{ duration: micro.duration, ease: micro.ease }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                >
                  <Button
                    onClick={handleAddToCart}
                    className={`${gradientButtonClasses} py-5 px-6 text-base font-semibold flex items-center justify-center gap-3`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{addToCartLabel}</span>
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Button
                  onClick={() => setShowQuantity(true)}
                  className={`${gradientButtonClasses} py-5 px-6 text-base font-semibold flex items-center justify-center gap-3`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{addToCartLabel}</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
