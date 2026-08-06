// One-off script, not run at build time: `node scripts/generate-icons.mjs`
// Rasterizes scripts/icon.svg (and the -maskable variant) into the PNG sizes
// manifest.json / index.html reference under public/icons.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const outDir = join(root, '..', 'public', 'icons')

await mkdir(outDir, { recursive: true })

const icon = join(root, 'icon.svg')
const iconMaskable = join(root, 'icon-maskable.svg')

const targets = [
  { src: icon, out: 'icon-192.png', size: 192 },
  { src: icon, out: 'icon-512.png', size: 512 },
  { src: iconMaskable, out: 'icon-512-maskable.png', size: 512 },
  { src: icon, out: 'apple-touch-icon.png', size: 180 },
  { src: icon, out: 'favicon-32.png', size: 32 },
]

for (const { src, out, size } of targets) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(join(outDir, out))
  console.log(`wrote public/icons/${out} (${size}x${size})`)
}
