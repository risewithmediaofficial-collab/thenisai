/**
 * compress-images.js — Recursive image optimiser for Thenisai
 *
 * - Walks ALL subdirectories under public/
 * - Compresses .jpg / .jpeg / .png in-place (max 1400px wide, quality 80)
 * - Generates a matching .webp sidecar next to each image (~30% smaller)
 *
 * Run: node scripts/compress-images.js
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');

/** Recursively collect all jpg/jpeg/png paths under a directory */
function collectImages(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectImages(fullPath, results);
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function compressAll() {
  const files = collectImages(publicDir);

  if (files.length === 0) {
    console.log('No images found under public/');
    return;
  }

  let totalOriginal = 0;
  let totalCompressed = 0;
  let webpSaved = 0;

  for (const filePath of files) {
    const origSize = fs.statSync(filePath).size;
    totalOriginal += origSize;

    const ext = path.extname(filePath).toLowerCase();
    const tmpPath = filePath.replace(/(\.[^.]+)$/, '_tmp$1');
    const webpPath = filePath.replace(/\.[^.]+$/, '.webp');

    try {
      // ── Re-compress original in-place ─────────────────────────────────────
      const pipeline = sharp(filePath).resize({ width: 1400, withoutEnlargement: true });

      if (ext === '.png') {
        await pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(tmpPath);
      } else {
        await pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(tmpPath);
      }

      const newSize = fs.statSync(tmpPath).size;
      totalCompressed += newSize;
      const savedPct = Math.round((1 - newSize / origSize) * 100);

      fs.unlinkSync(filePath);
      fs.renameSync(tmpPath, filePath);

      // ── Generate .webp sidecar ─────────────────────────────────────────────
      await sharp(filePath)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      webpSaved += newSize - webpSize;

      const rel = path.relative(publicDir, filePath);
      console.log(
        `✓ ${rel}: ${(origSize / 1024).toFixed(1)} KB → ${(newSize / 1024).toFixed(1)} KB (-${savedPct}%) | WebP: ${(webpSize / 1024).toFixed(1)} KB`
      );
    } catch (err) {
      console.error(`✗ Failed: ${filePath}`, err.message);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  const totalSavedPct = Math.round((1 - totalCompressed / totalOriginal) * 100);
  console.log(`
🎉 Images: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB → ${(totalCompressed / 1024 / 1024).toFixed(2)} MB (-${totalSavedPct}%)
🌐 WebP sidecars save an additional ~${(webpSaved / 1024).toFixed(0)} KB over the compressed originals`);
}

compressAll();
