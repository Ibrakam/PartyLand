"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatUZS } from "@/lib/utils";
import { getTelegramWebApp, isTelegramWebApp } from "@/lib/telegram";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(isTelegramWebApp());
  }, []);

  const itemsCountLabel = useMemo(() => {
    const count = totalItems;
    const mod10 = count % 10;
    const mod100 = count % 100;

    const itemWord =
      language === "ru"
        ? mod10 === 1 && mod100 !== 11
          ? t("cart.itemSingular")
          : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? t("cart.itemFew")
            : t("cart.itemPlural")
        : count === 1
          ? t("cart.itemSingular")
          : t("cart.itemPlural");

    return `${count} ${itemWord} ${t("cart.itemsSuffix")}`;
  }, [language, t, totalItems]);

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }

    if (isTelegram) {
      const webApp = getTelegramWebApp();
      if (webApp) {
        const cartData = {
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
          })),
          total_price: totalPrice,
          total_items: totalItems,
        };
        webApp.sendData(JSON.stringify(cartData));
        webApp.close();
        return;
      }
    }

    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-sweet-pink-light to-white ${isTelegram ? "pb-20" : ""}`}>
        <Navigation />

        <div className="container mx-auto max-w-4xl px-4 py-16">
          <Card className="bg-white rounded-3xl border-2 border-sweet-pink p-12 text-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-32 h-32 bg-sweet-pink-light rounded-full flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-sweet-magenta" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t("cart.emptyTitle")}</h1>
              <p className="text-lg text-muted-foreground max-w-md">
                {t("cart.emptyDescription")}
              </p>
              <Link href="/">
                <Button className="bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full px-8 py-6 text-lg font-semibold mt-4">
                  {t("cart.startShopping")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-sweet-pink-light to-white ${isTelegram ? "pb-20" : ""}`}>
      <Navigation />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {t("cart.title")}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            {itemsCountLabel}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl sm:rounded-3xl border-2 border-sweet-pink p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                  <div className="relative w-full sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-sweet-pink-light aspect-square sm:aspect-auto">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 96px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 flex-1">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:bg-destructive/10 rounded-full flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                          aria-label={t("cart.removeItem")}
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-sweet-magenta mb-3 sm:mb-4">
                        {formatUZS(item.price)}
                      </p>

                      <div className="flex items-center gap-3 sm:gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-sweet-pink hover:bg-sweet-pink-light flex-shrink-0"
                          aria-label={t("cart.decreaseQuantity")}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-base sm:text-lg font-semibold w-10 sm:w-12 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-sweet-пink hover:bg-sweet-pink-light flex-shrink-0"
                          aria-label={t("cart.increaseQuantity")}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <div className="ml-auto sm:ml-0">
                          <p className="text-base sm:text-lg font-bold text-foreground">
                            {formatUZS(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-white rounded-2xl sm:rounded-3xl border-2 border-sweet-pink p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                {t("cart.summaryTitle")}
              </h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span className="font-semibold">{formatUZS(totalPrice)}</span>
                </div>
                <div className="flex flex-col gap-1 text-base sm:text-lg">
                  <span className="text-muted-foreground">{t("cart.shipping")}</span>
                  <span className="text-sm sm:text-base text-sweet-magenta">
                    {t("cart.shippingInfo")}
                  </span>
                </div>
                <div className="border-t-2 border-sweet-pink pt-3 sm:pt-4">
                  <div className="flex justify-between text-lg sm:text-xl font-bold">
                    <span>{t("cart.total")}</span>
                    <span className="text-sweet-magenta">{formatUZS(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full py-5 sm:py-6 text-base sm:text-lg font-semibold"
              >
                {t("cart.checkoutButton")}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Link href="/" className="block mt-3">
                <Button
                  variant="outline"
                  className="w-full border-2 border-sweet-pink text-foreground hover:bg-sweet-pink-light rounded-full py-5 sm:py-6 text-base sm:text-lg font-semibold"
                >
                  {t("cart.continue")}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
