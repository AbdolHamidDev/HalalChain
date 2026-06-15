"use client";

import { useTranslation } from "@/i18n/hooks";
import { LOCALE_LABELS } from "@/i18n/config";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLanguage, locales } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            className={lang === locale ? "font-semibold text-primary" : ""}
            onSelect={() => setLanguage(lang)}
          >
            {LOCALE_LABELS[lang as keyof typeof LOCALE_LABELS]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}