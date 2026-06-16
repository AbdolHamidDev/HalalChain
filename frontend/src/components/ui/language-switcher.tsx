"use client";

import { useTranslation } from "@/i18n/hooks";
import { LOCALE_LABELS, LOCALE_FLAGS } from "@/i18n/config";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((lang) => {
          const isActive = lang === locale;
          const flag = LOCALE_FLAGS[lang as keyof typeof LOCALE_FLAGS] ?? "";
          const label = LOCALE_LABELS[lang as keyof typeof LOCALE_LABELS] ?? lang;
          return (
            <DropdownMenuItem
              key={lang}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isActive && "font-semibold text-primary bg-primary/5"
              )}
              onSelect={() => setLanguage(lang)}
            >
              <span className="text-base leading-none">{flag}</span>
              <span className="flex-1">{label}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}