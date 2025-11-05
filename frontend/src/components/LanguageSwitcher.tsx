"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-sweet-pink-light rounded-full"
          title="Изменить язык / Tilni o'zgartirish"
        >
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLanguage("ru")}
          className={`cursor-pointer ${
            language === "ru"
              ? "bg-sweet-pink-light text-sweet-magenta font-semibold"
              : ""
          }`}
        >
          <span className="mr-2">🇷🇺</span>
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("uz")}
          className={`cursor-pointer ${
            language === "uz"
              ? "bg-sweet-pink-light text-sweet-magenta font-semibold"
              : ""
          }`}
        >
          <span className="mr-2">🇺🇿</span>
          O'zbekcha
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

