import { Link } from 'react-router-dom'
import { BRANDS, PRODUCTS } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { Reveal, btn } from '../components/ui'
import { IconArrow } from '../components/Icons'

export default function Brands() {
  const { t } = useI18n()

  return (
    <div className="container-x py-12">
      <div className="border-b border-line pb-8">
        <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-brand uppercase">
          <span className="h-px w-7 bg-brand" />
          {t('nav.brands')}
        </p>
        <h1 className="text-[clamp(2.2rem,5.5vw,3.6rem)]">{t('brands.title')}</h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{t('brands.sub')}</p>
      </div>

      <div className="grid gap-4 pt-9 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((b, i) => {
          const n = PRODUCTS.filter((p) => p.brand === b.slug).length
          return (
            <Reveal key={b.slug} delay={i * 50}>
              <Link
                to={`/shop?brand=${b.slug}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[14px] border border-line bg-ink-2 p-7 transition-all hover:-translate-y-1 hover:border-brand/50"
              >
                <span className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <p className="display text-[30px] text-chalk transition-colors group-hover:text-brand">{b.name}</p>
                  <p className="mt-1.5 text-[12.5px] text-muted">{b.tag}</p>
                </div>
                <div className="relative mt-8 flex items-center justify-between">
                  <span className="text-[11.5px] font-bold tracking-[0.16em] text-gold uppercase">
                    {n === 1 ? t('brands.count.one') : t('brands.count', { n })}
                  </span>
                  <IconArrow
                    width={18}
                    height={18}
                    className="text-muted transition-all group-hover:translate-x-1 group-hover:text-brand"
                  />
                </div>
              </Link>
            </Reveal>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Link to="/shop" className={btn.primary}>
          {t('shop.title')} <IconArrow width={17} height={17} />
        </Link>
      </div>
    </div>
  )
}
