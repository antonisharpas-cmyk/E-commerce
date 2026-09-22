/* ============================================================================
 * Which garment each product IS, and in what colour.
 *
 * Shared by the artwork generator and the seed, so the two cannot drift: if a
 * product is listed here it gets artwork, and the seed looks for exactly the
 * file the generator wrote.
 * ========================================================================== */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { GarmentKind } from './garment-art'

/** A real photograph in any of these formats beats the drawn artwork. */
export const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

export function artDir() {
  return join(process.cwd(), 'public', 'products')
}

export type ArtItem = {
  slug: string
  kind: GarmentKind
  /** [garment colour, a deeper tone of it] */
  colors: [string, string]
}

export const CATALOGUE_ART: ArtItem[] = [
  { slug: 'mens-oversized-heavyweight-hoodie', kind: 'hoodie', colors: ['#2b2b2b', '#111111'] },
  { slug: 'mens-boxy-cotton-tee', kind: 'tee', colors: ['#f3f1ee', '#ddd8d1'] },
  { slug: 'mens-pleated-wide-trouser', kind: 'trousers', colors: ['#4a4741', '#2f2d29'] },
  { slug: 'mens-cotton-chore-jacket', kind: 'chore-jacket', colors: ['#5d6552', '#3c4136'] },
  { slug: 'mens-pleated-short', kind: 'shorts', colors: ['#b9ac97', '#8e8270'] },
  { slug: 'ribbed-cotton-socks-three-pack', kind: 'socks', colors: ['#8d8d8d', '#666666'] },
  { slug: 'womens-sculpt-high-waist-legging', kind: 'leggings', colors: ['#3a3f4a', '#1f232b'] },
  { slug: 'womens-ribbed-seamless-top', kind: 'top', colors: ['#c9a8a0', '#a07f77'] },
  { slug: 'womens-bias-cut-slip-dress', kind: 'dress', colors: ['#8f96a8', '#5f6678'] },
  { slug: 'womens-cropped-hoodie', kind: 'cropped-hoodie', colors: ['#d6cfc4', '#b3aa9c'] },
  { slug: 'womens-quilted-liner-jacket', kind: 'quilted-jacket', colors: ['#6b6256', '#474137'] },
  { slug: 'canvas-tote-bag', kind: 'tote', colors: ['#cfc6b4', '#a89d87'] },
]

/** The tiles on the homepage: one representative garment per category. */
export const CATEGORY_TILES: { key: string; kind: GarmentKind; colors: [string, string] }[] = [
  { key: 'men-t-shirts', kind: 'tee', colors: ['#dcd7cf', '#b9b2a8'] },
  { key: 'men-shirts', kind: 'shirt', colors: ['#9fa9b4', '#6f7a86'] },
  { key: 'men-hoodies', kind: 'hoodie', colors: ['#33352f', '#1b1c18'] },
  { key: 'men-sweatshirts', kind: 'sweatshirt', colors: ['#7d7468', '#57503f'] },
  { key: 'men-jackets', kind: 'chore-jacket', colors: ['#59614e', '#3a4034'] },
  { key: 'men-trousers', kind: 'trousers', colors: ['#4c4a44', '#2e2c28'] },
  { key: 'men-shorts', kind: 'shorts', colors: ['#b3a68f', '#8a7f6b'] },
  { key: 'men-accessories', kind: 'socks', colors: ['#9a9a9a', '#6e6e6e'] },
  { key: 'women-tops', kind: 'top', colors: ['#c6a49c', '#9c7b73'] },
  { key: 'women-t-shirts', kind: 'tee', colors: ['#e8e2da', '#c4bdb2'] },
  { key: 'women-hoodies', kind: 'cropped-hoodie', colors: ['#d2cabe', '#aca396'] },
  { key: 'women-sweatshirts', kind: 'sweatshirt', colors: ['#8e8377', '#645b50'] },
  { key: 'women-jackets', kind: 'quilted-jacket', colors: ['#6a6155', '#464036'] },
  { key: 'women-leggings', kind: 'leggings', colors: ['#383d47', '#1d2128'] },
  { key: 'women-trousers', kind: 'trousers', colors: ['#6a6459', '#474238'] },
  { key: 'women-shorts', kind: 'shorts', colors: ['#c0b39c', '#968a74'] },
  { key: 'women-dresses', kind: 'dress', colors: ['#8d94a6', '#5d6476'] },
  { key: 'women-accessories', kind: 'tote', colors: ['#ccc2b0', '#a59a84'] },
]

/**
 * The public URL for a product's image: the photograph if the shop has
 * supplied one, otherwise the drawn artwork.
 */
export function artUrl(slug: string, back = false): string {
  const dir = artDir()
  if (!back) {
    for (const ext of PHOTO_EXTENSIONS) {
      if (existsSync(join(dir, `${slug}${ext}`))) return `/products/${slug}${ext}`
    }
  } else {
    for (const ext of PHOTO_EXTENSIONS) {
      if (existsSync(join(dir, `${slug}-back${ext}`))) return `/products/${slug}-back${ext}`
    }
    /* No second photograph? Show the one there is rather than a drawing that
       does not match it. */
    for (const ext of PHOTO_EXTENSIONS) {
      if (existsSync(join(dir, `${slug}${ext}`))) return `/products/${slug}${ext}`
    }
  }
  return `/products/${slug}${back ? '-back' : ''}.svg`
}
