import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../assets/curvex-mark.svg', import.meta.url));
const output = fileURLToPath(new URL('../assets/icon.png', import.meta.url));
await mkdir(fileURLToPath(new URL('../assets/', import.meta.url)), { recursive: true });
await sharp(svg).resize(1024, 1024).png().toFile(output);
console.log('Generated 1024x1024 Curvex app icon.');
