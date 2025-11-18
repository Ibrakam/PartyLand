"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Flame } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn, formatUZS } from "@/lib/utils";
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
    heliumPrice?: number | null;
    hasHeliumOption?: boolean;
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
  const [selectedOption, setSelectedOption] = useState<"base" | "helium">("base");
  const { addItem } = useCart();
  const { prefersReducedMotion, micro, default: defaultAnim } = useReducedMotionSafe();
  const { t, language } = useLanguage();

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const addToCartText = translate(
    "product.addToCart",
    language === "uz" ? "Savatga qo'shish" : "В корзину"
  );
  const decreaseLabel = translate("product.decreaseQuantity", language === "uz" ? "Kamaytirish" : "Уменьшить количество");
  const increaseLabel = translate("product.increaseQuantity", language === "uz" ? "Ko'paytirish" : "Увеличить количество");
  const quantityLabel = translate("product.quantity", language === "uz" ? "Miqdor" : "Количество");
  const detailsHeading = translate("product.details", language === "uz" ? "Mahsulot tavsifi" : "Описание товара");
  const optionWithoutHelium = translate(
    "product.optionWithoutHelium",
    language === "uz" ? "Geliysiz" : "Без гелия"
  );
  const optionWithHelium = translate(
    "product.optionWithHelium",
    language === "uz" ? "Geli bilan" : "С гелием"
  );

  const options = useMemo(() => {
    const base = {
      key: "base" as const,
      label: optionWithoutHelium,
      price: product.price,
      withHelium: false,
    };
    const heliumAvailable =
      Boolean(product.hasHeliumOption) &&
      product.heliumPrice !== null &&
      product.heliumPrice !== undefined;
    if (heliumAvailable) {
      return [
        base,
        {
          key: "helium" as const,
          label: optionWithHelium,
          price: product.heliumPrice ?? product.price,
          withHelium: true,
        },
      ];
    }
    return [base];
  }, [optionWithHelium, optionWithoutHelium, product.heliumPrice, product.hasHeliumOption, product.price]);

  const selected = options.find((opt) => opt.key === selectedOption) ?? options[0];

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: selected.price,
        image: product.image,
        withHelium: selected.withHelium,
        variantLabel: selected.label,
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

  useEffect(() => {
    setSelectedOption("base");
    setQuantity(1);
  }, [product.id]);

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
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative w-full h-96 bg-gradient-to-br from-sweet-pink-light to-white rounded-3xl overflow-hidden flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={420}
                  height={420}
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full bg-sweet-pink-light/70 px-4 py-2 text-sm font-medium text-sweet-magenta">
                {product.category}
              </div>
            </div>

            <div className="space-y-6 text-left">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-sweet-magenta">
                    {formatUZS(selected.price)}
                  </span>
                  {options.length > 1 && (
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {selected.label}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {product.longDescription || product.description}
                </p>
              </div>

              {options.length > 1 && (
                <div className="rounded-full bg-sweet-pink-light/60 p-1 text-sm font-semibold text-foreground">
                  <div className="grid grid-cols-2 gap-1">
                    {options.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedOption(option.key)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors",
                          selectedOption === option.key
                            ? "bg-white text-sweet-magenta shadow-sm"
                            : "text-muted-foreground hover:bg-white/70"
                        )}
                      >
                        {option.withHelium && <Flame className="h-4 w-4 text-[#ff6cab]" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="quantity-selector" className="text-sm font-semibold text-foreground">
                  {quantityLabel}
                </label>
                <div className="flex items-center gap-4 rounded-full border border-sweet-pink/30 bg-white px-3 py-2 w-fit shadow-inner">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-sweet-magenta hover:bg-sweet-pink-light/70"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label={decreaseLabel}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span id="quantity-selector" className="w-12 text-center text-xl font-bold" aria-live="polite">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-sweet-magenta hover:bg-sweet-pink-light/70"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    aria-label={increaseLabel}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <motion.div whileHover={prefersReducedMotion ? {} : { scale: 1.02 }} whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}>
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

          <motion.div
            className="mt-8 bg-sweet-pink-light/60 rounded-2xl p-6 space-y-4"
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
