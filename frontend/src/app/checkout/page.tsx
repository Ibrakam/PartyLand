"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Home,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createCheckout, CheckoutPayload, CheckoutResponse } from "@/lib/api";
import { formatUZS } from "@/lib/utils";
import { getTelegramWebApp, initTelegramWebApp, isTelegramWebApp } from "@/lib/telegram";

const DEFAULT_FORM = {
  name: "",
  phone: "",
  address: "",
  deliveryTime: "",
  comment: "",
};

const TELEGRAM_ADMIN_USERNAME = "@Partyland_store_admin";
const PAYME_PAYMENT_LINK = "https://transfer.paycom.uz/651cffd4efaffbed745140d9";
const CLICK_PAYMENT_LINK = "https://indoor.click.uz/pay?id=053869&t=0";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { t } = useLanguage();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [snapshotItems, setSnapshotItems] = useState<CartItem[]>([]);
  const [snapshotTotal, setSnapshotTotal] = useState(0);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    const inTelegram = isTelegramWebApp();
    setIsTelegram(inTelegram);
    if (inTelegram) {
      initTelegramWebApp();
    }
  }, []);

  useEffect(() => {
    if (!showInstructions && items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router, showInstructions]);

  const handleFormChange = (field: keyof typeof DEFAULT_FORM) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0 || isSubmitting) {
      return;
    }

    if (!form.address.trim()) {
      setError("Пожалуйста, укажите адрес доставки.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload: CheckoutPayload = {
      cart_items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      address: form.address.trim(),
      comment: form.comment.trim() ? form.comment.trim() : undefined,
      delivery_time: form.deliveryTime.trim() || undefined,
    };

    if (form.name.trim()) {
      payload.customer_name = form.name.trim();
    }
    if (form.phone.trim()) {
      payload.customer_phone = form.phone.trim();
    }

    if (isTelegram) {
      const webApp = getTelegramWebApp();
      const tgUserId = webApp?.initDataUnsafe?.user?.id;
      if (tgUserId) {
        payload.telegram_user_id = tgUserId;
      }
    }

    try {
      const snapshot = items.map((item) => ({ ...item }));
      const total = snapshot.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const response = await createCheckout(payload);
      setCheckoutInfo(response);
      setSnapshotItems(snapshot);
      setSnapshotTotal(total);
      clearCart();
      setShowInstructions(true);
      setForm(DEFAULT_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось оформить заказ. Попробуйте ещё раз позже.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showInstructions && checkoutInfo) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-sweet-pink-light to-white ${isTelegram ? "pb-20" : ""}`}>
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-12 space-y-6">
          <Card className="p-6 sm:p-8 bg-white border-2 border-sweet-pink rounded-3xl space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground">{t("cart.paymentInstructionsTitle")}</h1>
              <p className="text-muted-foreground">{t("cart.paymentInstructionsSubtitle")}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                asChild
                className="bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] hover:from-[#ff92c4] hover:via-[#ff6fb1] hover:to-[#ff4b9e] text-white rounded-full py-4 px-6 font-semibold flex items-center justify-center gap-2"
              >
                <a href={PAYME_PAYMENT_LINK} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  {t("cart.paymentInstructionsPayme")}
                </a>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#ff9cca] via-[#ff7cba] to-[#ff5ca5] hover:from-[#ff92c4] hover:via-[#ff6fb1] hover:to-[#ff4b9e] text-white rounded-full py-4 px-6 font-semibold flex items-center justify-center gap-2"
              >
                <a href={CLICK_PAYMENT_LINK} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  {t("cart.paymentInstructionsClick")}
                </a>
              </Button>
            </div>

            <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
              <p>{t("cart.paymentInstructionsSendReceipt")}</p>
              <a
                href={`https://t.me/${TELEGRAM_ADMIN_USERNAME.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sweet-magenta hover:underline"
              >
                {t("cart.paymentInstructionsAdmin")}
              </a>
            </div>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Link href="/">
                <Button variant="outline" className="rounded-full px-6">
                  <Home className="w-4 h-4 mr-2" />
                  {t("cart.continue")}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-white border-2 border-sweet-pink rounded-3xl space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("cart.paymentInstructionsSummaryTitle")}
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sweet-pink/40 p-4 bg-sweet-pink-light/40">
                <p className="text-sm text-muted-foreground">Номер заказа</p>
                <p className="text-xl font-semibold text-foreground">#{checkoutInfo.order_id}</p>
              </div>
              <div className="rounded-2xl border border-sweet-pink/40 p-4 bg-sweet-pink-light/40">
                <p className="text-sm text-muted-foreground">Сумма к оплате</p>
                <p className="text-xl font-semibold text-foreground">
                  {checkoutInfo.formatted_total || formatUZS(snapshotTotal)}
                </p>
              </div>
            </div>

            <ul className="space-y-2 text-sm sm:text-base">
              {snapshotItems.map((item) => (
                <li key={`${item.id}-${item.name}`} className="flex justify-between gap-3">
                  <span className="text-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-sweet-magenta">
                    {formatUZS(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center pt-3 border-t border-sweet-pink/40 text-base sm:text-lg font-semibold">
              <span>{t("cart.total")}</span>
              <span className="text-sweet-magenta">
                {formatUZS(snapshotTotal)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-sweet-pink-light to-white ${isTelegram ? "pb-20" : ""}`}>
      <Navigation />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Оформление заказа</h1>
            <p className="text-lg text-muted-foreground">
              Заполните данные и получите ссылку на оплату.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3 p-6 bg-white border-2 border-sweet-pink rounded-3xl space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Доставка</h2>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Имя
                  </label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={handleFormChange("name")}
                    placeholder="Например, Алина"
                    className="rounded-2xl"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    Телефон или Telegram
                  </label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={handleFormChange("phone")}
                    placeholder="+998 90 123 45 67"
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
                  Адрес доставки *
                </label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={handleFormChange("address")}
                  placeholder="Город, улица, дом, подъезд, ориентир"
                  className="min-h-[96px] rounded-2xl"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deliveryTime" className="block text-sm font-medium text-foreground mb-1">
                    Желаемое время доставки
                  </label>
                  <Input
                    id="deliveryTime"
                    value={form.deliveryTime}
                    onChange={handleFormChange("deliveryTime")}
                    placeholder="Например, сегодня к 18:00"
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-1">
                  Комментарий к заказу
                </label>
                <Textarea
                  id="comment"
                  value={form.comment}
                  onChange={handleFormChange("comment")}
                  placeholder="Например, позвонить за 10 минут до доставки"
                  className="min-h-[96px] rounded-2xl"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sweet-magenta hover:bg-sweet-magenta/90 text-white rounded-full py-5 px-6 text-base sm:text-lg font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("cart.getPaymentLink")}
                    </>
                  ) : (
                    <>
                      {t("cart.getPaymentLink")}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 bg-white border-2 border-sweet-pink rounded-3xl space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Ваш заказ</h2>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-4 text-muted-foreground">
                  <ShoppingBag className="w-10 h-10" />
                  <p>Корзина пуста</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-3 text-sm sm:text-base">
                    {items.map((item) => (
                      <li key={`${item.id}-${item.name}`} className="flex justify-between gap-3">
                        <span className="text-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-semibold text-sweet-magenta">
                          {formatUZS(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-sweet-pink/40 pt-3 flex justify-between text-base sm:text-lg font-semibold">
                    <span>{t("cart.total")}</span>
                    <span className="text-sweet-magenta">{formatUZS(totalPrice)}</span>
                  </div>
                </div>
              )}
            </Card>
        </div>
      </div>
    </div>
  );
}
