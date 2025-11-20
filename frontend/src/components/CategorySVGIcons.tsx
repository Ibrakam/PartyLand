"use client";

import React from 'react';

// Компонент красного шарика
const BalloonIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M12 2C9.79 2 8 3.79 8 6c0 2.76 2 5 4 5s4-2.24 4-5c0-2.21-1.79-4-4-4z"
      fill="#FF4757"
    />
    <path
      d="M12 11l-1 8h2l-1-8z"
      fill="#4A4A4A"
      stroke="#333"
      strokeWidth="0.5"
    />
  </svg>
);

// Компонент сердца - заменен на ваш дизайн
const HeartIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {/* Star */}
    <g transform="translate(25, 20)">
      <polygon points="15,0 18.5,11 30,11 20.5,18 24,29 15,22 6,29 9.5,18 0,11 11.5,11" 
               fill="#FF5BA8"/>
    </g>
    
    {/* Star stick */}
    <line x1="40" y1="32" x2="52" y2="65" stroke="#FF5BA8" strokeWidth="3" strokeLinecap="round"/>
    
    {/* Carnival Mask */}
    <g transform="translate(80, 30)">
      {/* Main mask shape */}
      <path d="M 0,40 Q 0,20 20,15 Q 35,12 50,15 Q 70,20 70,40 Q 70,55 60,60 L 55,60 Q 52,65 45,65 Q 38,65 35,60 L 15,60 Q 10,65 5,60 Q 0,55 0,40 Z" 
            fill="#F5E6F5" stroke="#FF5BA8" strokeWidth="2"/>
      
      {/* Left eye hole */}
      <ellipse cx="20" cy="38" rx="10" ry="12" fill="#2D2D2D"/>
      <ellipse cx="22" cy="36" rx="4" ry="5" fill="#FFFFFF" opacity="0.6"/>
      
      {/* Right eye hole */}
      <ellipse cx="50" cy="38" rx="10" ry="12" fill="#2D2D2D"/>
      <ellipse cx="52" cy="36" rx="4" ry="5" fill="#FFFFFF" opacity="0.6"/>
      
      {/* Decorative swirls */}
      <path d="M 10,25 Q 15,18 22,20" fill="none" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 60,25 Q 55,18 48,20" fill="none" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Small decorative dots */}
      <circle cx="8" cy="42" r="2.5" fill="#FF5BA8"/>
      <circle cx="62" cy="42" r="2.5" fill="#FF5BA8"/>
      <circle cx="35" cy="30" r="2" fill="#FF69B4"/>
    </g>
    
    {/* Party Hat */}
    <g transform="translate(40, 100)">
      {/* Hat cone */}
      <path d="M 50,0 L 80,50 Q 75,55 65,55 L 35,55 Q 25,55 20,50 Z" 
            fill="#2D2D2D" opacity="0.9"/>
      
      {/* Hat decorative stripes */}
      <path d="M 48,15 L 73,50 Q 70,52 67,53 L 42,18 Z" fill="#F5E6F5" opacity="0.3"/>
      <path d="M 52,30 L 68,50 Q 65,52 62,53 L 46,33 Z" fill="#FFFFFF" opacity="0.2"/>
      
      {/* Hat brim */}
      <ellipse cx="50" cy="52" rx="30" ry="8" fill="#4A4A4A"/>
      <ellipse cx="50" cy="50" rx="30" ry="8" fill="#2D2D2D"/>
      
      {/* Brim highlight */}
      <path d="M 25,50 Q 35,47 50,47 Q 65,47 75,50" fill="none" stroke="#F5E6F5" 
            strokeWidth="1.5" opacity="0.4"/>
    </g>
    
    {/* Additional decorative elements */}
    <circle cx="170" cy="50" r="4" fill="#FF69B4" opacity="0.6"/>
    <circle cx="160" cy="70" r="3" fill="#FF5BA8" opacity="0.5"/>
    <circle cx="30" cy="150" r="3.5" fill="#FF69B4" opacity="0.5"/>
    <circle cx="180" cy="140" r="3" fill="#F5E6F5"/>
  </svg>
);

// Компонент звезды
const StarIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="#5DA7FF"
    />
  </svg>
);

