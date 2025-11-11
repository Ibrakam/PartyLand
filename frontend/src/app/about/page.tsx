"use client";

import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { isTelegramWebApp } from "@/lib/telegram";
import Image from "next/image";

export default function AboutPage() {
  const { t } = useLanguage();
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(isTelegramWebApp());
  }, []);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": t("nav.about") || "About Us",
    "description": t("about.description") || "About PartyLand",
    "url": `${siteUrl}/about`,
    "mainEntity": {
      "@type": "Organization",
      "name": "PartyLand",
      "description": t("about.description") || "PartyLand - Your trusted partner for organizing unforgettable children's parties"
    }
  };

  return (
    <div className={`min-h-screen ${isTelegram ? 'pb-20' : ''}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />

      <main className="py-16 px-4 bg-gradient-to-br from-sweet-pink-light via-sweet-pink to-sweet-purple/30">
        <div className="container mx-auto max-w-4xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("nav.about")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("about.subtitle")}
            </p>
          </header>

          <Card className="bg-white rounded-3xl border-2 border-sweet-pink p-8 md:p-12 space-y-6">
            <div className="space-y-6 text-foreground leading-relaxed">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-sweet-magenta mb-4">
                  PARTYLAND — это место, где рождается праздник!
                </h2>
                <p className="text-lg">
                  Мы с любовью создаём атмосферу радости, красоты и волшебства.
                </p>
              </div>

              <div className="space-y-4">
                <p>
                  Основанная в октябре 2021 года, компания PARTYLAND специализируется
                  на продаже воздушных шаров и праздничных товаров для дней рождения
                  и любых торжественных событий.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-lg font-semibold">
                  Каждый клиент для нас — не просто покупатель,
                  а гость большого праздника.
                </p>
                <p className="text-lg font-semibold">
                  Мы дарим не товары, а незабываемые эмоции.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  Наши преимущества:
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-sweet-magenta font-bold mt-1">•</span>
                    <span>доступные цены</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sweet-magenta font-bold mt-1">•</span>
                    <span>высокая скорость обслуживания</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sweet-magenta font-bold mt-1">•</span>
                    <span>дизайнерская атмосфера в европейском стиле</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-sweet-magenta font-bold mt-1">•</span>
                    <span>и главное — искренняя забота о счастье наших клиентов</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-sweet-pink">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎈</span>
                  <div>
                    <p className="font-semibold">Адрес:</p>
                    <p>1-й пр-д Мукими, 23</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🕗</span>
                  <div>
                    <p className="font-semibold">Время работы:</p>
                    <p>ежедневно с 08:00 до 00:00</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

