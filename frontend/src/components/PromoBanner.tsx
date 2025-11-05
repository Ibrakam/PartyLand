"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion";

interface BannerSlide {
  id: number;
  image: string;
  title: string;
  subtitle?: string;
}

interface PromoBannerProps {
  slides?: BannerSlide[];
}

const defaultSlides: BannerSlide[] = [
  {
    id: 1,
    image: "https://cdn.pixabay.com/photo/2022/11/03/19/00/birthday-7568225_1280.png",
    title: "АКЦИЯ НА ВСЕ ТОВАРЫ",
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/4684378/pexels-photo-4684378.jpeg",
    title: "НОВИНКИ СЕЗОНА",
  },
  {
    id: 3,
    image: "https://cdn.pixabay.com/photo/2022/01/22/15/30/cake-6957626_1280.jpg",
    title: "СКИДКИ ДО 50%",
  },
];

export function PromoBanner({ slides = defaultSlides }: PromoBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { prefersReducedMotion, default: defaultAnim } = useReducedMotionSafe();

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

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-sweet-pink-light to-sweet-purple/30">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -100 }}
          transition={{ duration: defaultAnim.duration, ease: defaultAnim.ease }}
          className="absolute inset-0"
        >
          <Image
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            fill
            className="object-cover"
            priority={currentSlide === 0}
            loading={currentSlide === 0 ? undefined : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sweet-magenta/80 via-sweet-magenta/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 md:px-12">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {slides[currentSlide].title}
              </h2>
              {slides[currentSlide].subtitle && (
                <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                  {slides[currentSlide].subtitle}
                </p>
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

