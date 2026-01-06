# PWA Icon Generation

The metronome app requires several icon files for PWA installation on iOS and other platforms.

## Required Icons

The following icon files need to be created in the `public/` directory:

- `icon-192.png` - 192x192px PNG icon
- `icon-512.png` - 512x512px PNG icon
- `icon-192-maskable.png` - 192x192px PNG icon with safe zone for maskable icon
- `icon-512-maskable.png` - 512x512px PNG icon with safe zone for maskable icon
- `apple-touch-icon.png` - 180x180px PNG icon for iOS home screen
- `favicon.ico` - 32x32px favicon

## Design Template

A base SVG template is provided in `public/icon.svg` that can be used as a starting point.

## Generating Icons from SVG

### Option 1: Using an Online Tool

1. Go to https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Configure settings for iOS, Android, etc.
4. Download and extract the generated icons to `public/`

### Option 2: Using ImageMagick

If you have ImageMagick installed:

```bash
# Generate regular icons
magick public/icon.svg -resize 192x192 public/icon-192.png
magick public/icon.svg -resize 512x512 public/icon-512.png

# Generate maskable icons (with padding for safe zone)
magick public/icon.svg -resize 154x154 -gravity center -extent 192x192 -background "#3b82f6" public/icon-192-maskable.png
magick public/icon.svg -resize 410x410 -gravity center -extent 512x512 -background "#3b82f6" public/icon-512-maskable.png

# Generate Apple touch icon
magick public/icon.svg -resize 180x180 public/apple-touch-icon.png

# Generate favicon
magick public/icon.svg -resize 32x32 public/favicon.ico
```

### Option 3: Using Node.js with Sharp

Install sharp:

```bash
pnpm add -D sharp
```

Create a script `scripts/generate-icons.js`:

```javascript
import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('public/icon.svg')

// Generate regular icons
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')

// Generate maskable icons with background
await sharp(svg)
  .resize(154, 154)
  .extend({
    top: 19,
    bottom: 19,
    left: 19,
    right: 19,
    background: '#3b82f6',
  })
  .png()
  .toFile('public/icon-192-maskable.png')

await sharp(svg)
  .resize(410, 410)
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: '#3b82f6',
  })
  .png()
  .toFile('public/icon-512-maskable.png')

// Generate Apple touch icon
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
```

Run with:

```bash
node scripts/generate-icons.js
```

## Maskable Icon Safe Zone

For maskable icons, ensure the important content (metronome shape) stays within the safe zone:

- For 192x192: Keep content within central 154x154 area (80% of size)
- For 512x512: Keep content within central 410x410 area (80% of size)

This ensures the icon displays correctly on devices that apply circular or rounded square masks.

## Testing PWA Installation

### On iOS Safari

1. Build the app: `pnpm run build`
2. Serve the built app: `pnpm run preview`
3. Open in iOS Safari
4. Tap the Share button
5. Select "Add to Home Screen"
6. Verify the icon appears correctly

### On Desktop Chrome

1. Build and serve the app
2. Open in Chrome
3. Click the install icon in the address bar
4. Verify installation works

## Current Status

⚠️ **TODO**: Generate the required PNG icons from the SVG template. The app will work without these but won't install as a PWA properly until icons are generated.

Temporary placeholder icons can be created as solid colored squares for testing:

```bash
# Create temporary 192x192 blue square
convert -size 192x192 xc:"#3b82f6" public/icon-192.png

# Create temporary 512x512 blue square
convert -size 512x512 xc:"#3b82f6" public/icon-512.png

# Etc.
```
