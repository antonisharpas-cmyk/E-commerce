/* ============================================================================
 * THE ONLY FILE THAT KNOWS THE BRAND.
 *
 * Name, contact details, colours, social links. Everything else in the codebase
 * imports from here, so renaming the shop or changing its palette is an edit to
 * this file and nothing else.
 *
 * TODO — replace `name` and `legal` with the real values. Until then the site
 * runs with a placeholder rather than a half-filled brand.
 * ========================================================================== */

export const BRAND = {
  /** Shown in the header, page titles, emails and the footer. */
  name: 'ATELIER',
  /** Used in <title> as "Page · tagline". Keep it short. */
  tagline: 'Fashion, Cyprus',

  /** Appears in the footer. Required of an EU online trader — see LAUNCH notes. */
  legal: {
    companyName: 'TODO Trading Ltd',
    registrationNumber: 'TODO',
    vatNumber: 'TODO',
  },

  contact: {
    email: 'hello@example.com',
    phone: '+357 00 000000',
    whatsapp: '',
    addressLines: ['TODO Street 1', 'Larnaca', 'Cyprus'],
    /* Store pickup point shown at checkout and on the order page. */
    pickupName: 'Larnaca store',
    openingHours: 'Mon–Fri 10:00–19:00 · Sat 10:00–15:00',
  },

  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },

  /* Storefront palette. Deliberately restrained — in fashion retail the product
     photography carries the colour and the interface stays out of its way. */
  theme: {
    ink: '#111111',
    paper: '#ffffff',
    muted: '#6b6b6b',
    line: '#e5e5e5',
    accent: '#111111',
    sale: '#b3261e',
  },

  /** Home market. Drives currency, default phone country code and delivery. */
  market: {
    country: 'CY',
    currency: 'EUR',
    locales: ['en', 'el', 'ru'] as const,
    defaultLocale: 'en' as const,
  },
} as const

export type Locale = (typeof BRAND.market.locales)[number]

export const LOCALES = BRAND.market.locales
export const DEFAULT_LOCALE = BRAND.market.defaultLocale

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  el: 'Ελληνικά',
  ru: 'Русский',
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
