"use client";

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-sweet-pink-light via-sweet-pink to-sweet-purple/30">
      <div className="container mx-auto max-w-4xl">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            О нас
          </h2>
          <p className="text-lg text-muted-foreground">
            Место где рождается праздник
          </p>
        </header>

        <Card className="bg-white rounded-3xl border-2 border-sweet-pink p-8 md:p-12 space-y-6">
          <div className="space-y-6 text-foreground leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-sweet-magenta mb-4">
                PARTYLAND — это место, где рождается праздник!
              </h3>
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
              <h4 className="text-xl font-bold text-foreground">
                Наши преимущества:
              </h4>
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

            <div className="space-y-6 pt-6 border-t-2 border-sweet-pink">
              {/* Контактная информация */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-foreground">Контакты</h4>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-sweet-pink/20 rounded-full">
                    <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Адрес:</p>
                    <p>1-й пр-д Мукими, 23</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-sweet-pink/20 rounded-full">
                    <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm1-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Время работы:</p>
                    <p>ежедневно с 08:00 до 00:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-sweet-pink/20 rounded-full">
                    <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Телефон:</p>
                    <p>
                      <a href="tel:+998777777380" className="text-sweet-magenta hover:underline">
                        +998 77 777 73 80
                      </a>
                    </p>
                    <p>
                      <a href="tel:+998777777580" className="text-sweet-magenta hover:underline">
                        +998 77 777 75 80
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Социальные сети */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-foreground">Мы в социальных сетях</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sweet-pink/20 rounded-full">
                      <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.12.24-2.18.67-3.14L12 16.19 19.33 8.86c.43.96.67 2.02.67 3.14 0 4.41-3.59 8-8 8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Telegram Admin:</p>
                      <a 
                        href="https://t.me/Partyland_store_admin" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sweet-magenta hover:underline"
                      >
                        @Partyland_store_admin
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sweet-pink/20 rounded-full">
                      <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Telegram канал:</p>
                      <a 
                        href="https://t.me/partyland_store" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sweet-magenta hover:underline"
                      >
                        @partyland_store
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sweet-pink/20 rounded-full">
                      <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.75 2h8.5C19.43 2 22 4.57 22 7.75v8.5C22 19.43 19.43 22 16.25 22h-8.5C4.57 22 2 19.43 2 16.25v-8.5C2 4.57 4.57 2 7.75 2zm0 1.5c-2.34 0-4.25 1.91-4.25 4.25v8.5c0 2.34 1.91 4.25 4.25 4.25h8.5c2.34 0 4.25-1.91 4.25-4.25v-8.5c0-2.34-1.91-4.25-4.25-4.25h-8.5zM12 6.5c3.03 0 5.5 2.47 5.5 5.5s-2.47 5.5-5.5 5.5-5.5-2.47-5.5-5.5S8.97 6.5 12 6.5zm0 1.5c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm5.75-2.25c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Instagram:</p>
                      <a 
                        href="https://www.instagram.com/partyland_store?igsh=b2xtZTV6bjBxbGY2" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sweet-magenta hover:underline"
                      >
                        @partyland_store
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sweet-pink/20 rounded-full">
                      <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Facebook:</p>
                      <a 
                        href="https://www.facebook.com/share/19mvjspW6Z/?mibextid=wwXIfr" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sweet-magenta hover:underline"
                      >
                        PartyLand Store
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sweet-pink/20 rounded-full">
                      <svg className="w-5 h-5 text-sweet-magenta" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25 4.83 4.83 0 01-7.72 0 4.83 4.83 0 01-3.77 4.25 4.83 4.83 0 01-1.33 6.6 4.83 4.83 0 012.1 4.79 4.83 4.83 0 016.82 2.1 4.83 4.83 0 016.81-2.1 4.83 4.83 0 012.1-4.79 4.83 4.83 0 01-1.33-6.6zM12 17.81A5.81 5.81 0 1117.81 12 5.81 5.81 0 0112 17.81zm0-9.33a3.52 3.52 0 103.52 3.52A3.52 3.52 0 0012 8.48z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">TikTok:</p>
                      <a 
                        href="https://www.tiktok.com/@partyland_store?_t=ZS-90PcqFTwKq0&_r=1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sweet-magenta hover:underline"
                      >
                        @partyland_store
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}