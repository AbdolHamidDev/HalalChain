"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

/* ── Country name → ISO-3166-1 alpha-2 lookup ────────────────── */
const NAME_TO_ISO: Record<string, string> = {
  afghanistan: "AF",
  albania: "AL",
  algeria: "DZ",
  andorra: "AD",
  angola: "AO",
  "antigua and barbuda": "AG",
  argentina: "AR",
  armenia: "AM",
  australia: "AU",
  austria: "AT",
  azerbaijan: "AZ",
  bahamas: "BS",
  bahrain: "BH",
  bangladesh: "BD",
  barbados: "BB",
  belarus: "BY",
  belgium: "BE",
  belize: "BZ",
  benin: "BJ",
  bhutan: "BT",
  bolivia: "BO",
  "bosnia and herzegovina": "BA",
  botswana: "BW",
  brazil: "BR",
  brunei: "BN",
  bulgaria: "BG",
  "burkina faso": "BF",
  burundi: "BI",
  "cabo verde": "CV",
  cambodia: "KH",
  cameroon: "CM",
  canada: "CA",
  "central african republic": "CF",
  chad: "TD",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  comoros: "KM",
  congo: "CG",
  "congo (drc)": "CD",
  "costa rica": "CR",
  "côte d'ivoire": "CI",
  croatia: "HR",
  cuba: "CU",
  cyprus: "CY",
  "czech republic": "CZ",
  denmark: "DK",
  djibouti: "DJ",
  dominica: "DM",
  "dominican republic": "DO",
  ecuador: "EC",
  egypt: "EG",
  "el salvador": "SV",
  "equatorial guinea": "GQ",
  eritrea: "ER",
  estonia: "EE",
  eswatini: "SZ",
  ethiopia: "ET",
  fiji: "FJ",
  finland: "FI",
  france: "FR",
  gabon: "GA",
  gambia: "GM",
  georgia: "GE",
  germany: "DE",
  ghana: "GH",
  greece: "GR",
  grenada: "GD",
  guatemala: "GT",
  guinea: "GN",
  "guinea-bissau": "GW",
  guyana: "GY",
  haiti: "HT",
  honduras: "HN",
  hungary: "HU",
  iceland: "IS",
  india: "IN",
  indonesia: "ID",
  iran: "IR",
  iraq: "IQ",
  ireland: "IE",
  israel: "IL",
  italy: "IT",
  jamaica: "JM",
  japan: "JP",
  jordan: "JO",
  kazakhstan: "KZ",
  kenya: "KE",
  kiribati: "KI",
  "north korea": "KP",
  "south korea": "KR",
  kuwait: "KW",
  kyrgyzstan: "KG",
  laos: "LA",
  latvia: "LV",
  lebanon: "LB",
  lesotho: "LS",
  liberia: "LR",
  libya: "LY",
  liechtenstein: "LI",
  lithuania: "LT",
  luxembourg: "LU",
  madagascar: "MG",
  malawi: "MW",
  malaysia: "MY",
  maldives: "MV",
  mali: "ML",
  malta: "MT",
  "marshall islands": "MH",
  mauritania: "MR",
  mauritius: "MU",
  mexico: "MX",
  micronesia: "FM",
  moldova: "MD",
  monaco: "MC",
  mongolia: "MN",
  montenegro: "ME",
  morocco: "MA",
  mozambique: "MZ",
  myanmar: "MM",
  namibia: "NA",
  nauru: "NR",
  nepal: "NP",
  netherlands: "NL",
  "new zealand": "NZ",
  nicaragua: "NI",
  niger: "NE",
  nigeria: "NG",
  "north macedonia": "MK",
  norway: "NO",
  oman: "OM",
  pakistan: "PK",
  palau: "PW",
  panama: "PA",
  "papua new guinea": "PG",
  paraguay: "PY",
  peru: "PE",
  philippines: "PH",
  poland: "PL",
  portugal: "PT",
  qatar: "QA",
  romania: "RO",
  russia: "RU",
  rwanda: "RW",
  "saint kitts and nevis": "KN",
  "saint lucia": "LC",
  "saint vincent and the grenadines": "VC",
  samoa: "WS",
  "san marino": "SM",
  "são tomé and príncipe": "ST",
  "saudi arabia": "SA",
  senegal: "SN",
  serbia: "RS",
  seychelles: "SC",
  "sierra leone": "SL",
  singapore: "SG",
  slovakia: "SK",
  slovenia: "SI",
  "solomon islands": "SB",
  somalia: "SO",
  "south africa": "ZA",
  "south sudan": "SS",
  spain: "ES",
  "sri lanka": "LK",
  sudan: "SD",
  suriname: "SR",
  sweden: "SE",
  switzerland: "CH",
  syria: "SY",
  taiwan: "TW",
  tajikistan: "TJ",
  tanzania: "TZ",
  thailand: "TH",
  "timor-leste": "TL",
  togo: "TG",
  tonga: "TO",
  "trinidad and tobago": "TT",
  tunisia: "TN",
  turkey: "TR",
  turkmenistan: "TM",
  tuvalu: "TV",
  uganda: "UG",
  ukraine: "UA",
  "united arab emirates": "AE",
  "united kingdom": "GB",
  "united states": "US",
  uruguay: "UY",
  uzbekistan: "UZ",
  vanuatu: "VU",
  "vatican city": "VA",
  venezuela: "VE",
  vietnam: "VN",
  yemen: "YE",
  zambia: "ZM",
  zimbabwe: "ZW",
};

