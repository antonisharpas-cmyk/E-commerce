/* ============================================================================
 * Writes the product artwork into public/products/ — front and back for each
 * product in the catalogue, plus the category tiles.
 *
 *     npm run art
 *
 * IT NEVER OVERWRITES A PHOTOGRAPH. Drop `mens-boxy-cotton-tee.jpg` into
 * public/products/ and that photograph wins from then on: this script skips the
 * slug, and the seed prefers the photo. That is the upgrade path — the shop
 * copies its own photography into one folder, and nothing in the code changes.
 * ========================================================================== */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOGUE_ART, CATEGORY_TILES, PHOTO_EXTENSIONS, artDir } from './art-manifest'
import { garmentSvg } from './garment-art'

function hasPhotograph(dir: string, slug: string): string | null {
  for (const ext of PHOTO_EXTENSIONS) {
    if (existsSync(join(dir, `${slug}${ext}`))) return `${slug}${ext}`
  }
  return null
}

function main() {
  const dir = artDir()
  mkdirSync(dir, { recursive: true })

  let drawn = 0
  let skipped = 0

  for (const item of CATALOGUE_ART) {
    const photo = hasPhotograph(dir, item.slug)
    if (photo) {
      console.log(`  · ${item.slug} — keeping ${photo}`)
      skipped++
      continue
    }

    writeFileSync(join(dir, `${item.slug}.svg`), garmentSvg(item.kind, item.colors, 'front'))
    writeFileSync(join(dir, `${item.slug}-back.svg`), garmentSvg(item.kind, item.colors, 'back'))
    drawn++
  }

  for (const tile of CATEGORY_TILES) {
    const name = `category-${tile.key}`
    if (hasPhotograph(dir, name)) {
      skipped++
      continue
    }
    writeFileSync(join(dir, `${name}.svg`), garmentSvg(tile.kind, tile.colors, 'front'))
    drawn++
  }

  const total = readdirSync(dir).length
  console.log(`\n✓ ${drawn} drawn, ${skipped} left alone, ${total} files in public/products\n`)
  console.log('  To use real photography, put <slug>.jpg in that folder and run')
  console.log('  npm run art && npm run db:seed — the photo is used instead.\n')
}

main()
