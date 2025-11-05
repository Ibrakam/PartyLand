"use client";

import { useEffect } from "react";

export default function StructuredDataScript() {
  useEffect(() => {
    // Удаляем старый script если есть
    const existingScript = document.getElementById('structured-data-store');
    if (existingScript) {
      existingScript.remove();
    }

    // Создаем новый script с правильным URL
    const siteUrl = window.location.origin;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": "PartyLand",
      "description": "Everything you need for unforgettable children's parties",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`,
      "sameAs": [],
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/products?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "UZS",
        "availability": "https://schema.org/InStock"
      }
    };

    const script = document.createElement('script');
    script.id = 'structured-data-store';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup при размонтировании
      const scriptToRemove = document.getElementById('structured-data-store');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  // На сервере возвращаем null чтобы избежать hydration mismatch
  return null;
}