/* ── Coordinates for country markers ──────────────────────────── */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  AF: [67.7, 33.9],
  AL: [20.2, 41.2],
  DZ: [3.0, 28.0],
  AO: [17.9, -11.2],
  AR: [-63.6, -38.4],
  AM: [45.0, 40.1],
  AU: [133.8, -25.3],
  AT: [13.2, 47.5],
  AZ: [47.6, 40.1],
  BD: [90.4, 23.7],
  BY: [28.0, 53.7],
  BE: [4.5, 50.5],
  BJ: [2.3, 9.3],
  BO: [-63.6, -16.3],
  BA: [17.8, 43.9],
  BW: [24.7, -22.3],
  BR: [-51.9, -14.2],
  BN: [114.9, 4.5],
  BG: [25.2, 42.7],
  BF: [-1.6, 12.2],
  BI: [29.9, -3.4],
  KH: [104.9, 12.6],
  CM: [12.4, 5.7],
  CA: [-106.3, 56.1],
  CF: [20.9, 6.6],
  TD: [18.7, 15.5],
  CL: [-71.5, -35.7],
  CN: [104.2, 35.9],
  CO: [-74.3, 4.6],
  CD: [23.7, -2.9],
  CG: [15.8, -0.2],
  CR: [-84.0, 10.0],
  CI: [-5.6, 7.5],
  HR: [15.2, 45.1],
  CU: [-77.8, 21.5],
  CY: [33.4, 35.1],
  CZ: [15.3, 49.8],
  DK: [9.5, 56.3],
  DJ: [42.6, 11.8],
  DO: [-70.0, 19.0],
  EC: [-78.2, -1.8],
  EG: [30.8, 26.8],
  SV: [-88.9, 13.8],
  GQ: [10.3, 1.5],
  ER: [39.8, 15.2],
  EE: [26.0, 58.6],
  ET: [40.5, 9.1],
  FI: [25.7, 64.5],
  FR: [2.2, 46.6],
  GA: [11.6, -0.8],
  GM: [-15.3, 13.4],
  GE: [43.4, 42.3],
  DE: [10.5, 51.2],
  GH: [-1.0, 7.9],
  GR: [22.0, 39.1],
  GT: [-90.2, 15.8],
  GN: [-9.7, 9.9],
  GW: [-15.2, 11.9],
  GY: [-58.9, 4.9],
  HT: [-72.3, 19.0],
  HN: [-86.6, 14.8],
  HU: [19.5, 47.2],
  IS: [-18.1, 64.9],
  IN: [78.9, 20.6],
  ID: [113.9, -2.2],
  IR: [53.7, 32.4],
  IQ: [44.0, 33.0],
  IE: [-8.2, 53.2],
  IL: [35.0, 31.0],
  IT: [12.1, 41.9],
  JM: [-77.3, 18.1],
  JP: [138.3, 36.2],
  JO: [36.9, 31.2],
  KZ: [66.9, 48.1],
  KE: [37.9, -0.0],
  KP: [127.5, 40.3],
  KR: [127.8, 35.9],
  KW: [47.6, 29.3],
  KG: [74.6, 41.2],
  LA: [102.5, 19.9],
  LV: [24.6, 56.9],
  LB: [35.9, 33.9],
  LS: [28.5, -29.5],
  LR: [-9.5, 6.5],
  LY: [17.6, 26.4],
  LI: [9.6, 47.2],
  LT: [23.9, 55.2],
  LU: [6.1, 49.8],
  MG: [46.9, -18.8],
  MW: [34.3, -13.5],
  MY: [101.6, 4.2],
  MV: [73.5, 3.2],
  ML: [-2.0, 17.6],
  MT: [14.4, 35.9],
  MR: [-10.3, 20.3],
  MU: [57.6, -20.3],
  MX: [-102.5, 23.9],
  MD: [28.6, 47.4],
  MN: [103.1, 46.9],
  ME: [19.4, 42.7],
  MA: [-7.0, 32.0],
  MZ: [35.5, -18.7],
  MM: [96.0, 21.9],
  NA: [18.4, -22.9],
  NP: [84.0, 28.4],
  NL: [5.3, 52.1],
  NZ: [174.0, -41.3],
  NI: [-84.9, 12.9],
  NE: [8.0, 17.6],
  NG: [8.1, 8.6],
  MK: [21.7, 41.6],
  NO: [8.5, 62.0],
  OM: [57.0, 21.0],
  PK: [69.3, 30.4],
  PA: [-80.3, 8.5],
  PG: [147.2, -6.3],
  PY: [-58.4, -23.2],
  PE: [-75.0, -9.2],
  PH: [121.8, 12.9],
  PL: [19.1, 52.1],
  PT: [-8.2, 39.7],
  QA: [51.2, 25.3],
  RO: [25.0, 45.9],
  RU: [105.3, 61.5],
  RW: [29.9, -2.0],
  SA: [45.0, 24.0],
  SN: [-14.5, 14.5],
  RS: [21.0, 44.2],
  SL: [-11.8, 8.5],
  SG: [103.8, 1.4],
  SK: [19.7, 48.7],
  SI: [14.9, 46.1],
  SO: [46.2, 5.2],
  ZA: [24.0, -30.6],
  SS: [31.3, 7.9],
  ES: [-3.7, 40.2],
  LK: [80.7, 7.9],
  SD: [30.2, 12.8],
  SR: [-56.0, 3.9],
  SZ: [31.5, -26.5],
  SE: [15.3, 62.2],
  CH: [8.2, 46.8],
  SY: [39.0, 34.8],
  TW: [121.0, 23.7],
  TJ: [71.3, 38.5],
  TZ: [34.9, -6.3],
  TH: [100.8, 15.9],
  TL: [125.7, -8.8],
  TG: [0.8, 8.6],
  TT: [-61.2, 10.7],
  TN: [9.6, 33.9],
  TR: [35.2, 38.9],
  TM: [59.5, 38.9],
  UG: [32.4, 1.3],
  UA: [31.2, 49.0],
  AE: [54.0, 24.0],
  GB: [-3.4, 55.4],
  US: [-98.6, 39.8],
  UY: [-55.8, -32.5],
  UZ: [64.6, 41.8],
  VU: [166.9, -15.4],
  VE: [-66.3, 7.0],
  VN: [106.0, 14.1],
  YE: [48.5, 15.6],
  ZM: [27.8, -13.1],
  ZW: [29.1, -19.0],
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ── Props ──────────────────────────────────────────────────── */
export interface WorldMapProps {
  data: { country: string; count: number }[];
}

