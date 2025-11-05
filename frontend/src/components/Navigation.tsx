"use client";

import { useEffect, useState } from "react";
import { isTelegramWebApp } from "@/lib/telegram";
import { Home, ShoppingCart, Menu, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";

export function Navigation() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setIsTelegram(isTelegramWebApp());
  }, []);

  if (isTelegram) {
    // Bottom Navigation for Telegram WebApp
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-sweet-pink shadow-2xl z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="/">
            <NavItem icon={<Home />} label={t("nav.home")} active={pathname === "/"} />
          </Link>
          <Link href="/cart">
            <NavItem
              icon={<ShoppingCart />}
              label={t("nav.cart")}
              badge={totalItems}
              active={pathname === "/cart"}
            />
          </Link>
        </div>
      </nav>
    );
  }

  // Top Navigation for Regular Website
  return (
    <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b-2 border-sweet-pink shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="PartyLand Home">
            <div className="text-3xl font-bold bg-gradient-to-r from-sweet-magenta to-sweet-purple bg-clip-text text-transparent">
              🎉 PartyLand
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            <Link
              href="/"
              className="text-foreground hover:text-sweet-magenta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2 rounded"
              aria-current={pathname === "/" ? "page" : undefined}
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/products"
              className="text-foreground hover:text-sweet-magenta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2 rounded"
              aria-current={pathname === "/products" ? "page" : undefined}
            >
              {t("nav.products")}
            </Link>
            <Link
              href="/about"
              className="text-foreground hover:text-sweet-magenta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2 rounded"
              aria-current={pathname === "/about" ? "page" : undefined}
            >
              {t("nav.about")}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart" aria-label={`${t("nav.cart")}${totalItems > 0 ? ` (${totalItems} items)` : ""}`}>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-sweet-pink-light rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                aria-label={`${t("nav.cart")}${totalItems > 0 ? ` (${totalItems} items)` : ""}`}
              >
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-sweet-magenta text-white text-xs rounded-full flex items-center justify-center font-bold" aria-label={`${totalItems} items in cart`}>
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            <LanguageSwitcher />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-sweet-pink-light rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sweet-magenta focus-visible:ring-offset-2"
                      aria-label="Open navigation menu"
                      aria-expanded={mobileOpen}
                      aria-controls="mobile-navigation"
                    >
                      <Menu className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-gradient-to-br from-white via-sweet-pink-light/30 to-sweet-cream border-l-2 border-sweet-pink" id="mobile-navigation">
                    <SheetHeader className="text-left mb-6">
                      <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-sweet-magenta to-sweet-purple bg-clip-text text-transparent flex items-center gap-2">
                        <span className="text-3xl" aria-hidden="true">🎉</span>
                        PartyLand
                      </SheetTitle>
                    </SheetHeader>

                    <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
                      <motion.div
                        key="home"
                        initial={{ opacity: 0, x: 20 }}
                        animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.25, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <MobileNavLink
                          href="/"
                          icon={<Home className="w-5 h-5" />}
                          label={t("nav.home")}
                          active={pathname === "/"}
                          onClick={() => setMobileOpen(false)}
                        />
                      </motion.div>
                      <motion.div
                        key="products"
                        initial={{ opacity: 0, x: 20 }}
                        animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.25, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <MobileNavLink
                          href="/products"
                          icon={<Package className="w-5 h-5" />}
                          label={t("nav.products")}
                          active={pathname === "/products"}
                          onClick={() => setMobileOpen(false)}
                        />
                      </motion.div>
                      <motion.div
                        key="about"
                        initial={{ opacity: 0, x: 20 }}
                        animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.25, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <MobileNavLink
                          href="/about"
                          icon={<Info className="w-5 h-5" />}
                          label={t("nav.about")}
                          active={pathname === "/about"}
                          onClick={() => setMobileOpen(false)}
                        />
                      </motion.div>
                      <motion.div
                        key="cart"
                        initial={{ opacity: 0, x: 20 }}
                        animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.25, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <MobileNavLink
                          href="/cart"
                          icon={<ShoppingCart className="w-5 h-5" />}
                          label={t("nav.cart")}
                          active={pathname === "/cart"}
                          badge={totalItems > 0 ? totalItems : undefined}
                          onClick={() => setMobileOpen(false)}
                        />
                      </motion.div>
                </nav>

                
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 relative px-4 py-2 rounded-2xl transition-all ${
        active
          ? "text-sweet-magenta bg-sweet-pink-light"
          : "text-muted-foreground hover:text-sweet-magenta"
      }`}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-sweet-magenta text-white text-xs rounded-full flex items-center justify-center font-bold">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ease-out ${
        active
          ? "bg-gradient-to-r from-sweet-magenta to-sweet-purple text-white shadow-lg"
          : "bg-white/80 hover:bg-white text-foreground hover:text-sweet-magenta hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
        active ? "bg-white/20" : "bg-sweet-pink-light/50 group-hover:bg-sweet-pink-light"
      }`}>
        {icon}
      </div>
      <span className="font-semibold text-lg flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          active 
            ? "bg-white text-sweet-magenta" 
            : "bg-sweet-magenta text-white"
        }`}>
          {badge}
        </span>
      )}
      {active && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sweet-magenta/10 to-sweet-purple/10 animate-pulse" />
      )}
    </Link>
  );
}