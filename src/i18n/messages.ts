/* ============================================================================
 * UI COPY — spec section 3. English, Greek, Russian.
 *
 * All interface text lives here, never inline in a component. Product names and
 * descriptions are translated separately, in the database (JSONB per locale),
 * because the shop owner edits those and a developer edits these.
 *
 * A hand-rolled dictionary rather than a full i18n library: the whole surface
 * is a `t(key)` lookup plus `{placeholder}` substitution, and the type checker
 * catches a missing key at build time, which a runtime library cannot.
 * ========================================================================== */

import type { Locale } from '@/config/brand'

export const messages = {
  en: {
    /* --- chrome --- */
    'nav.men': 'Men',
    'nav.women': 'Women',
    'nav.search': 'Search',
    'nav.searchPlaceholder': 'Search for a product or SKU',
    'nav.account': 'Account',
    'nav.bag': 'Bag',
    'nav.wishlist': 'Wishlist',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.allIn': 'All {category}',
    'nav.language': 'Language',

    /* --- home --- */
    'home.shopMen': 'Shop Men',
    'home.shopWomen': 'Shop Women',
    'home.newIn': 'New in',
    'home.newInSub': 'The latest pieces, added this week.',
    'home.onSale': 'On sale',
    'home.shopNow': 'Shop now',
    'home.viewAll': 'View all',
    'home.categories': 'Shop by category',

    /* --- listing --- */
    'list.results': 'one:{n} product|other:{n} products',
    'list.noResults': 'Nothing matches those filters.',
    'list.clearFilters': 'Clear filters',
    'list.filters': 'Filters',
    'list.sort': 'Sort',
    'list.sort.newest': 'Newest',
    'list.sort.priceAsc': 'Price: low to high',
    'list.sort.priceDesc': 'Price: high to low',
    'list.sort.nameAsc': 'Name: A to Z',
    'list.sort.popular': 'Most viewed',
    'list.size': 'Size',
    'list.price': 'Price',
    'list.maxPrice': 'Up to {price}',
    'list.inStockOnly': 'In stock only',
    'list.onSaleOnly': 'On sale only',
    'list.searchResultsFor': 'Results for “{q}”',
    'list.page': 'Page {page} of {total}',
    'list.previous': 'Previous',
    'list.next': 'Next',

    /* --- product card --- */
    'card.soldOut': 'Sold out',
    'card.saleBadge': '−{percent}%',
    'card.addToWishlist': 'Save for later',
    'card.quickAdd': 'Quick add',

    /* --- product page --- */
    'pdp.selectSize': 'Select a size',
    'pdp.sizeRequired': 'Choose a size first.',
    'pdp.sizeGuide': 'Size guide',
    'pdp.addToBag': 'Add to bag',
    'pdp.adding': 'Adding…',
    'pdp.added': 'Added to bag',
    'pdp.soldOut': 'Sold out',
    'pdp.outOfStockSize': 'Sold out in {size}',
    'pdp.lowStock': 'Only {n} left',
    'pdp.inStock': 'In stock',
    'pdp.notifyMe': 'Email me when it is back',
    'pdp.quantity': 'Quantity',
    'pdp.sku': 'SKU',
    'pdp.colour': 'Colour',
    'pdp.description': 'Details',
    'pdp.delivery': 'Delivery & returns',
    'pdp.deliveryBody':
      'Collect free in Larnaca, or island-wide delivery in 2–4 working days. Free over {threshold}.',
    'pdp.related': 'You might also like',
    'pdp.recentlyViewed': 'Recently viewed',
    'pdp.reserved': 'Held in your bag for {minutes} minutes',

    /* --- cart --- */
    'cart.title': 'Your bag',
    'cart.empty': 'Your bag is empty.',
    'cart.emptyCta': 'Start shopping',
    'cart.item': 'item',
    'cart.items': 'items',
    'cart.itemCount': 'one:{n} item|other:{n} items',
    'cart.remove': 'Remove',
    'cart.subtotal': 'Subtotal',
    'cart.discount': 'Discount',
    'cart.promoDiscount': 'Promo code',
    'cart.delivery': 'Delivery',
    'cart.free': 'Free',
    'cart.total': 'Total',
    'cart.vatIncluded': 'incl. VAT {amount}',
    'cart.checkout': 'Checkout',
    'cart.continueShopping': 'Continue shopping',
    'cart.promoPlaceholder': 'Promo code',
    'cart.applyPromo': 'Apply',
    'cart.removePromo': 'Remove',
    'cart.spendMoreForFree': 'Spend {amount} more for free delivery',
    'cart.freeDeliveryUnlocked': 'Free delivery unlocked',
    'cart.heldFor': 'Items are held for {minutes} minutes',
    'cart.expired': 'Your reservation expired and the bag was updated.',
    'cart.lineUnavailable': 'Only {n} available — please reduce the quantity.',
    'cart.updating': 'Updating…',

    /* --- errors, section 41 --- */
    'err.outOfStock': 'This product is currently out of stock.',
    'err.reservationExpired': 'Your reservation has expired.',
    'err.promoExpired': 'This promo code has expired.',
    'err.emailTaken': 'This email address is already registered.',
    'err.phoneTaken': 'This phone number is already registered.',
    'err.paymentFailed': 'Your payment could not be completed.',
    'err.sessionExpired': 'Your session has expired.',
    'err.generic': 'Something went wrong. Please try again.',
    'err.network': 'We could not reach the shop. Check your connection.',
    'err.notFound': 'We could not find that page.',

    /* --- account --- */
    'auth.signIn': 'Sign in',
    'auth.signOut': 'Sign out',
    'auth.createAccount': 'Create an account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.firstName': 'First name',
    'auth.lastName': 'Last name',
    'auth.phone': 'Mobile number',
    'auth.verifyTitle': 'Check your email',
    'auth.verifyBody': 'We sent a 6-digit code to {email}. It expires in 10 minutes.',
    'auth.code': 'Verification code',
    'auth.verify': 'Verify',
    'auth.resend': 'Send a new code',
    'auth.marketingOptIn': 'I would like to receive updates, offers and promotions by email.',
    'auth.marketingNote': 'Optional. You can change this at any time.',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': 'New here?',

    /* --- footer --- */
    'footer.help': 'Help',
    'footer.contact': 'Contact us',
    'footer.delivery': 'Delivery',
    'footer.returns': 'Returns',
    'footer.trackOrder': 'Track my order',
    'footer.about': 'About',
    'footer.terms': 'Terms & conditions',
    'footer.privacy': 'Privacy policy',
    'footer.company': 'Company',
    'footer.vat': 'VAT',
    'footer.rights': 'All rights reserved.',
    'footer.newsletter': 'Get new arrivals first',
    'footer.newsletterCta': 'Sign up',
  },

  el: {
    'nav.men': 'Άνδρες',
    'nav.women': 'Γυναίκες',
    'nav.search': 'Αναζήτηση',
    'nav.searchPlaceholder': 'Αναζήτηση προϊόντος ή SKU',
    'nav.account': 'Λογαριασμός',
    'nav.bag': 'Τσάντα',
    'nav.wishlist': 'Λίστα επιθυμιών',
    'nav.menu': 'Μενού',
    'nav.close': 'Κλείσιμο',
    'nav.allIn': 'Όλα σε {category}',
    'nav.language': 'Γλώσσα',

    'home.shopMen': 'Άνδρες',
    'home.shopWomen': 'Γυναίκες',
    'home.newIn': 'Νέες αφίξεις',
    'home.newInSub': 'Τα τελευταία κομμάτια αυτής της εβδομάδας.',
    'home.onSale': 'Σε προσφορά',
    'home.shopNow': 'Αγόρασε τώρα',
    'home.viewAll': 'Δες όλα',
    'home.categories': 'Αγορά ανά κατηγορία',

    'list.results': 'one:{n} προϊόν|other:{n} προϊόντα',
    'list.noResults': 'Κανένα προϊόν με αυτά τα φίλτρα.',
    'list.clearFilters': 'Καθαρισμός φίλτρων',
    'list.filters': 'Φίλτρα',
    'list.sort': 'Ταξινόμηση',
    'list.sort.newest': 'Νεότερα',
    'list.sort.priceAsc': 'Τιμή: αύξουσα',
    'list.sort.priceDesc': 'Τιμή: φθίνουσα',
    'list.sort.nameAsc': 'Όνομα: Α έως Ω',
    'list.sort.popular': 'Δημοφιλέστερα',
    'list.size': 'Μέγεθος',
    'list.price': 'Τιμή',
    'list.maxPrice': 'Έως {price}',
    'list.inStockOnly': 'Μόνο διαθέσιμα',
    'list.onSaleOnly': 'Μόνο προσφορές',
    'list.searchResultsFor': 'Αποτελέσματα για «{q}»',
    'list.page': 'Σελίδα {page} από {total}',
    'list.previous': 'Προηγούμενη',
    'list.next': 'Επόμενη',

    'card.soldOut': 'Εξαντλήθηκε',
    'card.saleBadge': '−{percent}%',
    'card.addToWishlist': 'Αποθήκευση',
    'card.quickAdd': 'Γρήγορη προσθήκη',

    'pdp.selectSize': 'Επίλεξε μέγεθος',
    'pdp.sizeRequired': 'Διάλεξε πρώτα μέγεθος.',
    'pdp.sizeGuide': 'Οδηγός μεγεθών',
    'pdp.addToBag': 'Στην τσάντα',
    'pdp.adding': 'Προσθήκη…',
    'pdp.added': 'Προστέθηκε',
    'pdp.soldOut': 'Εξαντλήθηκε',
    'pdp.outOfStockSize': 'Εξαντλήθηκε σε {size}',
    'pdp.lowStock': 'Μόνο {n} απομένουν',
    'pdp.inStock': 'Διαθέσιμο',
    'pdp.notifyMe': 'Ενημέρωσέ με όταν επιστρέψει',
    'pdp.quantity': 'Ποσότητα',
    'pdp.sku': 'SKU',
    'pdp.colour': 'Χρώμα',
    'pdp.description': 'Λεπτομέρειες',
    'pdp.delivery': 'Αποστολή & επιστροφές',
    'pdp.deliveryBody':
      'Δωρεάν παραλαβή στη Λάρνακα ή αποστολή σε 2–4 εργάσιμες. Δωρεάν άνω των {threshold}.',
    'pdp.related': 'Μπορεί να σου αρέσουν',
    'pdp.recentlyViewed': 'Είδες πρόσφατα',
    'pdp.reserved': 'Κρατείται για {minutes} λεπτά',

    'cart.title': 'Η τσάντα σου',
    'cart.empty': 'Η τσάντα σου είναι άδεια.',
    'cart.emptyCta': 'Ξεκίνα τις αγορές',
    'cart.item': 'προϊόν',
    'cart.items': 'προϊόντα',
    'cart.itemCount': 'one:{n} προϊόν|other:{n} προϊόντα',
    'cart.remove': 'Αφαίρεση',
    'cart.subtotal': 'Υποσύνολο',
    'cart.discount': 'Έκπτωση',
    'cart.promoDiscount': 'Κωδικός προσφοράς',
    'cart.delivery': 'Αποστολή',
    'cart.free': 'Δωρεάν',
    'cart.total': 'Σύνολο',
    'cart.vatIncluded': 'με ΦΠΑ {amount}',
    'cart.checkout': 'Ολοκλήρωση',
    'cart.continueShopping': 'Συνέχεια αγορών',
    'cart.promoPlaceholder': 'Κωδικός προσφοράς',
    'cart.applyPromo': 'Εφαρμογή',
    'cart.removePromo': 'Αφαίρεση',
    'cart.spendMoreForFree': 'Πρόσθεσε {amount} για δωρεάν αποστολή',
    'cart.freeDeliveryUnlocked': 'Δωρεάν αποστολή ενεργή',
    'cart.heldFor': 'Τα προϊόντα κρατούνται για {minutes} λεπτά',
    'cart.expired': 'Η κράτηση έληξε και η τσάντα ενημερώθηκε.',
    'cart.lineUnavailable': 'Διαθέσιμα μόνο {n} — μείωσε την ποσότητα.',
    'cart.updating': 'Ενημέρωση…',

    'err.outOfStock': 'Το προϊόν δεν είναι διαθέσιμο.',
    'err.reservationExpired': 'Η κράτησή σου έληξε.',
    'err.promoExpired': 'Ο κωδικός προσφοράς έληξε.',
    'err.emailTaken': 'Αυτό το email είναι ήδη καταχωρημένο.',
    'err.phoneTaken': 'Αυτό το τηλέφωνο είναι ήδη καταχωρημένο.',
    'err.paymentFailed': 'Η πληρωμή δεν ολοκληρώθηκε.',
    'err.sessionExpired': 'Η συνεδρία έληξε.',
    'err.generic': 'Κάτι πήγε λάθος. Δοκίμασε ξανά.',
    'err.network': 'Δεν ήταν δυνατή η σύνδεση.',
    'err.notFound': 'Η σελίδα δεν βρέθηκε.',

    'auth.signIn': 'Σύνδεση',
    'auth.signOut': 'Αποσύνδεση',
    'auth.createAccount': 'Δημιουργία λογαριασμού',
    'auth.email': 'Email',
    'auth.password': 'Κωδικός',
    'auth.firstName': 'Όνομα',
    'auth.lastName': 'Επώνυμο',
    'auth.phone': 'Κινητό',
    'auth.verifyTitle': 'Έλεγξε το email σου',
    'auth.verifyBody': 'Στείλαμε 6-ψήφιο κωδικό στο {email}. Λήγει σε 10 λεπτά.',
    'auth.code': 'Κωδικός επιβεβαίωσης',
    'auth.verify': 'Επιβεβαίωση',
    'auth.resend': 'Στείλε νέο κωδικό',
    'auth.marketingOptIn': 'Θέλω να λαμβάνω νέα και προσφορές με email.',
    'auth.marketingNote': 'Προαιρετικό. Μπορείς να το αλλάξεις όποτε θέλεις.',
    'auth.forgotPassword': 'Ξέχασες τον κωδικό;',
    'auth.haveAccount': 'Έχεις ήδη λογαριασμό;',
    'auth.noAccount': 'Πρώτη φορά εδώ;',

    'footer.help': 'Βοήθεια',
    'footer.contact': 'Επικοινωνία',
    'footer.delivery': 'Αποστολή',
    'footer.returns': 'Επιστροφές',
    'footer.trackOrder': 'Παρακολούθηση παραγγελίας',
    'footer.about': 'Σχετικά',
    'footer.terms': 'Όροι χρήσης',
    'footer.privacy': 'Πολιτική απορρήτου',
    'footer.company': 'Εταιρεία',
    'footer.vat': 'ΦΠΑ',
    'footer.rights': 'Όλα τα δικαιώματα κατοχυρωμένα.',
    'footer.newsletter': 'Μάθε πρώτος τις νέες αφίξεις',
    'footer.newsletterCta': 'Εγγραφή',
  },

  ru: {
    'nav.men': 'Мужчины',
    'nav.women': 'Женщины',
    'nav.search': 'Поиск',
    'nav.searchPlaceholder': 'Поиск товара или SKU',
    'nav.account': 'Аккаунт',
    'nav.bag': 'Корзина',
    'nav.wishlist': 'Избранное',
    'nav.menu': 'Меню',
    'nav.close': 'Закрыть',
    'nav.allIn': 'Все в {category}',
    'nav.language': 'Язык',

    'home.shopMen': 'Мужчинам',
    'home.shopWomen': 'Женщинам',
    'home.newIn': 'Новинки',
    'home.newInSub': 'Последние поступления этой недели.',
    'home.onSale': 'Со скидкой',
    'home.shopNow': 'В магазин',
    'home.viewAll': 'Смотреть все',
    'home.categories': 'По категориям',

    'list.results': 'one:{n} товар|few:{n} товара|many:{n} товаров|other:{n} товара',
    'list.noResults': 'Ничего не найдено по этим фильтрам.',
    'list.clearFilters': 'Сбросить фильтры',
    'list.filters': 'Фильтры',
    'list.sort': 'Сортировка',
    'list.sort.newest': 'Новые',
    'list.sort.priceAsc': 'Цена: по возрастанию',
    'list.sort.priceDesc': 'Цена: по убыванию',
    'list.sort.nameAsc': 'Название: А–Я',
    'list.sort.popular': 'Популярные',
    'list.size': 'Размер',
    'list.price': 'Цена',
    'list.maxPrice': 'До {price}',
    'list.inStockOnly': 'Только в наличии',
    'list.onSaleOnly': 'Только со скидкой',
    'list.searchResultsFor': 'Результаты по «{q}»',
    'list.page': 'Страница {page} из {total}',
    'list.previous': 'Назад',
    'list.next': 'Вперёд',

    'card.soldOut': 'Распродано',
    'card.saleBadge': '−{percent}%',
    'card.addToWishlist': 'В избранное',
    'card.quickAdd': 'Быстрое добавление',

    'pdp.selectSize': 'Выберите размер',
    'pdp.sizeRequired': 'Сначала выберите размер.',
    'pdp.sizeGuide': 'Таблица размеров',
    'pdp.addToBag': 'В корзину',
    'pdp.adding': 'Добавление…',
    'pdp.added': 'Добавлено',
    'pdp.soldOut': 'Распродано',
    'pdp.outOfStockSize': 'Нет размера {size}',
    'pdp.lowStock': 'Осталось {n}',
    'pdp.inStock': 'В наличии',
    'pdp.notifyMe': 'Сообщить о поступлении',
    'pdp.quantity': 'Количество',
    'pdp.sku': 'SKU',
    'pdp.colour': 'Цвет',
    'pdp.description': 'Детали',
    'pdp.delivery': 'Доставка и возврат',
    'pdp.deliveryBody':
      'Бесплатный самовывоз в Ларнаке или доставка 2–4 рабочих дня. Бесплатно от {threshold}.',
    'pdp.related': 'Вам может понравиться',
    'pdp.recentlyViewed': 'Вы смотрели',
    'pdp.reserved': 'Забронировано на {minutes} минут',

    'cart.title': 'Корзина',
    'cart.empty': 'Ваша корзина пуста.',
    'cart.emptyCta': 'Начать покупки',
    'cart.item': 'товар',
    'cart.items': 'товаров',
    'cart.itemCount': 'one:{n} товар|few:{n} товара|many:{n} товаров|other:{n} товара',
    'cart.remove': 'Удалить',
    'cart.subtotal': 'Подытог',
    'cart.discount': 'Скидка',
    'cart.promoDiscount': 'Промокод',
    'cart.delivery': 'Доставка',
    'cart.free': 'Бесплатно',
    'cart.total': 'Итого',
    'cart.vatIncluded': 'включая НДС {amount}',
    'cart.checkout': 'Оформить',
    'cart.continueShopping': 'Продолжить покупки',
    'cart.promoPlaceholder': 'Промокод',
    'cart.applyPromo': 'Применить',
    'cart.removePromo': 'Убрать',
    'cart.spendMoreForFree': 'Добавьте {amount} для бесплатной доставки',
    'cart.freeDeliveryUnlocked': 'Бесплатная доставка активна',
    'cart.heldFor': 'Товары забронированы на {minutes} минут',
    'cart.expired': 'Бронь истекла, корзина обновлена.',
    'cart.lineUnavailable': 'Доступно только {n} — уменьшите количество.',
    'cart.updating': 'Обновление…',

    'err.outOfStock': 'Этого товара нет в наличии.',
    'err.reservationExpired': 'Ваша бронь истекла.',
    'err.promoExpired': 'Промокод истёк.',
    'err.emailTaken': 'Этот email уже зарегистрирован.',
    'err.phoneTaken': 'Этот номер уже зарегистрирован.',
    'err.paymentFailed': 'Платёж не прошёл.',
    'err.sessionExpired': 'Сессия истекла.',
    'err.generic': 'Что-то пошло не так. Попробуйте снова.',
    'err.network': 'Не удалось связаться с магазином.',
    'err.notFound': 'Страница не найдена.',

    'auth.signIn': 'Войти',
    'auth.signOut': 'Выйти',
    'auth.createAccount': 'Создать аккаунт',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.firstName': 'Имя',
    'auth.lastName': 'Фамилия',
    'auth.phone': 'Мобильный телефон',
    'auth.verifyTitle': 'Проверьте почту',
    'auth.verifyBody': 'Мы отправили 6-значный код на {email}. Он истекает через 10 минут.',
    'auth.code': 'Код подтверждения',
    'auth.verify': 'Подтвердить',
    'auth.resend': 'Отправить новый код',
    'auth.marketingOptIn': 'Хочу получать новости и предложения по email.',
    'auth.marketingNote': 'Необязательно. Можно изменить в любой момент.',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.haveAccount': 'Уже есть аккаунт?',
    'auth.noAccount': 'Впервые здесь?',

    'footer.help': 'Помощь',
    'footer.contact': 'Связаться с нами',
    'footer.delivery': 'Доставка',
    'footer.returns': 'Возврат',
    'footer.trackOrder': 'Отследить заказ',
    'footer.about': 'О нас',
    'footer.terms': 'Условия',
    'footer.privacy': 'Конфиденциальность',
    'footer.company': 'Компания',
    'footer.vat': 'НДС',
    'footer.rights': 'Все права защищены.',
    'footer.newsletter': 'Узнавайте о новинках первыми',
    'footer.newsletterCta': 'Подписаться',
  },
} as const

