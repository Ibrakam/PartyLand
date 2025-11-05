"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for safe animation values that respect reduced motion
 * @returns object with animation configs
 */
export function useReducedMotionSafe() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    // Default animation configs
    default: {
      duration: prefersReducedMotion ? 0 : 0.2,
      ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    },
    // Micro animations (150-220ms)
    micro: {
      duration: prefersReducedMotion ? 0 : 0.18,
      ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    },
    // Page transitions
    page: {
      duration: prefersReducedMotion ? 0 : 0.3,
      ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    },
  };
}

