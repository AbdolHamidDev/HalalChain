// i18n audit script: finds translation keys used in code but missing from locale files
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src");
const LOCALES = path.resolve(__dirname, "../src/i18n/locales");

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function flatten(obj, prefix = "", out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(LOCALES, "en.json"), "utf8"));
const vi = JSON.parse(fs.readFileSync(path.join(LOCALES, "vi.json"), "utf8"));
const enKeys = flatten(en);
const viKeys = flatten(vi);

// Find all t("...") and t('...') and t(`...`) calls (static keys only)
const files = walk(SRC, [".ts", ".tsx"]);
const usedKeys = new Set();
const keyRegex = /\bt\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g;
for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  let m;
  while ((m = keyRegex.exec(content)) !== null) {
    usedKeys.add(m[1]);
  }
}

const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
const missingInVi = [...usedKeys].filter((k) => !viKeys.has(k)).sort();
// keys present in en but missing in vi (translation gaps)
const enNotInVi = [...enKeys].filter((k) => !viKeys.has(k)).sort();
const viNotInEn = [...viKeys].filter((k) => !enKeys.has(k)).sort();

console.log("=== Keys used in code but MISSING in en.json ===");
console.log(missingInEn.length ? missingInEn.join("\n") : "(none)");
console.log("\n=== Keys used in code but MISSING in vi.json ===");
console.log(missingInVi.length ? missingInVi.join("\n") : "(none)");
console.log("\n=== Keys in en.json but MISSING in vi.json ===");
console.log(enNotInVi.length ? enNotInVi.join("\n") : "(none)");
console.log("\n=== Keys in vi.json but MISSING in en.json ===");
console.log(viNotInEn.length ? viNotInEn.join("\n") : "(none)");

console.log("\n=== SUMMARY ===");
console.log("Total used keys:", usedKeys.size);
console.log("Missing in en:", missingInEn.length);
console.log("Missing in vi:", missingInVi.length);

fs.writeFileSync(
  path.join(__dirname, "missing-keys.json"),
  JSON.stringify({ missingInEn, missingInVi }, null, 2)
);


