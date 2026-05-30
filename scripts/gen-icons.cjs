/* One-off: regenerate Fascino raster icons (favicon.ico, og-image, apple-touch, pwa-*)
   from the brand monogram, replacing leftover Lovable defaults. Run with:
   node scripts/gen-icons.cjs
*/
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIcoMod = require("png-to-ico");
const pngToIco = pngToIcoMod.default || pngToIcoMod;

const BG = "#0a0a0a";
const PINK = "#FC0575";

// Square app-icon monogram (full-bleed dark + pink "F"), parametric by size.
function iconSvg(size, rounded = false) {
  const s = size;
  const rx = rounded ? s * 0.18 : 0;
  // F geometry as a fraction of canvas (matches favicon.svg proportions)
  const x = s * 0.28;
  const top = s * 0.22;
  const bar = s * 0.11;
  const stemH = s * 0.56;
  const topW = s * 0.44;
  const midW = s * 0.31;
  const midY = s * 0.45;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" rx="${rx}" fill="${BG}"/>
      <rect x="${x}" y="${top}" width="${bar}" height="${stemH}" fill="${PINK}"/>
      <rect x="${x}" y="${top}" width="${topW}" height="${bar}" fill="${PINK}"/>
      <rect x="${x}" y="${midY}" width="${midW}" height="${bar * 0.85}" fill="${PINK}"/>
    </svg>`
  );
}

// Social share card 1200x630
function ogSvg() {
  const W = 1200, H = 630;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="${BG}"/>
      <g transform="translate(470,150)">
        <rect x="0" y="0" width="28" height="180" fill="${PINK}"/>
        <rect x="0" y="0" width="150" height="28" fill="${PINK}"/>
        <rect x="0" y="78" width="104" height="24" fill="${PINK}"/>
      </g>
      <text x="600" y="430" text-anchor="middle" fill="#ffffff"
        font-family="Georgia, 'Times New Roman', serif" font-size="72" letter-spacing="14">FASCINO</text>
      <text x="600" y="490" text-anchor="middle" fill="${PINK}"
        font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="8">BY PAYAL</text>
    </svg>`
  );
}

async function png(svg, size, outPath) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  const store = path.resolve(__dirname, "../apps/store/public");
  const admin = path.resolve(__dirname, "../apps/admin/public");

  // PWA + apple icons (admin is the installable PWA)
  await png(iconSvg(512), 512, path.join(admin, "pwa-512x512.png"));
  await png(iconSvg(192), 192, path.join(admin, "pwa-192x192.png"));
  await png(iconSvg(180, true), 180, path.join(admin, "apple-touch-icon.png"));

  // OG images
  await sharp(ogSvg()).png().toFile(path.join(store, "og-image.png"));
  console.log("wrote", path.join(store, "og-image.png"));
  await sharp(ogSvg()).png().toFile(path.join(admin, "og-image.png"));
  console.log("wrote", path.join(admin, "og-image.png"));

  // favicon.ico (multi-size) for both apps
  const ico16 = await sharp(iconSvg(16)).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(iconSvg(32)).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(iconSvg(48)).resize(48, 48).png().toBuffer();
  const ico = await pngToIco([ico16, ico32, ico48]);
  fs.writeFileSync(path.join(store, "favicon.ico"), ico);
  console.log("wrote", path.join(store, "favicon.ico"));
  fs.writeFileSync(path.join(admin, "favicon.ico"), ico);
  console.log("wrote", path.join(admin, "favicon.ico"));
}

main().catch((e) => { console.error(e); process.exit(1); });
