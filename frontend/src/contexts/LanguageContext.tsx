"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";

type Language = "ru" | "uz";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ru: {
    "nav.home": "Главная",
    "nav.products": "Товары",
    "nav.about": "О нас",
    "nav.search": "Поиск",
    "nav.cart": "Корзина",
    "nav.favorites": "Избранное",
    "nav.profile": "Профиль",
    "nav.signIn": "Вход",
    "hero.title": "PartyLand",
    "hero.subtitle": "Волшебство каждой вечеринки",
    "hero.badge": "Товары и украшения для праздника",
    "hero.description": "Все что вам нужно для незабываемых детских праздников - от декораций до подарков!",
    "hero.shopNow": "Магазин",
    "hero.viewCatalog": "Каталог",
    "categories.browse": "Категории",
    "categories.description": "Найдите все для идеальной вечеринки",
    "products.featured": "Рекомендуемые товары",
    "products.description": "Наши самые популярные товары",
    "products.found": "Найдено",
    "products.items": "товаров",
    "products.noProductsInCategory": "В этой категории пока нет товаров",
    "categories.all": "Все",
    "custom.badge": "Кастомизация",
    "custom.title": "Создайте свою вечеринку мечты",
    "custom.description": "Разработайте индивидуальный пакет, соответствующий предпочтениям вашего ребенка. Выберите темы, цвета и украшения, чтобы сделать их особенный день незабываемым!",
    "custom.button": "Настроить пакет",
    "about.subtitle": "Добро пожаловать в PartyLand",
    "about.whoWeAre": "О нас",
    "about.description": "PartyLand - это ваш надежный партнер в организации незабываемых детских праздников. Мы предлагаем широкий ассортимент товаров для украшения и проведения вечеринок, от воздушных шаров до полных наборов декораций.",
    "about.ourMission": "Наша миссия",
    "about.missionText": "Мы стремимся сделать каждый детский праздник особенным и незабываемым. Наша цель - предоставить родителям и организаторам праздников все необходимое для создания волшебных моментов, которые будут радовать детей и их гостей.",
    "about.whyChooseUs": "Почему выбирают нас",
    "about.feature1": "Широкий ассортимент качественных товаров для любых тематик праздников",
    "about.feature2": "Доступные цены и регулярные акции",
    "about.feature3": "Быстрая доставка и удобная система заказа",
    "about.feature4": "Индивидуальный подход к каждому клиенту",
    "product.addToCart": "В корзину",
    "product.viewDetails": "Подробнее",
    "product.deliveryNote": "+ доставка",
    "product.quantity": "Количество",
    "product.details": "Описание товара",
    "product.favoriteAdd": "Добавить в избранное",
    "product.favoriteRemove": "Убрать из избранного",
    "product.decreaseQuantity": "Уменьшить количество",
    "product.increaseQuantity": "Увеличить количество",
    "product.totalPricePrefix": "В корзину — ",
    "cart.emptyTitle": "Ваша корзина пуста",
    "cart.emptyDescription": "Похоже, вы ещё не добавили товары для праздника. Давайте подберём что-то волшебное!",
    "cart.startShopping": "Перейти в каталог",
    "cart.title": "Корзина",
    "cart.itemSingular": "товар",
    "cart.itemFew": "товара",
    "cart.itemPlural": "товаров",
    "cart.itemsSuffix": "в вашей корзине",
    "cart.summaryTitle": "Итого",
    "cart.subtotal": "Стоимость товаров",
    "cart.shipping": "Доставка",
    "cart.shippingInfo": "Рассчитывается сервисом Яндекс.Доставки при оформлении",
    "cart.total": "Всего",
    "cart.checkoutButton": "Перейти к оплате",
    "cart.getPaymentLink": "Получить ссылку на оплату",
    "cart.continue": "Продолжить покупки",
    "cart.decreaseQuantity": "Уменьшить количество",
    "cart.increaseQuantity": "Увеличить количество",
    "cart.removeItem": "Удалить из корзины",
    "cart.contactNameLabel": "Ваше имя",
    "cart.contactPhoneLabel": "Телефон или Telegram",
    "cart.contactHint": "Укажите контакт, чтобы администратор смог связаться с вами.",
    "cart.paymentInstructionsTitle": "Как оплатить заказ",
    "cart.paymentInstructionsSubtitle": "Выберите удобный способ оплаты и отправьте чек администратору в Telegram.",
    "cart.paymentInstructionsSummaryTitle": "Состав заказа",
    "cart.paymentInstructionsPayme": "Оплатить через Payme",
    "cart.paymentInstructionsClick": "Оплатить через Click",
    "cart.paymentInstructionsSendReceipt": "После оплаты отправьте чек администратору в Telegram, чтобы мы подтвердили заказ.",
    "cart.paymentInstructionsAdmin": "Администратор: @Partyland_store_admin",
    "cart.notifyError": "Не удалось автоматически отправить уведомление администратору. Пожалуйста, свяжитесь самостоятельно.",
  },
  uz: {
    "nav.home": "Bosh sahifa",
    "nav.products": "Mahsulotlar",
    "nav.about": "Biz haqimizda",
    "nav.search": "Qidirish",
    "nav.cart": "Savatcha",
    "nav.favorites": "Sevimlilar",
    "nav.profile": "Profil",
    "nav.signIn": "Kirish",
    "hero.title": "PartyLand",
    "hero.subtitle": "Har bir bayram uchun mo'jiza",
    "hero.badge": "Bayram uchun tovarlar va bezaklar",
    "hero.description": "Unutulmas bolalar bayramlari uchun barcha kerakli narsalar - bezakdan sovg'gagacha!",
    "hero.shopNow": "Do'kon",
    "hero.viewCatalog": "Katalog",
    "categories.browse": "Kategoriyalar",
    "categories.description": "Mukammal bayram uchun barcha narsalarni toping",
    "products.featured": "Tavsiya etilgan mahsulotlar",
    "products.description": "Bizning eng mashhur mahsulotlarimiz",
    "products.found": "Topildi",
    "products.items": "mahsulotlar",
    "products.noProductsInCategory": "Bu kategoriyada hozircha mahsulotlar yo'q",
    "categories.all": "Barchasi",
    "custom.badge": "Xususiy paketlar",
    "custom.title": "O'zingizning orzudagi bayramingizni yarating",
    "custom.description": "Bolangizning afzalliklariga mos shaxsiy paket yarating. Ularning alohida kunini unutulmas qilish uchun mavzular, ranglar va bezaklarni tanlang!",
    "custom.button": "Paketni sozlash",
    "about.subtitle": "PartyLand-ga xush kelibsiz",
    "about.whoWeAre": "Biz haqimizda",
    "about.description": "PartyLand - bu unutulmas bolalar bayramlarini tashkil etishda ishonchli sherigingiz. Biz bezak va bayramlar o'tkazish uchun keng assortiment mahsulotlar taklif qilamiz, sharlardan to'liq bezak to'plamlarigacha.",
    "about.ourMission": "Bizning missiyamiz",
    "about.missionText": "Biz har bir bolalar bayramini maxsus va unutulmas qilishga intilamiz. Bizning maqsadimiz - ota-onalar va bayramlar tashkilotchilariga bolalar va ularning mehmonlarini xursand qiladigan sehrli lahzalar yaratish uchun zarur bo'lgan barcha narsalarni taqdim etish.",
    "about.whyChooseUs": "Nima uchun bizni tanlashadi",
    "about.feature1": "Har qanday bayram mavzulari uchun sifatli mahsulotlarning keng assortimenti",
    "about.feature2": "Arzon narxlar va muntazam aksiyalar",
    "about.feature3": "Tez yetkazib berish va qulay buyurtma tizimi",
    "about.feature4": "Har bir mijozga individual yondashish",
    "product.addToCart": "Savatga qo'shish",
    "product.viewDetails": "Batafsil",
    "product.deliveryNote": "+ yetkazib berish",
    "product.quantity": "Miqdor",
    "product.details": "Mahsulot tavsifi",
    "product.favoriteAdd": "Sevimlilarga qo'shish",
    "product.favoriteRemove": "Sevimlilardan olib tashlash",
    "product.decreaseQuantity": "Miqdorni kamaytirish",
    "product.increaseQuantity": "Miqdorni oshirish",
    "product.totalPricePrefix": "Savatga qo'shish — ",
    "cart.emptyTitle": "Savatingiz bo'sh",
    "cart.emptyDescription": "Hali hech qanday bayram buyurtmasini qo'shmagansiz. Keling, biror sehrli narsa topamiz!",
    "cart.startShopping": "Katalogga o'tish",
    "cart.title": "Savat",
    "cart.itemSingular": "mahsulot",
    "cart.itemFew": "mahsulot",
    "cart.itemPlural": "mahsulot",
    "cart.itemsSuffix": "savatda",
    "cart.summaryTitle": "Umumiy hisob",
    "cart.subtotal": "Mahsulotlar summasi",
    "cart.shipping": "Yetkazib berish",
    "cart.shippingInfo": "Buyurtma tasdiqlanganda Yandex Delivery tomonidan hisoblanadi",
    "cart.total": "Jami",
    "cart.checkoutButton": "To'lovga o'tish",
    "cart.getPaymentLink": "To'lov havolasini olish",
    "cart.continue": "Xaridni davom etish",
    "cart.decreaseQuantity": "Miqdorni kamaytirish",
    "cart.increaseQuantity": "Miqdorni oshirish",
    "cart.removeItem": "Savatdan olib tashlash",
    "cart.contactNameLabel": "Ismingiz",
    "cart.contactPhoneLabel": "Telefon yoki Telegram",
    "cart.contactHint": "Administrator siz bilan bog'lanishi uchun aloqa ma'lumotini qoldiring.",
    "cart.paymentInstructionsTitle": "Buyurtmani to'lash tartibi",
    "cart.paymentInstructionsSubtitle": "Qulay to'lov usulini tanlang va chekni Telegram orqali administratorga yuboring.",
    "cart.paymentInstructionsSummaryTitle": "Buyurtma tarkibi",
    "cart.paymentInstructionsPayme": "Payme orqali to'lash",
    "cart.paymentInstructionsClick": "Click orqali to'lash",
    "cart.paymentInstructionsSendReceipt": "To'lovdan so'ng chekni Telegramda administratorga yuboring.",
    "cart.paymentInstructionsAdmin": "Administrator: @Partyland_store_admin",
    "cart.notifyError": "Administratorga xabar yuborib bo'lmadi. Iltimos, o'zingiz bog'laning.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ru");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null;
    if (savedLang && (savedLang === "ru" || savedLang === "uz")) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations.ru] || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Возвращаем дефолтные значения если провайдер еще не инициализирован
    return {
      language: "ru" as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}
