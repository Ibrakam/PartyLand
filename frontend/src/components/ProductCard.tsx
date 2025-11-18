"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, Flame } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatUZS } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  heliumPrice?: number | null;
  hasHeliumOption?: boolean;
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
  heliumPrice,
  hasHeliumOption,
  image,
  category,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const { prefersReducedMotion, micro } = useReducedMotionSafe();

  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<"base" | "helium">("base");

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const optionWithoutHelium = translate(
    "product.optionWithoutHelium",
    language === "uz" ? "Geliysiz" : "Без гелия"
  );
  const optionWithHelium = translate(
    "product.optionWithHelium",
    language === "uz" ? "Geli bilan" : "С гелием"
  );
  const addToCartLabel = translate(
    "product.addToCart",
    language === "uz" ? "Savatga qo'shish" : "В корзину"
  );
  const quickViewLabel = translate(
    "product.viewDetails",
    language === "uz" ? "Batafsil" : "Подробнее"
  );
  const decreaseLabel = translate(
    "product.decreaseQuantity",
    language === "uz" ? "Kamaytirish" : "Уменьшить количество"
  );
  const increaseLabel = translate(
    "product.increaseQuantity",
    language === "uz" ? "Ko'paytirish" : "Увеличить количество"
  );

  const options = useMemo(() => {
    const base = {
      key: "base" as const,
      label: optionWithoutHelium,
      price,
      withHelium: false,
    };
    const heliumAvailable =
      Boolean(hasHeliumOption) && heliumPrice !== null && heliumPrice !== undefined;
    if (heliumAvailable) {
      return [
        base,
        {
          key: "helium" as const,
          label: optionWithHelium,
          price: heliumPrice ?? price,
          withHelium: true,
        },
      ];
    }
    return [base];
  }, [hasHeliumOption, heliumPrice, optionWithHelium, optionWithoutHelium, price]);

  const selected = options.find((opt) => opt.key === selectedOption) ?? options[0];
  const displayPrice = selected.price;

  const handleAddToCart = () => {
    addItem(
      {
        id,
        name,
        price: displayPrice,
        image,
        withHelium: selected.withHelium,
        variantLabel: selected.label,
      },
      quantity
    );

    const successMessage =
      language === "uz"
        ? `${quantity} ta ${name} savatchaga qo'shildi!`
        : `${quantity} шт. ${name} добавлено в корзину!`;
    toast.success(successMessage);

    if (onAddToCart) {
      onAddToCart(id, quantity);
    }
    setQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: micro.duration, ease: micro.ease }}
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border border-sweet-pink/20 bg-white shadow-[0_16px_40px_-28px_rgba(255,93,159,0.55)] transition-shadow hover:shadow-[0_26px_56px_-32px_rgba(255,93,159,0.55)]">
        <button
          type="button"
          onClick={() => onViewDetails?.(id)}
          aria-label={quickViewLabel}
          className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sweet-pink-light/30 via-white to-white"
        >
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-contain transition-transform duration-300 hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1 text-xs font-semibold text-sweet-magenta shadow-sm">
            {category}
          </span>
        </button>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>

          {options.length > 1 && (
            <div className="rounded-full bg-sweet-pink-light/60 p-1 text-xs font-semibold text-foreground">
              <div className="grid grid-cols-2 gap-1">
                {options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedOption(option.key)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                      selectedOption === option.key
                        ? "bg-white text-sweet-magenta shadow-sm"
                        : "text-muted-foreground hover:bg-white/70"
                    )}
                  >
                    {option.withHelium && <Flame className="h-3 w-3 text-[#ff6cab]" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-sweet-magenta">
                {formatUZS(displayPrice)}
              </span>
              {options.length > 1 && (
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {selected.label}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center rounded-full border border-sweet-pink/40 bg-white px-2 py-1.5 shadow-inner">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-sweet-magenta hover:bg-sweet-pink-light/70"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  aria-label={decreaseLabel}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-base font-semibold text-foreground" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-sweet-magenta hover:bg-sweet-pink-light/70"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  aria-label={increaseLabel}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] py-3 font-semibold text-white shadow-[0_14px_32px_-22px_rgba(255,92,167,0.7)] hover:from-[#ff92c4] hover:via-[#ff6fb1] hover:to-[#ff4b9e]"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCartLabel}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
