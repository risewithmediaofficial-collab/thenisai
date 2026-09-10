import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const files = fs.readdirSync(publicDir);

async function compressAll() {
  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const file of files) {
    if (!file.endsWith('.jpg') && !file.endsWith('.jpeg') && !file.endsWith('.png')) continue;

    const filePath = path.join(publicDir, file);
    const stat = fs.statSync(filePath);
    const origSize = stat.size;
    totalOriginal += origSize;

    const tmpPath = path.join(publicDir, `_temp_${file}`);

    try {
      await sharp(filePath)
        .resize({ width: 1400, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(tmpPath);

      const newStat = fs.statSync(tmpPath);
      const newSize = newStat.size;
      totalCompressed += newSize;

      fs.unlinkSync(filePath);
      fs.renameSync(tmpPath, filePath);

      const savedPct = Math.round((1 - newSize / origSize) * 100);
      console.log(`✓ ${file}: ${(origSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (-${savedPct}%)`);
    } catch (err) {
      console.error(`Failed to compress ${file}:`, err);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  const totalSavedPct = Math.round((1 - totalCompressed / totalOriginal) * 100);
  console.log(`\n🎉 Total: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB -> ${(totalCompressed / 1024 / 1024).toFixed(2)} MB (Saved ${totalSavedPct}%)`);
}

compressAll();
