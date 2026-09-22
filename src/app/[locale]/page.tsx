/* ============================================================================
 * Homepage — spec section 2.
 *
 * Hero comes from the `hero_banners` table so the shop owner can change it
 * without a deploy (section 32). An active promotion flagged `showOnHomepage`
 * appears as a strip below it, and the whole promotion block can be switched
 * off with one setting (section 2).
 * ========================================================================== */

import Link from 'next/link'
import { and, desc, eq, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { heroBanners, promotions } from '@/db/schema'
import { BRAND, isLocale, type Locale } from '@/config/brand'
import { getTranslator } from '@/i18n/messages'
import { getCategoryTree, listProducts, t as tr } from '@/lib/catalog'
import { getSetting } from '@/lib/settings'
import { formatMoney } from '@/lib/pricing'
import { ProductCard } from '@/components/ProductCard'
import { ProductMarquee } from '@/components/ProductMarquee'
import { SectionHead } from '@/components/ui'

export const revalidate = 60

async function getHero() {
  const now = new Date()
  const [banner] = await db
    .select()
    .from(heroBanners)
    .where(
      and(
        eq(heroBanners.isActive, true),
        or(isNull(heroBanners.startsAt), lte(heroBanners.startsAt, now)),
        or(isNull(heroBanners.endsAt), sql`${heroBanners.endsAt} > ${now}`),
      ),
    )
    .orderBy(heroBanners.position)
    .limit(1)
  return banner ?? null
}

async function getHomepagePromotion() {
  const enabled = await getSetting('homepage_promotions_enabled')
  if (!enabled) return null

  const now = new Date()
  const [promo] = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        eq(promotions.showOnHomepage, true),
        lte(promotions.startsAt, now),
        or(isNull(promotions.endsAt), sql`${promotions.endsAt} > ${now}`),
      ),
    )
    .orderBy(desc(promotions.priority))
    .limit(1)
  return promo ?? null
}

/** Where "Shop now" on the promotion strip should go.
 *
 *  A promotion can be scoped to a subcategory, so looking only at the root
 *  categories found nothing and silently linked back to the homepage. This
 *  walks both levels and builds the full /men/hoodies path. */
