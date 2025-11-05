"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { formatUZS } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    longDescription?: string;
  };
  onAddToCart?: (id: number, quantity: number) => void;
}

export function ProductDetailModal({
  open,
  onOpenChange,
  product,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCart();
  const { prefersReducedMotion, micro, default: defaultAnim } = useReducedMotionSafe();
  const { t, language } = useLanguage();
  const addToCartText =
    t("product.addToCart") ||
    (language === "uz" ? "Savatga qo'shish" : "В корзину");
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
  const quantityLabel =
    t("product.quantity") || (language === "uz" ? "Miqdor" : "Количество");
  const detailsHeading =
    t("product.details") ||
    (language === "uz" ? "Mahsulot tavsifi" : "Описание товара");
  const gradientAccentClasses =
    "bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5]";

  const handleAddToCart = () => {
    addItem(
      { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image 
      }, 
      quantity
    );
    const successMessage =
      language === "uz"
        ? `${quantity} ta ${product.name} savatchaga qo'shildi!`
        : `${quantity} шт. ${product.name} добавлено в корзину!`;
    toast.success(successMessage);
    
    if (onAddToCart) {
      onAddToCart(product.id, quantity);
    }
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-2 border-sweet-pink">
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease }}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
            {/* Product Image */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-full h-96 bg-gradient-to-br from-sweet-pink-light to-white rounded-3xl overflow-hidden flex items-center justify-center">
              <Image
                src={product.image}
                alt={product.name}
                width={400}
                height={400}
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <motion.button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-sweet-magenta/90 backdrop-blur-sm flex items-center justify-center transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
              aria-label={isFavorite ? favoriteRemoveLabel : favoriteAddLabel}
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              transition={{ duration: micro.duration, ease: micro.ease }}
            >
              <Heart
                className={`w-6 h-6 ${
                  isFavorite ? "fill-white text-white" : "text-white"
                }`}
              />
            </motion.button>
            <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-sweet-cream text-sweet-gold text-sm font-semibold">
              {product.category}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6 text-left">
            <div className="space-y-3">
              <div className="text-4xl font-bold text-sweet-magenta">
                {formatUZS(product.price)}
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.longDescription || product.description}
            </p>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label htmlFor="quantity-selector" className="text-sm font-semibold text-foreground">
                {quantityLabel}
              </label>
              <div className="flex items-center gap-4 bg-white/70 rounded-full p-2 w-fit shadow-inner">
                <motion.button
                  id="quantity-decrease"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`${gradientAccentClasses} w-10 h-10 rounded-full text-white flex items-center justify-center transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2`}
                  aria-label={decreaseLabel}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                  transition={{ duration: micro.duration, ease: micro.ease }}
                >
                  <Minus className="w-5 h-5" />
                </motion.button>
                <span id="quantity-selector" className="text-xl font-bold w-12 text-center" aria-live="polite">
                  {quantity}
                </span>
                <motion.button
                  id="quantity-increase"
                  onClick={() => setQuantity(quantity + 1)}
                  className={`${gradientAccentClasses} w-10 h-10 rounded-full text-white flex items-center justify-center transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2`}
                  aria-label={increaseLabel}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                  transition={{ duration: micro.duration, ease: micro.ease }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            >
              <Button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] hover:from-[#ff92c4] hover:via-[#ff6fb1] hover:to-[#ff4b9e] text-white rounded-full py-5 px-6 font-semibold text-lg flex items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-[#ff6cab] focus-visible:ring-offset-2 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{addToCartText}</span>
              </Button>
            </motion.div>
          </div>
          </div>

          {/* Product Details Section */}
          <motion.div
            className="mt-8 bg-sweet-pink-light rounded-2xl p-6 space-y-4"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease, delay: 0.1 }}
          >
            <h4 className="font-semibold text-lg text-foreground">
              {detailsHeading}
            </h4>
            <p className="text-foreground leading-relaxed">
              {product.longDescription || product.description}
            </p>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
