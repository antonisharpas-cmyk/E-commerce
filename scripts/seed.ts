/* ============================================================================
 * Seed data.
 *
 * Categories match spec section 4 exactly. Products are plausible fashion
 * items with real size runs and uneven stock, because that is what exposes
 * bugs — a catalogue where everything has 100 of every size tests nothing.
 *
 * Deliberately includes: a sold-out size, a nearly-sold-out size, an item on
 * sale, an active category promotion, and a promo code. Every one of those is
 * a state the UI has to handle.
 *
 * Idempotent: running it twice wipes and reseeds rather than duplicating.
 * ========================================================================== */

import './load-env'

import { sql } from 'drizzle-orm'
import { db, pool } from '../src/db'
import {
  addresses,
  cartItems,
  carts,
  categories,
  contactRequests,
  deliveryOptions,
  heroBanners,
  inventory,
  inventoryReservations,
  marketingConsents,
  orderItems,
  orders,
  otpCodes,
  payments,
  productImages,
  productVariants,
  productViews,
  products,
  promoCodeUsage,
  promoCodes,
  promotions,
  sessions,
  settings,
  users,
  webhookEvents,
  wishlistItems,
  wishlists,
} from '../src/db/schema'
import { artUrl } from './art-manifest'
import { hashPassword } from '../src/lib/auth/password'
import { seedMissingSettings } from '../src/lib/settings'

/* Product imagery lives in public/products as real files — see
   scripts/generate-art.ts (`npm run art`) and scripts/art-manifest.ts. The seed
   only references them, so dropping a photograph into that folder replaces the
   drawing with no change here. */

/* Hero stand-in. Carries no text — the headline, subtitle and buttons are real
   DOM over the top of it, so anything written into the artwork double-prints.
   Just tone and a little depth so the overlay has something to sit on. */
