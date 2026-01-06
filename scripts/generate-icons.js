import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const publicDir = join(__dirname, '..', 'public')

console.log('Generating PWA icons...')

try {
  const svg = readFileSync(join(publicDir, 'icon.svg'))

  // Generate regular icons
  console.log('  - icon-192.png')
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'))

  console.log('  - icon-512.png')
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'))

  // Generate maskable icons with background padding
  console.log('  - icon-192-maskable.png')
  await sharp(svg)
    .resize(154, 154)
    .extend({
      top: 19,
      bottom: 19,
      left: 19,
      right: 19,
      background: { r: 59, g: 130, b: 246, alpha: 1 }, // #3b82f6
    })
    .png()
    .toFile(join(publicDir, 'icon-192-maskable.png'))

  console.log('  - icon-512-maskable.png')
  await sharp(svg)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 59, g: 130, b: 246, alpha: 1 }, // #3b82f6
    })
    .png()
    .toFile(join(publicDir, 'icon-512-maskable.png'))

  // Generate Apple touch icon
  console.log('  - apple-touch-icon.png')
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'))

  // Generate favicon (32x32 ICO)
  console.log('  - favicon.ico')
  await sharp(svg).resize(32, 32).png().toFile(join(publicDir, 'favicon.ico'))

  console.log('✓ All icons generated successfully!')
} catch (error) {
  console.error('Error generating icons:', error)
  process.exit(1)
}