function promotionHref(
  base: string,
  categories: { id: string; slug: string; children: { id: string; slug: string }[] }[],
  categoryId: string | null,
): string {
  if (!categoryId) return `${base}/men`

  for (const root of categories) {
    if (root.id === categoryId) return `${base}/${root.slug}`
    const child = root.children.find((c) => c.id === categoryId)
    if (child) return `${base}/${root.slug}/${child.slug}`
  }
  /* Scoped to something not in the navigation — send them somewhere real. */
  return `${base}/men`
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : BRAND.market.defaultLocale) as Locale
  const t = getTranslator(locale)
  const base = `/${locale}`

  const [hero, promo, categories, newIn, onSale, popular, threshold] = await Promise.all([
    getHero(),
    getHomepagePromotion(),
    getCategoryTree(),
    listProducts({ sort: 'newest', page: 1, perPage: 8, locale }),
    listProducts({ sort: 'newest', page: 1, perPage: 4, onSale: true, locale }),
    /* The moving strip wants enough products that the loop is not obvious. */
    listProducts({ sort: 'popular', page: 1, perPage: 12, locale }),
    getSetting('free_delivery_threshold_cents'),
  ])

  return (
    <>
      {/* ---------------------------------------------------------- hero --- */}
      {hero && (
        <section className="relative">
          <div className="relative min-h-[62vh] overflow-hidden bg-ink md:min-h-[78vh]">
            {hero.videoUrl ? (
              <video
                src={hero.videoUrl}
                poster={hero.imageUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              hero.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={hero.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

            <div className="container-x relative flex min-h-[62vh] items-end pb-14 md:min-h-[78vh] md:items-center md:pb-0">
              <div className="max-w-xl text-paper">
                <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.98] font-semibold tracking-tight">
                  {tr(hero.title, locale)}
                </h1>
                {hero.subtitle && (
                  <p className="mt-4 max-w-md text-[15px] text-white/85 md:text-base">
                    {tr(hero.subtitle, locale)}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  {hero.primaryCtaLabel && hero.primaryCtaHref && (
                    <Link
                      href={`${base}${hero.primaryCtaHref}`}
                      className="inline-flex items-center bg-paper px-7 py-4 label text-ink hover:opacity-90"
                    >
                      {tr(hero.primaryCtaLabel, locale)}
                    </Link>
                  )}
                  {hero.secondaryCtaLabel && hero.secondaryCtaHref && (
                    <Link
                      href={`${base}${hero.secondaryCtaHref}`}
                      className="inline-flex items-center border border-paper px-7 py-4 label text-paper hover:bg-paper hover:text-ink"
                    >
                      {tr(hero.secondaryCtaLabel, locale)}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- promotion --- */}
      {promo && (
        <section className="border-b border-line bg-sale text-paper">
          <div className="container-x flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-4 text-center">
            {/* The badge text, when the shop owner has written one, IS the
                whole message — it already says "20% OFF". Only fall back to
                the internal promotion name plus a computed discount when no
                badge has been written. */}
            <p className="label">
              {promo.badgeText
                ? tr(promo.badgeText, locale)
                : `${promo.name} — ${
                    promo.discountType === 'PERCENTAGE'
                      ? `${promo.discountValue}% off`
                      : `${formatMoney(promo.discountValue, locale)} off`
                  }`}
            </p>
            <Link
              href={promotionHref(base, categories, promo.categoryId)}
              className="label border-b border-paper pb-0.5 hover:opacity-80"
            >
              {t('home.shopNow')}
            </Link>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- categories --- */}
      <section className="container-x py-14">
        <SectionHead title={t('home.categories')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.flatMap((root) =>
            root.children.slice(0, 4).map((child) => (
              <Link
                key={child.id}
                href={`${base}/${root.slug}/${child.slug}`}
                className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden border border-line bg-paper-2 p-4 transition-colors hover:border-ink"
              >
                {/* Artwork when the admin has set one; the tile still works
                    without it, which is how it renders before a shop has
                    uploaded its category imagery. */}
                {child.imageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={child.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                )}
                <span className={`label relative ${child.imageUrl ? 'text-white/70' : 'text-muted'}`}>
                  {tr(root.name, locale)}
                </span>
                <span
                  className={`relative mt-1 text-lg font-semibold tracking-tight ${
                    child.imageUrl ? 'text-white' : ''
                  }`}
                >
                  {tr(child.name, locale)}
                </span>
              </Link>
            )),
          )}
        </div>
      </section>

      {/* --------------------------------------------- the moving strip --- */}
      {popular.items.length > 2 && (
        <section className="border-y border-line py-12">
          <div className="container-x">
            <SectionHead title={t('home.trending')} sub={t('home.trendingSub')} />
          </div>
          {/* Full-bleed: the strip runs off both edges of the screen, which is
              what makes it read as continuous rather than as a boxed widget. */}
          <ProductMarquee products={popular.items} locale={locale} seconds={52} />
        </section>
      )}

      {/* -------------------------------------------------------- new in --- */}
      <section className="container-x pb-14">
        <SectionHead
          title={t('home.newIn')}
          sub={t('home.newInSub')}
          href={`${base}/men`}
          hrefLabel={t('home.viewAll')}
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
          {newIn.items.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              priority={i < 4}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- on sale --- */}
      {onSale.items.length > 0 && (
        <section className="border-t border-line bg-paper-2">
          <div className="container-x py-14">
            <SectionHead title={t('home.onSale')} />
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
              {onSale.items.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- reassurance - */}
      <section className="container-x grid gap-8 py-14 md:grid-cols-3">
        {[
          {
            title: t('footer.delivery'),
            body: t('pdp.deliveryBody', { threshold: formatMoney(threshold, locale) }),
          },
          {
            title: t('footer.returns'),
            body:
              locale === 'el'
                ? 'Επιστροφές εντός 14 ημερών, όπως προβλέπει ο νόμος.'
                : locale === 'ru'
                  ? 'Возврат в течение 14 дней, как требует закон.'
                  : 'Returns within 14 days, as the law requires.',
          },
          {
            title: BRAND.contact.pickupName,
            body: BRAND.contact.openingHours,
          },
        ].map((item) => (
          <div key={item.title} className="border-t border-ink pt-4">
            <h3 className="label">{item.title}</h3>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </>
  )
}