// Компонент подарка
const GiftIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="10" width="18" height="10" rx="1" fill="#FF4757" />
    <rect x="3" y="8" width="18" height="4" rx="1" fill="#5DA7FF" />
    <path d="M12 8V22" stroke="white" strokeWidth="2" />
    <path
      d="M8 8h8M8 4c0-1.1.9-2 2-2s2 .9 2 2-1.1 2-2 2H8V4zM16 4c0-1.1-.9-2-2-2s-2 .9-2 2 1.1 2 2 2h2V4z"
      stroke="#333"
      strokeWidth="1"
      fill="#FFE5E5"
    />
  </svg>
);

// Компонент маски карнавала - ваш новый дизайн
const MaskIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className}>
    {/* Star */}
    <g transform="translate(25, 20)">
      <polygon points="15,0 18.5,11 30,11 20.5,18 24,29 15,22 6,29 9.5,18 0,11 11.5,11" 
               fill="#FF5BA8"/>
    </g>
    
    {/* Star stick */}
    <line x1="40" y1="32" x2="52" y2="65" stroke="#FF5BA8" strokeWidth="3" strokeLinecap="round"/>
    
    {/* Carnival Mask */}
    <g transform="translate(80, 30)">
      {/* Main mask shape */}
      <path d="M 0,40 Q 0,20 20,15 Q 35,12 50,15 Q 70,20 70,40 Q 70,55 60,60 L 55,60 Q 52,65 45,65 Q 38,65 35,60 L 15,60 Q 10,65 5,60 Q 0,55 0,40 Z" 
            fill="#F5E6F5" stroke="#FF5BA8" strokeWidth="2"/>
      
      {/* Left eye hole */}
      <ellipse cx="20" cy="38" rx="10" ry="12" fill="#2D2D2D"/>
      <ellipse cx="22" cy="36" rx="4" ry="5" fill="#FFFFFF" opacity="0.6"/>
      
      {/* Right eye hole */}
      <ellipse cx="50" cy="38" rx="10" ry="12" fill="#2D2D2D"/>
      <ellipse cx="52" cy="36" rx="4" ry="5" fill="#FFFFFF" opacity="0.6"/>
      
      {/* Decorative swirls */}
      <path d="M 10,25 Q 15,18 22,20" fill="none" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 60,25 Q 55,18 48,20" fill="none" stroke="#FF69B4" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Small decorative dots */}
      <circle cx="8" cy="42" r="2.5" fill="#FF5BA8"/>
      <circle cx="62" cy="42" r="2.5" fill="#FF5BA8"/>
      <circle cx="35" cy="30" r="2" fill="#FF69B4"/>
    </g>
    
    {/* Party Hat */}
    <g transform="translate(40, 100)">
      {/* Hat cone */}
      <path d="M 50,0 L 80,50 Q 75,55 65,55 L 35,55 Q 25,55 20,50 Z" 
            fill="#2D2D2D" opacity="0.9"/>
      
      {/* Hat decorative stripes */}
      <path d="M 48,15 L 73,50 Q 70,52 67,53 L 42,18 Z" fill="#F5E6F5" opacity="0.3"/>
      <path d="M 52,30 L 68,50 Q 65,52 62,53 L 46,33 Z" fill="#FFFFFF" opacity="0.2"/>
      
      {/* Hat brim */}
      <ellipse cx="50" cy="52" rx="30" ry="8" fill="#4A4A4A"/>
      <ellipse cx="50" cy="50" rx="30" ry="8" fill="#2D2D2D"/>
      
      {/* Brim highlight */}
      <path d="M 25,50 Q 35,47 50,47 Q 65,47 75,50" fill="none" stroke="#F5E6F5" 
            strokeWidth="1.5" opacity="0.4"/>
    </g>
    
    {/* Additional decorative elements */}
    <circle cx="170" cy="50" r="4" fill="#FF69B4" opacity="0.6"/>
    <circle cx="160" cy="70" r="3" fill="#FF5BA8" opacity="0.5"/>
    <circle cx="30" cy="150" r="3.5" fill="#FF69B4" opacity="0.5"/>
    <circle cx="180" cy="140" r="3" fill="#F5E6F5"/>
  </svg>
);

// Компонент шапки
const HatIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <ellipse cx="12" cy="18" rx="8" ry="3" fill="#333" />
    <path d="M4 18c0-8 4-12 8-12s8 4 8 12" fill="#FF4757" />
    <circle cx="12" cy="6" r="2" fill="#5DA7FF" />
  </svg>
);

