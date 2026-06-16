"use client";

import * as React from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countries,
  countryCodeToFlag,
  searchCountries,
  type Country,
} from "@/lib/countries";

interface CountryPickerProps {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function CountryPicker({
  value,
  onChange,
  placeholder = "Select country",
  id,
  required,
  className,
  disabled,
}: CountryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const filtered = query.trim() ? searchCountries(query) : countries;

  // Find the currently selected country
  const selectedCountry = value
    ? countries.find(
        (c) => c.name.toLowerCase() === value.toLowerCase()
      )
    : null;

  // Reset highlight when filter changes
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightedIndex(0);
      // Small delay to ensure the input is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        !target.closest("[data-country-picker]")
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          selectCountry(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  function selectCountry(country: Country) {
    onChange(country.name);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    triggerRef.current?.focus();
  }

  const displayFlag = selectedCountry
    ? countryCodeToFlag(selectedCountry.code)
    : null;

  return (
    <div className={cn("relative", className)} data-country-picker>
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center gap-2",
          "rounded-lg border border-input bg-card px-3.5",
          "text-sm text-foreground shadow-sm",
          "transition-all text-left",
          "hover:border-primary/40",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedCountry && "text-muted-foreground"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-required={required || undefined}
      >
        {displayFlag && (
          <span className="text-base leading-none shrink-0">{displayFlag}</span>
        )}
        <span className="flex-1 truncate">
          {selectedCountry ? selectedCountry.name : placeholder}
        </span>
        {selectedCountry && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleClear}
            className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-[100] mt-1.5 w-full",
            "rounded-xl border border-border bg-popover",
            "shadow-lg overflow-hidden"
          )}
          role="listbox"
        >
          {/* Search input */}
          <div className="sticky top-0 z-10 bg-popover p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search countries..."
                className={cn(
                  "w-full h-9 pl-9 pr-8",
                  "rounded-lg border border-input bg-card",
                  "text-sm text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Country list */}
          <div
            ref={listRef}
            className="max-h-[280px] sm:max-h-[320px] overflow-y-auto overscroll-contain"
          >
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              filtered.map((country, index) => {
                const isSelected =
                  selectedCountry?.code === country.code;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectCountry(country)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5",
                      "text-sm text-left",
                      "transition-colors",
                      "outline-none",
                      isHighlighted && "bg-accent",
                      isSelected && "bg-accent font-medium"
                    )}
                  >
                    <span className="text-lg leading-none shrink-0">
                      {countryCodeToFlag(country.code)}
                    </span>
                    <span className="flex-1 truncate">{country.name}</span>
                    {country.dialCode && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {country.dialCode}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-primary shrink-0">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Count footer */}
          <div className="sticky bottom-0 border-t border-border bg-popover px-3 py-1.5 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "country" : "countries"}
          </div>
        </div>
      )}
    </div>
  );
}