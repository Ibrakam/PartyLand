"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";
import Link from "next/link";

interface BannerSlide {
  id: number;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
}

interface PromoBannerProps {
  slides?: BannerSlide[];
}

const defaultSlides: BannerSlide[] = [
  {
    id: 1,
    title: "НОВОГОДНЯЯ коллекция",
    subtitle: "Шары, гирлянды, костюмы и карнавальные аксессуары",
    buttonText: "Смотреть",
    buttonLink: "/products",
  },
  {
    id: 2,
    title: "НОВИНКИ СЕЗОНА",
    subtitle: "Самые актуальные товары для праздников",
    buttonText: "Смотреть",
    buttonLink: "/products",
  },
  {
    id: 3,
    title: "СКИДКИ ДО 50%",
    subtitle: "Специальные предложения на все товары",
    buttonText: "Смотреть",
    buttonLink: "/products",
  },
];

export function PromoBanner({ slides = defaultSlides }: PromoBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { prefersReducedMotion, default: defaultAnim } = useReducedMotionSafe();

  // Генерируем фиксированные позиции снежинок для избежания hydration mismatch
  const snowflakePositions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      left: (i * 17.3) % 100, // Используем детерминированные значения
      top: (i * 23.7) % 100,
      duration: 3 + (i % 3) * 0.5,
    }));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-sweet-pink via-sweet-magenta to-sweet-purple">
      {/* Снежинки декоративные */}
      <div className="absolute inset-0 pointer-events-none">
        {snowflakePositions.map((pos, i) => (
          <span
            key={i}
            className="absolute text-white/30 text-2xl"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animation: `float ${pos.duration}s ease-in-out infinite`,
            }}
            suppressHydrationWarning
          >
            ✱
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -100 }}
          transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease }}
          className="absolute inset-0 flex items-center"
        >
          <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="flex items-center justify-between">
              {/* Текст слева */}
              <div className="flex-1 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                  {currentSlideData.title}
                </h2>
                {currentSlideData.subtitle && (
                  <p className="text-lg md:text-xl text-white/95 mb-6 drop-shadow-md">
                    {currentSlideData.subtitle}
                  </p>
                )}
                {currentSlideData.buttonText && currentSlideData.buttonLink && (
                  <Link href={currentSlideData.buttonLink}>
                    <Button
                      size="lg"
                      className="bg-white hover:bg-sweet-pink-light text-sweet-magenta rounded-full px-8 py-6 text-lg font-semibold shadow-lg border-2 border-white/50 hover:border-white transition-all"
                    >
                      {currentSlideData.buttonText}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Изображение справа (если есть) */}
              {currentSlideData.image && (
                <div className="hidden md:block flex-1 max-w-md">
                  <div className="relative w-full h-64">
                    {/* Здесь можно добавить изображение */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2 items-center">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all touch-manipulation ${
              index === currentSlide
                ? "bg-white w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3"
                : "bg-white/50 hover:bg-white/75 w-1.5 h-1.5 sm:w-2 sm:h-2"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
}