// Компонент помпы/насоса
const PumpIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="8" y="8" width="8" height="12" rx="2" fill="#5DA7FF" />
    <rect x="10" y="6" width="4" height="4" rx="1" fill="#FF4757" />
    <circle cx="12" cy="4" r="2" fill="#333" />
    <path d="M6 12h2M16 12h2M6 16h2M16 16h2" stroke="#333" strokeWidth="1" />
  </svg>
);

// Компонент ленты
const RibbonIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M3 6c0-1 1-2 2-2h14c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2V6z" fill="#FF4757" />
    <path d="M3 14c0-1 1-2 2-2h14c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2v-4z" fill="#5DA7FF" />
    <circle cx="8" cy="8" r="1" fill="white" />
    <circle cx="16" cy="16" r="1" fill="white" />
  </svg>
);

// Компонент торта
const CakeIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="4" y="12" width="16" height="8" rx="1" fill="#FFE5E5" />
    <rect x="4" y="8" width="16" height="4" rx="1" fill="#5DA7FF" />
    <path d="M8 8V5M12 8V5M16 8V5" stroke="#FF4757" strokeWidth="2" />
    <circle cx="8" cy="3" r="1" fill="#FF4757" />
    <circle cx="12" cy="3" r="1" fill="#FF4757" />
    <circle cx="16" cy="3" r="1" fill="#FF4757" />
  </svg>
);

// Компонент цветов
const FlowersIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="8" cy="8" r="3" fill="#FF4757" />
    <circle cx="5" cy="8" r="2" fill="#FF4757" opacity="0.7" />
    <circle cx="11" cy="8" r="2" fill="#FF4757" opacity="0.7" />
    <circle cx="8" cy="5" r="2" fill="#FF4757" opacity="0.7" />
    <circle cx="8" cy="11" r="2" fill="#FF4757" opacity="0.7" />
    <path d="M8 14v6" stroke="#22C55E" strokeWidth="2" />
    <path d="M6 16c1 0 2-1 2-1s1 1 2 1" stroke="#22C55E" strokeWidth="1" fill="none" />
    <circle cx="16" cy="12" r="2" fill="#5DA7FF" />
    <path d="M16 14v6" stroke="#22C55E" strokeWidth="2" />
  </svg>
);

// Мэппинг категорий на иконки
const getCategoryIcon = (categoryName: string, size: string = "w-16 h-16") => {
  const name = categoryName.toLowerCase();
  
  // Более точные совпадения на основе изображений
  if (name.includes('воздушн') && name.includes('латекс')) {
    return <BalloonIcon className={size} />;
  }
  if (name.includes('воздушн') && name.includes('фольг')) {
    return <HeartIcon className={size} />;
  }
  if (name.includes('оборудован') && name.includes('шар')) {
    return <PumpIcon className={size} />;
  }
  if (name.includes('товары') && name.includes('праздник')) {
    return <GiftIcon className={size} />;
  }
  if (name.includes('аксессуар') && name.includes('карнавал')) {
    return <MaskIcon className={size} />;
  }
  if (name.includes('праздничная упаковка')) {
    return <GiftIcon className={size} />;
  }
  if (name.includes('праздничная полиграфия')) {
    return <HeartIcon className={size} />;
  }
  if (name.includes('сервировка')) {
    return <HatIcon className={size} />;
  }
  if (name.includes('флористика')) {
    return <FlowersIcon className={size} />;
  }
  if (name.includes('лент') || name.includes('бант')) {
    return <RibbonIcon className={size} />;
  }
  if (name.includes('гирлянд') || name.includes('освещен') || name.includes('фотозон')) {
    return <StarIcon className={size} />;
  }
  if (name.includes('свеч') || name.includes('фонтан')) {
    return <CakeIcon className={size} />;
  }
  // Общие категории
  if (name.includes('воздушн') || name.includes('шар')) {
    return <BalloonIcon className={size} />;
  }
  if (name.includes('композиц')) {
    return <FlowersIcon className={size} />;
  }
  if (name.includes('товары для')) {
    return <PumpIcon className={size} />;
  }
  if (name.includes('шарик') || name.includes('медвеж')) {
    return <BalloonIcon className={size} />;
  }
  
  // Fallback - красный шарик
  return <BalloonIcon className={size} />;
};

export { getCategoryIcon, BalloonIcon, HeartIcon, StarIcon, GiftIcon, MaskIcon, HatIcon, PumpIcon, RibbonIcon, CakeIcon, FlowersIcon };