function heroPlaceholder(w: number, h: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b2e34"/><stop offset="1" stop-color="#0b0c0f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.68" cy="0.32" r="0.55">
      <stop offset="0" stop-color="rgba(255,255,255,.10)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#base)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1.5">
    <path d="M${w * 0.55} 0 L${w} ${h * 0.62}"/>
    <path d="M${w * 0.68} 0 L${w} ${h * 0.44}"/>
    <path d="M${w * 0.42} ${h} L${w} ${h * 0.18}"/>
  </g>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const CATEGORY_TREE = [
  {
    slug: 'men',
    name: { en: 'Men', el: 'Άνδρες', ru: 'Мужчины' },
    children: [
      { slug: 't-shirts', name: { en: 'T-Shirts', el: 'T-Shirts', ru: 'Футболки' } },
      { slug: 'shirts', name: { en: 'Shirts', el: 'Πουκάμισα', ru: 'Рубашки' } },
      { slug: 'hoodies', name: { en: 'Hoodies', el: 'Φούτερ με κουκούλα', ru: 'Худи' } },
      { slug: 'sweatshirts', name: { en: 'Sweatshirts', el: 'Φούτερ', ru: 'Свитшоты' } },
      { slug: 'jackets', name: { en: 'Jackets', el: 'Ζακέτες', ru: 'Куртки' } },
      { slug: 'trousers', name: { en: 'Trousers', el: 'Παντελόνια', ru: 'Брюки' } },
      { slug: 'shorts', name: { en: 'Shorts', el: 'Σορτς', ru: 'Шорты' } },
      { slug: 'accessories', name: { en: 'Accessories', el: 'Αξεσουάρ', ru: 'Аксессуары' } },
    ],
  },
  {
    slug: 'women',
    name: { en: 'Women', el: 'Γυναίκες', ru: 'Женщины' },
    children: [
      { slug: 'tops', name: { en: 'Tops', el: 'Μπλούζες', ru: 'Топы' } },
      { slug: 't-shirts', name: { en: 'T-Shirts', el: 'T-Shirts', ru: 'Футболки' } },
      { slug: 'hoodies', name: { en: 'Hoodies', el: 'Φούτερ με κουκούλα', ru: 'Худи' } },
      { slug: 'sweatshirts', name: { en: 'Sweatshirts', el: 'Φούτερ', ru: 'Свитшоты' } },
      { slug: 'jackets', name: { en: 'Jackets', el: 'Ζακέτες', ru: 'Куртки' } },
      { slug: 'leggings', name: { en: 'Leggings', el: 'Κολάν', ru: 'Леггинсы' } },
      { slug: 'trousers', name: { en: 'Trousers', el: 'Παντελόνια', ru: 'Брюки' } },
      { slug: 'shorts', name: { en: 'Shorts', el: 'Σορτς', ru: 'Шорты' } },
      { slug: 'dresses', name: { en: 'Dresses', el: 'Φορέματα', ru: 'Платья' } },
      { slug: 'accessories', name: { en: 'Accessories', el: 'Αξεσουάρ', ru: 'Аксессуары' } },
    ],
  },
] as const

const APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const ONE_SIZE = ['One size']

type SeedProduct = {
  parent: 'men' | 'women'
  category: string
  slug: string
  name: Record<string, string>
  summary: Record<string, string>
  description: Record<string, string>
  priceCents: number
  salePriceCents?: number
  tone: [string, string]
  colors: { name: Record<string, string>; hex: string }[]
  sizes?: string[]
  /** Per-size stock. Missing sizes get the default. */
  stock?: Record<string, number>
  defaultStock?: number
}

const PRODUCTS: SeedProduct[] = [
  {
    parent: 'men',
    category: 'hoodies',
    slug: 'mens-oversized-heavyweight-hoodie',
    name: {
      en: 'Oversized Heavyweight Hoodie',
      el: 'Oversized Βαρύ Φούτερ',
      ru: 'Худи оверсайз плотное',
    },
    summary: {
      en: '480gsm brushed cotton, dropped shoulder',
      el: 'Βαμβάκι 480gsm, χαμηλή ώμο',
      ru: 'Плотный хлопок 480 г/м², спущенное плечо',
    },
    description: {
      en: 'A genuinely heavy hoodie — 480gsm brushed loopback cotton that holds its shape after washing. Dropped shoulders and a boxy body for the oversized fit, with a double-layer hood and ribbed cuffs that do not stretch out.',
      el: 'Ένα πραγματικά βαρύ φούτερ από βαμβάκι 480gsm που κρατά το σχήμα του. Χαμηλή ώμος, φαρδιά γραμμή, διπλή κουκούλα.',
      ru: 'Действительно плотное худи из хлопка 480 г/м², которое держит форму. Спущенное плечо, свободный крой, двойной капюшон.',
    },
    priceCents: 6900,
    tone: ['#2b2b2b', '#111111'],
    colors: [
      { name: { en: 'Black', el: 'Μαύρο', ru: 'Чёрный' }, hex: '#111111' },
      { name: { en: 'Bone', el: 'Εκρού', ru: 'Кость' }, hex: '#e8e2d9' },
    ],
    stock: { XS: 4, S: 9, M: 12, L: 7, XL: 3, XXL: 0 },
  },
  {
    parent: 'men',
    category: 't-shirts',
    slug: 'mens-boxy-cotton-tee',
    name: { en: 'Boxy Cotton Tee', el: 'Boxy Βαμβακερό T-Shirt', ru: 'Футболка свободного кроя' },
    summary: {
      en: '220gsm combed cotton, slightly cropped',
      el: 'Βαμβάκι 220gsm, ελαφρώς κοντό',
      ru: 'Гребенной хлопок 220 г/м²',
    },
    description: {
      en: 'A boxy tee that keeps its shape. 220gsm combed cotton with a ribbed neck that will not go wavy, cut slightly short in the body so it sits right untucked.',
      el: 'Boxy t-shirt που κρατά το σχήμα του. Βαμβάκι 220gsm με ριμπ λαιμόκοψη.',
      ru: 'Футболка свободного кроя из гребенного хлопка 220 г/м² с рибаной горловиной.',
    },
    priceCents: 2900,
    salePriceCents: 2200,
    tone: ['#f3f1ee', '#ddd8d1'],
    colors: [
      { name: { en: 'White', el: 'Λευκό', ru: 'Белый' }, hex: '#f7f5f2' },
      { name: { en: 'Washed Black', el: 'Ξεβαμμένο Μαύρο', ru: 'Выстиранный чёрный' }, hex: '#2a2a2a' },
    ],
    defaultStock: 14,
    stock: { XS: 1 },
  },
  {
    parent: 'men',
    category: 'trousers',
    slug: 'mens-pleated-wide-trouser',
    name: { en: 'Pleated Wide Trouser', el: 'Παντελόνι με Πιέτες', ru: 'Широкие брюки со складками' },
    summary: {
      en: 'Single pleat, wool-blend, unlined',
      el: 'Μία πιέτα, μείγμα μαλλιού',
      ru: 'Одна складка, шерстяная смесь',
    },
    description: {
      en: 'A single-pleat trouser in a wool blend that drapes rather than clings. Unlined so it wears through a Cyprus spring, with a wide straight leg and a proper hook-and-bar closure.',
      el: 'Παντελόνι με μία πιέτα σε μείγμα μαλλιού. Χωρίς φόδρα, φαρδιά ίσια γραμμή.',
      ru: 'Брюки с одной складкой из шерстяной смеси. Без подкладки, широкая прямая штанина.',
    },
    priceCents: 8900,
    tone: ['#4a4741', '#2f2d29'],
    colors: [{ name: { en: 'Charcoal', el: 'Ανθρακί', ru: 'Угольный' }, hex: '#3a3a3a' }],
    stock: { XS: 0, S: 2, M: 5, L: 5, XL: 2, XXL: 1 },
  },
  {
    parent: 'men',
    category: 'jackets',
    slug: 'mens-cotton-chore-jacket',
    name: { en: 'Cotton Chore Jacket', el: 'Βαμβακερό Chore Jacket', ru: 'Рабочая куртка' },
    summary: { en: 'Three pockets, garment dyed', el: 'Τρεις τσέπες, βαμμένο', ru: 'Три кармана' },
    description: {
      en: 'The jacket you reach for in March. Garment-dyed cotton canvas that softens with wear, three patch pockets that hold a phone without sagging, and corozo buttons.',
      el: 'Βαμβακερό canvas που μαλακώνει με τη χρήση, τρεις τσέπες, κουμπιά corozo.',
      ru: 'Хлопковый канвас, который смягчается при носке, три накладных кармана.',
    },
    priceCents: 11_900,
    tone: ['#5d6552', '#3c4136'],
    colors: [{ name: { en: 'Olive', el: 'Λαδί', ru: 'Оливковый' }, hex: '#5a6150' }],
    defaultStock: 4,
  },
  {
    parent: 'men',
    category: 'shorts',
    slug: 'mens-pleated-short',
    name: { en: 'Pleated Short', el: 'Σορτς με Πιέτες', ru: 'Шорты со складками' },
    summary: { en: '7in inseam, cotton twill', el: 'Βαμβακερό twill', ru: 'Хлопковый твил' },
    description: {
      en: 'A short that is actually cut for sitting down in. Cotton twill, single pleat, seven-inch inseam.',
      el: 'Σορτς από βαμβακερό twill με μία πιέτα.',
      ru: 'Шорты из хлопкового твила с одной складкой.',
    },
    priceCents: 4500,
    tone: ['#b9ac97', '#8e8270' ],
    colors: [{ name: { en: 'Sand', el: 'Άμμος', ru: 'Песочный' }, hex: '#c4b8a4' }],
    defaultStock: 8,
  },
  {
    parent: 'men',
    category: 'accessories',
    slug: 'ribbed-cotton-socks-three-pack',
    name: { en: 'Ribbed Cotton Socks, 3 Pack', el: 'Κάλτσες Ριμπ, 3 Ζεύγη', ru: 'Носки рибана, 3 пары' },
    summary: { en: 'Combed cotton, reinforced heel', el: 'Βαμβάκι, ενισχυμένη φτέρνα', ru: 'Хлопок' },
    description: {
      en: 'Three pairs of ribbed combed-cotton socks with a reinforced heel and toe. Sold as a set because one pair is never the problem.',
      el: 'Τρία ζεύγη κάλτσες ριμπ με ενισχυμένη φτέρνα.',
      ru: 'Три пары носков рибана с усиленной пяткой.',
    },
    priceCents: 1800,
    tone: ['#8d8d8d', '#666666'],
    colors: [{ name: { en: 'Mixed', el: 'Ανάμεικτο', ru: 'Микс' }, hex: '#7a7a7a' }],
    sizes: ONE_SIZE,
    defaultStock: 40,
  },
  {
    parent: 'women',
    category: 'leggings',
    slug: 'womens-sculpt-high-waist-legging',
    name: {
      en: 'Sculpt High-Waist Legging',
      el: 'Κολάν Ψηλόμεσο Sculpt',
      ru: 'Леггинсы с высокой посадкой',
    },
    summary: {
      en: 'Squat-proof, four-way stretch, no front seam',
      el: 'Αδιαφανές, ελαστικό, χωρίς μπροστινή ραφή',
      ru: 'Непрозрачные, эластичные, без переднего шва',
    },
    description: {
      en: 'Opaque under load and genuinely squat-proof — we tested it rather than claiming it. Four-way stretch with a wide waistband that stays up, and no front seam.',
      el: 'Αδιαφανές στην προπόνηση, με φαρδιά μέση που δεν κατεβαίνει, χωρίς μπροστινή ραφή.',
      ru: 'Непрозрачные при нагрузке, широкий пояс не сползает, без переднего шва.',
    },
    priceCents: 5500,
    tone: ['#3a3f4a', '#1f232b'],
    colors: [
      { name: { en: 'Black', el: 'Μαύρο', ru: 'Чёрный' }, hex: '#111111' },
      { name: { en: 'Slate', el: 'Γκρι', ru: 'Сланец' }, hex: '#4a5058' },
    ],
    stock: { XS: 6, S: 11, M: 14, L: 8, XL: 4, XXL: 2 },
  },
  {
    parent: 'women',
    category: 'tops',
    slug: 'womens-ribbed-seamless-top',
    name: { en: 'Ribbed Seamless Top', el: 'Ριμπ Seamless Top', ru: 'Бесшовный топ рибана' },
    summary: { en: 'Seamless knit, medium support', el: 'Seamless πλέξη', ru: 'Бесшовная вязка' },
    description: {
      en: 'Knitted in one piece, so there is nothing to rub. Ribbed for stretch and recovery with medium support and a scoop back.',
      el: 'Πλεγμένο σε ένα κομμάτι, χωρίς ραφές που ενοχλούν. Μέτρια στήριξη.',
      ru: 'Вязаный целиком, без натирающих швов. Средняя поддержка.',
    },
    priceCents: 3500,
    tone: ['#c9a8a0', '#a07f77'],
    colors: [{ name: { en: 'Clay', el: 'Τερακότα', ru: 'Терракота' }, hex: '#b98d83' }],
    stock: { XS: 3, S: 0, M: 6, L: 4, XL: 1, XXL: 0 },
  },
  {
    parent: 'women',
    category: 'dresses',
    slug: 'womens-bias-cut-slip-dress',
    name: { en: 'Bias-Cut Slip Dress', el: 'Φόρεμα Slip σε Λοξή Κοπή', ru: 'Платье-комбинация' },
    summary: { en: 'Bias cut, midi length, lined', el: 'Λοξή κοπή, midi', ru: 'Косой крой, миди' },
    description: {
      en: 'Cut on the bias so it moves with you rather than hanging flat. Midi length, fully lined, adjustable straps.',
      el: 'Λοξή κοπή που ακολουθεί τη κίνηση. Midi μήκος, πλήρως φοδραρισμένο.',
      ru: 'Косой крой, который следует за движением. Длина миди, полная подкладка.',
    },
    priceCents: 7900,
    salePriceCents: 5900,
    tone: ['#8f96a8', '#5f6678'],
    colors: [{ name: { en: 'Storm', el: 'Γκρι-μπλε', ru: 'Грозовой' }, hex: '#78808f' }],
    stock: { XS: 2, S: 3, M: 3, L: 2, XL: 0, XXL: 0 },
  },
  {
    parent: 'women',
    category: 'hoodies',
    slug: 'womens-cropped-hoodie',
    name: { en: 'Cropped Hoodie', el: 'Κοντό Φούτερ', ru: 'Короткое худи' },
    summary: { en: '380gsm, cropped, kangaroo pocket', el: '380gsm, κοντό', ru: '380 г/м², короткое' },
    description: {
      en: 'A cropped hoodie with enough weight to not look thin. 380gsm brushed cotton, ribbed hem that sits at the waist.',
      el: 'Κοντό φούτερ με βάρος 380gsm. Ριμπ τελείωμα στη μέση.',
      ru: 'Короткое худи плотностью 380 г/м². Рибана по низу на линии талии.',
    },
    priceCents: 5200,
    tone: ['#d6cfc4', '#b3aa9c'],
    colors: [{ name: { en: 'Oat', el: 'Μπεζ', ru: 'Овсяный' }, hex: '#ded6c9' }],
    defaultStock: 7,
  },
  {
    parent: 'women',
    category: 'jackets',
    slug: 'womens-quilted-liner-jacket',
    name: { en: 'Quilted Liner Jacket', el: 'Καπιτονέ Ζακέτα', ru: 'Стёганая куртка' },
    summary: { en: 'Diamond quilt, packable', el: 'Καπιτονέ, συμπτυσσόμενο', ru: 'Стёжка ромбом' },
    description: {
      en: 'Light enough to pack into a bag, warm enough for a Larnaca evening in February. Diamond-quilted with a recycled fill.',
      el: 'Ελαφρύ ώστε να μπαίνει στη τσάντα, αρκετά ζεστό για Φεβρουάριο.',
      ru: 'Достаточно лёгкая для сумки и тёплая для февральского вечера.',
    },
    priceCents: 9900,
    tone: ['#6b6256', '#474137'],
    colors: [{ name: { en: 'Moss', el: 'Λαδί', ru: 'Мох' }, hex: '#6a6355' }],
    defaultStock: 3,
  },
  {
    parent: 'women',
    category: 'accessories',
    slug: 'canvas-tote-bag',
    name: { en: 'Heavy Canvas Tote', el: 'Τσάντα Canvas', ru: 'Сумка-шоппер из канваса' },
    summary: { en: '16oz canvas, inner pocket', el: 'Canvas 16oz', ru: 'Канвас 16 oz' },
    description: {
      en: '16oz canvas with taped seams and one inner pocket, so your keys are not at the bottom under everything else.',
      el: 'Canvas 16oz με εσωτερική τσέπη.',
      ru: 'Канвас 16 oz с внутренним карманом.',
    },
    priceCents: 2400,
    tone: ['#cfc6b4', '#a89d87'],
    colors: [{ name: { en: 'Natural', el: 'Φυσικό', ru: 'Натуральный' }, hex: '#d5ccba' }],
    sizes: ONE_SIZE,
    defaultStock: 25,
  },
]

async function wipe() {
  /* Child tables first. */
  await db.delete(webhookEvents)
  await db.delete(payments)
  await db.delete(orderItems)
  await db.delete(promoCodeUsage)
  await db.delete(orders)
  await db.delete(inventoryReservations)
  await db.delete(cartItems)
  await db.delete(carts)
  await db.delete(wishlistItems)
  await db.delete(wishlists)
  await db.delete(productViews)
  await db.delete(inventory)
  await db.delete(productImages)
  await db.delete(productVariants)
  await db.delete(promotions)
  await db.delete(promoCodes)
  await db.delete(products)
  await db.delete(categories)
  await db.delete(contactRequests)
  await db.delete(marketingConsents)
  await db.delete(sessions)
  await db.delete(otpCodes)
  await db.delete(addresses)
  await db.delete(users)
  await db.delete(heroBanners)
  await db.delete(deliveryOptions)
  await db.delete(settings)
}

async function main() {
  console.log('→ clearing existing data')
  await wipe()

  console.log('→ settings')
  await seedMissingSettings()

  console.log('→ categories')
  const categoryIds = new Map<string, string>() // "men/hoodies" -> uuid
  for (const [index, root] of CATEGORY_TREE.entries()) {
    const [parent] = await db
      .insert(categories)
      .values({
        slug: root.slug,
        name: root.name,
        position: index,
        seoTitle: { en: `${root.name.en}'s clothing` },
        isActive: true,
      })
      .returning({ id: categories.id })
    categoryIds.set(root.slug, parent.id)

    for (const [childIndex, child] of root.children.entries()) {
      const [sub] = await db
        .insert(categories)
        .values({
          parentId: parent.id,
          slug: child.slug,
          name: child.name,
          position: childIndex,
          imageUrl: `/products/category-${root.slug}-${child.slug}.svg`,
          isActive: true,
        })
        .returning({ id: categories.id })
      categoryIds.set(`${root.slug}/${child.slug}`, sub.id)
    }
  }
  console.log(`  ${categoryIds.size} categories`)

  console.log('→ products, variants and stock')
  let variantCount = 0
  let unitCount = 0

  for (const spec of PRODUCTS) {
    const categoryId = categoryIds.get(`${spec.parent}/${spec.category}`)
    if (!categoryId) throw new Error(`No category ${spec.parent}/${spec.category}`)

    const [product] = await db
      .insert(products)
      .values({
        categoryId,
        slug: spec.slug,
        name: spec.name,
        summary: spec.summary,
        description: spec.description,
        priceCents: spec.priceCents,
        salePriceCents: spec.salePriceCents ?? null,
        seoTitle: { en: spec.name.en, el: spec.name.el, ru: spec.name.ru },
        seoDescription: {
          en: spec.summary.en,
          el: spec.summary.el,
          ru: spec.summary.ru,
        },
        sizeGuide:
          spec.sizes === ONE_SIZE
            ? null
            : {
                en: 'Chest, cm — XS 86 · S 92 · M 98 · L 104 · XL 112 · XXL 120. Measured flat across the chest and doubled. If you are between sizes, take the larger for an oversized fit.',
                el: 'Στήθος, εκ. — XS 86 · S 92 · M 98 · L 104 · XL 112 · XXL 120.',
                ru: 'Грудь, см — XS 86 · S 92 · M 98 · L 104 · XL 112 · XXL 120.',
              },
        isActive: true,
        publishedAt: new Date(),
      })
      .returning({ id: products.id })

    /* Front and back, from public/products — a photograph if the shop has
       supplied one, otherwise the drawn garment. See scripts/generate-art.ts. */
    await db.insert(productImages).values([
      {
        productId: product.id,
        url: artUrl(spec.slug),
        alt: { en: spec.name.en, el: spec.name.el, ru: spec.name.ru },
        width: 900,
        height: 1200,
        position: 0,
      },
      {
        productId: product.id,
        url: artUrl(spec.slug, true),
        alt: {
          en: `${spec.name.en} — back`,
          el: `${spec.name.el} — πίσω`,
          ru: `${spec.name.ru} — сзади`,
        },
        width: 900,
        height: 1200,
        position: 1,
      },
    ])

    const sizes = spec.sizes ?? APPAREL
    let position = 0

    for (const color of spec.colors) {
      for (const size of sizes) {
        const [variant] = await db
          .insert(productVariants)
          .values({
            productId: product.id,
            sku: `${spec.slug.slice(0, 14).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${color.hex.slice(1, 4).toUpperCase()}-${size.replace(/\s/g, '').toUpperCase()}`,
            size,
            colorName: color.name,
            colorHex: color.hex,
            position: position++,
            isActive: true,
          })
          .returning({ id: productVariants.id })

        const onHand = spec.stock?.[size] ?? spec.defaultStock ?? 5
        await db.insert(inventory).values({
          variantId: variant.id,
          onHand,
          reserved: 0,
          lowStockThreshold: 3,
        })

        variantCount++
        unitCount += onHand
      }
    }
  }
  console.log(`  ${PRODUCTS.length} products, ${variantCount} variants, ${unitCount} units`)

  console.log('→ delivery options')
  await db.insert(deliveryOptions).values([
    {
      kind: 'PICKUP',
      name: { en: 'Collect in store — Larnaca', el: 'Παραλαβή — Λάρνακα', ru: 'Самовывоз — Ларнака' },
      description: {
        en: 'Ready the same afternoon on weekdays.',
        el: 'Έτοιμο το ίδιο απόγευμα τις εργάσιμες.',
        ru: 'Готово в тот же день по будням.',
      },
      priceCents: 0,
      minDays: 0,
      maxDays: 1,
      countries: ['CY'],
      position: 0,
      isActive: true,
    },
    {
      kind: 'SHIPPING',
      name: { en: 'Home delivery', el: 'Παράδοση στο σπίτι', ru: 'Доставка на дом' },
      description: {
        en: 'Anywhere in Cyprus, 2–4 working days.',
        el: 'Σε όλη την Κύπρο, 2–4 εργάσιμες.',
        ru: 'По всему Кипру, 2–4 рабочих дня.',
      },
      priceCents: 500,
      minDays: 2,
      maxDays: 4,
      countries: ['CY'],
      position: 1,
      isActive: true,
    },
  ])

  console.log('→ promotions and a promo code')
  /* Scoped to a SUBcategory on purpose: it proves the category-ancestry walk
     (a hoodie filed under Men → Hoodies is discounted, its siblings under Men
     are not), and it leaves the Men listing showing a realistic mix of
     full-price and reduced product rather than a wall of red badges. */
  const menHoodiesId = categoryIds.get('men/hoodies')!
  await db.insert(promotions).values([
    {
      name: '20% off hoodies',
      scope: 'CATEGORY',
      categoryId: menHoodiesId,
      discountType: 'PERCENTAGE',
      discountValue: 20,
      badgeText: {
        en: '20% OFF HOODIES',
        el: '-20% ΣΤΑ ΦΟΥΤΕΡ',
        ru: '-20% НА ХУДИ',
      },
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      showOnHomepage: true,
      priority: 10,
      isActive: true,
    },
  ])

  await db.insert(promoCodes).values([
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderCents: 3000,
      maxUses: 500,
      maxUsesPerUser: 1,
      startsAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: 'EXPIRED20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ])

  console.log('→ hero banner')
  await db.insert(heroBanners).values({
    title: { en: 'NEW COLLECTION', el: 'ΝΕΑ ΣΥΛΛΟΓΗ', ru: 'НОВАЯ КОЛЛЕКЦИЯ' },
    subtitle: {
      en: 'Built heavier, cut better. The pieces we wear ourselves.',
      el: 'Πιο βαριά υφάσματα, καλύτερη κοπή.',
      ru: 'Плотнее материалы, лучше крой.',
    },
    /* No text in the hero artwork: the headline is a real <h1> over the top of
       it, and a label baked into the image collides with it. Real photography
       replaces these in the admin panel without a deploy. */
    imageUrl: heroPlaceholder(1600, 1000),
    mobileImageUrl: heroPlaceholder(800, 1200),
    primaryCtaLabel: { en: 'Shop Men', el: 'Άνδρες', ru: 'Мужчины' },
    primaryCtaHref: '/men',
    secondaryCtaLabel: { en: 'Shop Women', el: 'Γυναίκες', ru: 'Женщины' },
    secondaryCtaHref: '/women',
    textAlign: 'left',
    position: 0,
    isActive: true,
  })

  console.log('→ admin and test accounts')
  /* Seed credentials are for local development only. The README says to change
     them before any deployment, and the login is rate-limited regardless. */
  /* A known password is fine on a laptop and unacceptable anywhere else, so
     outside development the seed insists on being given one. */
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error(
      'Refusing to seed an admin with a default password. Set SEED_ADMIN_PASSWORD.',
    )
  }
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-in-production'
  await db.insert(users).values([
    {
      email: 'admin@example.com',
      phone: '+35799000001',
      passwordHash: await hashPassword(adminPassword),
      firstName: 'Store',
      lastName: 'Owner',
      role: 'SUPER_ADMIN',
      emailVerifiedAt: new Date(),
    },
    {
      email: 'customer@example.com',
      phone: '+35799000002',
      passwordHash: await hashPassword(adminPassword),
      firstName: 'Elena',
      lastName: 'Georgiou',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date(),
    },
  ])

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(products)

  console.log(`\n✓ seeded — ${count} products live`)
  console.log(`  admin:    admin@example.com / ${adminPassword}`)
  console.log(`  customer: customer@example.com / ${adminPassword}`)
  console.log(`  promo code: WELCOME10 (10% off over €30)\n`)
}

main()
  .catch((err) => {
    console.error('✗ seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