/** Every key must exist in every locale — TypeScript enforces it, so a missing
 *  Greek string is a build error rather than an English word on a Greek page. */
export type MessageKey = keyof typeof messages.en

type Dict = Record<MessageKey, string>
const dictionaries: Record<Locale, Dict> = {
  en: messages.en,
  el: messages.el as unknown as Dict,
  ru: messages.ru as unknown as Dict,
}

/* ------------------------------------------------------------- plurals -- */

/* A message may carry plural forms instead of one string:
 *
 *     'list.results': 'one:{n} product|other:{n} products'
 *
 * The form is chosen by Intl.PluralRules for the locale, so Russian gets its
 * three-way one/few/many split without the call site knowing anything about
 * it. "1 προϊόντα" and "2 товаров" were both wrong, and both were wrong in a
 * way a `count === 1 ? a : b` at the call site cannot fix.
 */
const FORM_SYNTAX = /^[a-z]+:/

const pluralRules = new Map<string, Intl.PluralRules>()

function rulesFor(locale: Locale) {
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale === 'el' ? 'el-GR' : locale === 'ru' ? 'ru-RU' : 'en-IE')
    pluralRules.set(locale, rules)
  }
  return rules
}

function selectForm(template: string, locale: Locale, n: number): string {
  const forms = new Map<string, string>()
  for (const part of template.split('|')) {
    const at = part.indexOf(':')
    forms.set(part.slice(0, at), part.slice(at + 1))
  }
  const category = rulesFor(locale).select(n)
  /* "other" always exists as the fallback; CLDR guarantees every locale has it. */
  return forms.get(category) ?? forms.get('other') ?? template
}

/** Translator for a locale. `vars` fills `{placeholder}` slots, and a numeric
 *  `n` also selects the plural form when the message declares any. */
export function getTranslator(locale: Locale) {
  const dict = dictionaries[locale] ?? dictionaries.en
  return function t(key: MessageKey, vars?: Record<string, string | number>): string {
    let out = dict[key] ?? dictionaries.en[key] ?? key

    if (out.includes('|') && FORM_SYNTAX.test(out)) {
      const n = Number(vars?.n ?? 0)
      out = selectForm(out, locale, Number.isFinite(n) ? n : 0)
    }

    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        out = out.replaceAll(`{${name}}`, String(value))
      }
    }
    return out
  }
}

export type Translator = ReturnType<typeof getTranslator>
