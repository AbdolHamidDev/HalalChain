/**
 * Returns a flag emoji for a given country name.
 * Supports common countries found in SEA halal supply chains and beyond.
 * Falls back to 🌐 if the country is not recognized.
 */
export function countryFlag(country: string): string {
  const map: Record<string, string> = {
    // Southeast Asia
    malaysia: "🇲🇾",
    indonesia: "🇮🇩",
    thailand: "🇹🇭",
    singapore: "🇸🇬",
    vietnam: "🇻🇳",
    "viet nam": "🇻🇳",
    philippines: "🇵🇭",
    myanmar: "🇲🇲",
    cambodia: "🇰🇭",
    laos: "🇱🇦",
    brunei: "🇧🇳",
    "timor-leste": "🇹🇱",
    // East Asia
    china: "🇨🇳",
    japan: "🇯🇵",
    "south korea": "🇰🇷",
    korea: "🇰🇷",
    taiwan: "🇹🇼",
    "hong kong": "🇭🇰",
    // South Asia
    india: "🇮🇳",
    pakistan: "🇵🇰",
    bangladesh: "🇧🇩",
    "sri lanka": "🇱🇰",
    nepal: "🇳🇵",
    // Middle East
    "saudi arabia": "🇸🇦",
    uae: "🇦🇪",
    "united arab emirates": "🇦🇪",
    turkey: "🇹🇷",
    iran: "🇮🇷",
    iraq: "🇮🇶",
    egypt: "🇪🇬",
    jordan: "🇯🇴",
    kuwait: "🇰🇼",
    qatar: "🇶🇦",
    bahrain: "🇧🇭",
    oman: "🇴🇲",
    // Europe
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    germany: "🇩🇪",
    france: "🇫🇷",
    netherlands: "🇳🇱",
    italy: "🇮🇹",
    spain: "🇪🇸",
    // Americas
    "united states": "🇺🇸",
    usa: "🇺🇸",
    us: "🇺🇸",
    canada: "🇨🇦",
    brazil: "🇧🇷",
    // Africa
    nigeria: "🇳🇬",
    "south africa": "🇿🇦",
    morocco: "🇲🇦",
    // Oceania
    australia: "🇦🇺",
    "new zealand": "🇳🇿",
  };

  const flag = map[country.trim().toLowerCase()];
  return flag ?? "🌐";
}
