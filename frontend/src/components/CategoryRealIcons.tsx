"use client";

import Image from "next/image";

// Мэппинг категорий на реальные иконки с сайта donballon.ru
const getCategoryRealIcon = (categoryName: string, size: string = "w-16 h-16") => {
  const name = categoryName.toLowerCase();
  
  // Создаем базовый URL для иконок (можно разместить их на CDN или в /public/icons/)
  const iconBase = "/category-icons/";
  
  let iconPath = "";
  
  // Более точные совпадения на основе названий файлов
  if (name.includes('воздушн') && name.includes('латекс')) {
    iconPath = "Vozdushnye-shary-iz-lateksa.png";
  }
  else if (name.includes('воздушн') && name.includes('фольг')) {
    iconPath = "Vozdushnye-shary-iz-folgi.png";
  }
  else if (name.includes('оборудован') && name.includes('шар')) {
    iconPath = "Oborudovanie-dlya-sharov.png";
  }
  else if (name.includes('товары') && name.includes('праздник')) {
    iconPath = "Tovary-dlya-prazdnika.png";
  }
  else if (name.includes('аксессуар') && name.includes('карнавал')) {
    iconPath = "Aksessuary-dlya-karnavala.png";
  }
  else if (name.includes('праздничная упаковка') || name.includes('упаковк')) {
    iconPath = "Prazdnichnaya-upakovka.png";
  }
  else if (name.includes('праздничная полиграфия') || name.includes('полиграф')) {
    iconPath = "Prazdnichnaya-poligrafiya.png";
  }
  else if (name.includes('сервировка') || name.includes('стол')) {
    iconPath = "Servirovka-stola.png";
  }
  else if (name.includes('флористика')) {
    iconPath = "Floristika.png";
  }
  else if (name.includes('лент') || name.includes('бант')) {
    iconPath = "Lenty-i-banty.png";
  }
  else if (name.includes('гирлянд') || name.includes('освещен') || name.includes('фотозон')) {
    iconPath = "Girlyandy_-osveshchenie_-fotozony.png";
  }
  else if (name.includes('свеч') || name.includes('фонтан')) {
    iconPath = "Svechi-i-fontany.png";
  }
  // Общие категории
  else if (name.includes('воздушн') || name.includes('шар')) {
    iconPath = "Vozdushnye-shary-iz-lateksa.png"; // fallback для шаров
  }
  else if (name.includes('композиц')) {
    iconPath = "Floristika.png";
  }
  else if (name.includes('товары для')) {
    iconPath = "Tovary-dlya-prazdnika.png";
  }
  else {
    // Fallback - воздушные шары
    iconPath = "Vozdushnye-shary-iz-lateksa.png";
  }

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <Image
        src={iconBase + iconPath}
        alt={categoryName}
        fill
        className="object-contain"
        sizes="64px"
      />
    </div>
  );
};

export { getCategoryRealIcon };