/* ── Helper: map country name → ISO code ────────────────────── */
function countryToISO(name: string): string | null {
  const clean = name.toLowerCase().trim();
  return NAME_TO_ISO[clean] ?? null;
}

/* ── Flag emoji from ISO code ───────────────────────────────── */
function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join("");
}

/* ── Heat color from ratio (0→emerald, 0.5→amber, 1→rose) ──── */
function heatColor(ratio: number): string {
  // Deep ocean blues -> emerald -> amber
  const stops: [number, string][] = [
    [0, "rgba(16,185,129,0.12)"],
    [0.15, "rgba(16,185,129,0.25)"],
    [0.35, "rgba(52,211,153,0.35)"],
    [0.5, "rgba(251,191,36,0.30)"],
    [0.7, "rgba(251,146,60,0.35)"],
    [1, "rgba(244,63,94,0.40)"],
  ];
  for (let i = stops.length - 1; i >= 0; i--) {
    if (ratio >= stops[i][0]) return stops[i][1];
  }
  return stops[0][1];
}

/* ── Component ───────────────────────────────────────────────── */
export function WorldMap({ data }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    flag: string;
    count: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const markers = useMemo(() => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    return data
      .map((d) => {
        const iso = countryToISO(d.country);
        if (!iso) return null;
        const coords = COUNTRY_COORDS[iso];
        if (!coords) return null;
        const ratio = d.count / maxCount;
        return {
          iso,
          name: d.country,
          count: d.count,
          coords,
          radius: 5 + ratio * 14,
          opacity: 0.65 + ratio * 0.35,
        };
      })
      .filter(Boolean) as {
      iso: string;
      name: string;
      count: number;
      coords: [number, number];
      radius: number;
      opacity: number;
    }[];
  }, [data]);

  const countryFill = useCallback(
    (name: string) => {
      const iso = countryToISO(name);
      if (!iso) return "#0f1d33";
      const entry = data.find(
        (d) => countryToISO(d.country) === iso
      );
      if (!entry) return "#0f1d33";
      const maxCount = Math.max(...data.map((d) => d.count), 1);
      const ratio = entry.count / maxCount;
      return heatColor(ratio);
    },
    [data]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, marker: (typeof markers)[0]) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setTooltip({
        name: marker.name,
        flag: flagEmoji(marker.iso),
        count: marker.count,
      });
    },
    []
  );

  return (
    <div className="relative h-full w-full">
      {/* Background glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/20" />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 125,
          center: [12, 25],
        }}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#050d1a",
          borderRadius: "0.75rem",
        }}
      >
        <defs>
          {/* Ocean gradient */}
          <radialGradient id="oceanGrad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#0a1a33" />
            <stop offset="50%" stopColor="#060e1f" />
            <stop offset="100%" stopColor="#030812" />
          </radialGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean */}
        <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#oceanGrad)" />

        {/* Graticule lines for satellite feel */}
        <g stroke="#1a2a4a" strokeWidth={0.3} opacity={0.4}>
          <line x1={-5000} y1={0} x2={5000} y2={0} />
          <line x1={-5000} y1={150} x2={5000} y2={150} />
          <line x1={-5000} y1={-150} x2={5000} y2={-150} />
          <line x1={0} y1={-5000} x2={0} y2={5000} />
          <line x1={250} y1={-5000} x2={250} y2={5000} />
          <line x1={-250} y1={-5000} x2={-250} y2={5000} />
        </g>

        {/* Countries */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties?.name ?? "";
              const fill = countryFill(name);
              const isActive = fill !== "#0f1d33";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isActive ? "rgba(52,211,153,0.25)" : "rgba(30,52,86,0.5)"}
                  strokeWidth={isActive ? 0.6 : 0.3}
                  style={{
                    default: { outline: "none", transition: "all 0.3s ease" },
                    hover: {
                      fill: isActive ? "rgba(52,211,153,0.45)" : "#14253d",
                      outline: "none",
                      cursor: isActive ? "pointer" : "default",
                      stroke: isActive ? "rgba(52,211,153,0.6)" : "rgba(30,52,86,0.6)",
                      strokeWidth: isActive ? 1.2 : 0.5,
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Animated marker rings */}
        {markers.map((m) => (
          <g key={`ring-${m.iso}`}>
            {/* Outer expanding ring */}
            <circle
              cx={m.coords[0]}
              cy={m.coords[1]}
              r={m.radius + 6}
              fill="none"
              stroke="rgba(16,185,129,0.15)"
              strokeWidth={1.5}
            >
              <animate
                attributeName="r"
                values={`${m.radius + 4};${m.radius + 14};${m.radius + 4}`}
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

        {/* Markers */}
        {markers.map((m) => (
          <Marker
            key={m.iso}
            coordinates={m.coords}
            onMouseEnter={(e: React.MouseEvent) => handleMouseMove(e, m)}
            onMouseMove={(e: React.MouseEvent) => handleMouseMove(e, m)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Glow */}
            <circle
              r={m.radius + 3}
              fill="rgba(16,185,129,0.2)"
              filter="url(#softGlow)"
              style={{ transition: "r 0.3s ease" }}
            />
            {/* Core */}
            <circle
              r={m.radius}
              fill="url(#oceanGrad)"
              stroke="#34d399"
              strokeWidth={1.5}
              opacity={m.opacity}
              filter="url(#glow)"
              style={{ transition: "r 0.3s ease" }}
            />
            {/* Inner bright spot */}
            <circle
              r={Math.max(2, m.radius * 0.35)}
              fill="#6ee7b7"
              opacity={0.8}
            />
          </Marker>
        ))}
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[100]"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 10,
            transform: "translateY(-50%)",
          }}
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-[#0a1628]/95 px-4 py-2.5 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl">
            <span className="text-xl leading-none drop-shadow-lg">
              {tooltip.flag}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/90">
                {tooltip.name}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {tooltip.count} supplier{tooltip.count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 rounded-xl border border-white/5 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span className="text-[10px] font-medium text-white/60">Low</span>
        </div>
        <div className="h-[1px] w-6 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
          <span className="text-[10px] font-medium text-white/60">High</span>
        </div>
      </div>
    </div>
  );
}