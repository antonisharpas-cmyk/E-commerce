import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/* ==========================================================================
   BILINGUAL COPY — EN / ΕΛ
   Add a key here and it is instantly available anywhere via t('key').
   ========================================================================== */
const DICT = {
  // --- chrome -------------------------------------------------------------
  'nav.home': { en: 'Home', el: 'Αρχική' },
  'nav.shop': { en: 'Shop', el: 'Κατάστημα' },
  'nav.flash': { en: 'Flash Sale', el: 'Προσφορές' },
  'nav.brands': { en: 'Brands', el: 'Μάρκες' },
  'nav.contact': { en: 'Contact', el: 'Επικοινωνία' },
  'nav.categories': { en: 'Categories', el: 'Κατηγορίες' },
  'nav.menu': { en: 'Menu', el: 'Μενού' },
  'nav.close': { en: 'Close', el: 'Κλείσιμο' },

  'top.ticker.1': {
    en: 'Free island-wide delivery over €50',
    el: 'Δωρεάν αποστολή σε όλη την Κύπρο για παραγγελίες άνω των €50',
  },
  'top.ticker.2': { en: 'Same-day pickup in Meneou, Larnaca', el: 'Παραλαβή την ίδια μέρα στο Μενεού, Λάρνακα' },
  'top.ticker.3': { en: '100% authentic — official importer stock', el: '100% αυθεντικά — επίσημα εισαγόμενα προϊόντα' },

  // --- hero ---------------------------------------------------------------
  'hero.eyebrow': { en: 'Larnaca · Cyprus · Since 2018', el: 'Λάρνακα · Κύπρος · Από το 2018' },
  'hero.title.1': { en: 'Fuel the', el: 'Τροφοδότησε' },
  'hero.title.2': { en: 'Obsession', el: 'την Εμμονή' },
  'hero.sub': {
    en: 'Genuine bodybuilding and sports supplements, stocked in Larnaca and in your hands the same day. No grey imports, no expired tubs, no guesswork.',
    el: 'Αυθεντικά συμπληρώματα bodybuilding και αθλητικής διατροφής, από τη Λάρνακα στα χέρια σου την ίδια μέρα. Χωρίς παράλληλες εισαγωγές, χωρίς ληγμένα προϊόντα.',
  },
  'hero.cta': { en: 'Shop the range', el: 'Δες τα προϊόντα' },
  'hero.cta2': { en: 'Talk to us', el: 'Μίλα μαζί μας' },
  'hero.stat.brands': { en: 'Official brands', el: 'Επίσημες μάρκες' },
  'hero.stat.skus': { en: 'Products in stock', el: 'Προϊόντα σε στοκ' },
  'hero.stat.years': { en: 'Years in Larnaca', el: 'Χρόνια στη Λάρνακα' },

  // --- value props --------------------------------------------------------
  'why.title': { en: 'Why buy from the shop, not a marketplace', el: 'Γιατί από εμάς και όχι από marketplace' },
  'why.1.t': { en: 'Genuine stock only', el: 'Μόνο αυθεντικά προϊόντα' },
  'why.1.d': {
    en: 'Every tub comes through the official Cyprus importer with a batch number you can check on the label.',
    el: 'Κάθε προϊόν έρχεται μέσω του επίσημου εισαγωγέα Κύπρου με αριθμό παρτίδας στην ετικέτα.',
  },
  'why.2.t': { en: 'Same-day pickup', el: 'Παραλαβή την ίδια μέρα' },
  'why.2.d': {
    en: 'Order before 16:00 and collect from the Meneou shop the same afternoon. Nicosia and Limassol next day.',
    el: 'Παράγγειλε πριν τις 16:00 και παρέλαβε από το Μενεού το ίδιο απόγευμα. Λευκωσία και Λεμεσός την επόμενη μέρα.',
  },
  'why.3.t': { en: 'Advice from lifters', el: 'Συμβουλές από αθλητές' },
  'why.3.d': {
    en: 'We train too. Tell us your goal and your budget and we will tell you what you actually need — often less than you think.',
    el: 'Προπονούμαστε και εμείς. Πες μας τον στόχο και τον προϋπολογισμό σου και θα σου προτείνουμε τι χρειάζεσαι πραγματικά.',
  },
  'why.4.t': { en: 'Price-matched on the island', el: 'Καλύτερη τιμή στην Κύπρο' },
  'why.4.d': {
    en: 'Found it cheaper in Cyprus? Send us the link and we will match it or explain why we cannot.',
    el: 'Το βρήκες φθηνότερα στην Κύπρο; Στείλε μας τον σύνδεσμο και θα το καλύψουμε.',
  },

  // --- sections -----------------------------------------------------------
  'sec.categories': { en: 'Shop by category', el: 'Αγορά ανά κατηγορία' },
  'sec.categories.sub': { en: 'Thirteen categories, one shelf.', el: 'Δεκατρείς κατηγορίες, ένα ράφι.' },
  'sec.flash': { en: 'Flash sale', el: 'Προσφορές' },
  'sec.flash.sub': { en: 'This week only, while stock lasts.', el: 'Μόνο αυτή την εβδομάδα, μέχρι εξαντλήσεως.' },
  'sec.best': { en: 'Bestsellers', el: 'Δημοφιλέστερα' },
  'sec.best.sub': { en: 'What Larnaca actually buys.', el: 'Αυτά που αγοράζει η Λάρνακα.' },
  'sec.brands': { en: 'Official brands', el: 'Επίσημες μάρκες' },
  'sec.brands.sub': { en: 'Direct from the importers we trust.', el: 'Απευθείας από τους εισαγωγείς που εμπιστευόμαστε.' },
  'sec.visit': { en: 'Come to the shop', el: 'Έλα στο κατάστημα' },
  'sec.stacks': { en: 'Build your stack', el: 'Φτιάξε το stack σου' },
  'sec.stacks.sub': {
    en: 'Three bundles that cover 90% of what people walk in asking for.',
    el: 'Τρία πακέτα που καλύπτουν το 90% των αναγκών.',
  },
  'sec.reviews': { en: 'From the counter', el: 'Από τους πελάτες μας' },

  // --- stacks -------------------------------------------------------------
  'stack.1.t': { en: 'The Starter', el: 'Ο Αρχάριος' },
  'stack.1.d': {
    en: 'Whey, creatine and a multivitamin. Everything a first-year lifter needs and nothing they do not.',
    el: 'Whey, κρεατίνη και πολυβιταμίνη. Ό,τι χρειάζεται ένας αρχάριος και τίποτα περιττό.',
  },
  'stack.2.t': { en: 'The Cut', el: 'Το Cutting' },
  'stack.2.d': {
    en: 'Isolate, a thermogenic and electrolytes. For the eight weeks before summer.',
    el: 'Isolate, θερμογενετικό και ηλεκτρολύτες. Για τις οκτώ εβδομάδες πριν το καλοκαίρι.',
  },
  'stack.3.t': { en: 'The Mass', el: 'Το Bulking' },
  'stack.3.d': {
    en: 'Gainer, creatine and pre-workout. For anyone who cannot put weight on.',
    el: 'Gainer, κρεατίνη και pre-workout. Για όσους δυσκολεύονται να πάρουν βάρος.',
  },
  'stack.save': { en: 'Save', el: 'Κερδίζεις' },
  'stack.cta': { en: 'Add stack to cart', el: 'Πρόσθεσε το stack' },

  // --- product ------------------------------------------------------------
  'p.add': { en: 'Add to cart', el: 'Στο καλάθι' },
  'p.added': { en: 'Added', el: 'Προστέθηκε' },
  'p.view': { en: 'View', el: 'Προβολή' },
  'p.size': { en: 'Size', el: 'Μέγεθος' },
  'p.flavour': { en: 'Flavour', el: 'Γεύση' },
  'p.qty': { en: 'Quantity', el: 'Ποσότητα' },
  'p.inStock': { en: 'In stock in Larnaca', el: 'Διαθέσιμο στη Λάρνακα' },
  'p.lowStock': { en: 'Only {n} left', el: 'Μόνο {n} απομένουν' },
  'p.reviews': { en: '{n} reviews', el: '{n} κριτικές' },
  'p.perServing': { en: 'Per serving', el: 'Ανά μερίδα' },
  'p.protein': { en: 'Protein', el: 'Πρωτεΐνη' },
  'p.carbs': { en: 'Carbs', el: 'Υδατάνθρακες' },
  'p.fat': { en: 'Fat', el: 'Λιπαρά' },
  'p.serving': { en: 'Serving', el: 'Μερίδα' },
  'p.related': { en: 'Goes well with', el: 'Πάει καλά με' },
  'p.pickup': { en: 'Free pickup in Meneou today', el: 'Δωρεάν παραλαβή στο Μενεού σήμερα' },
  'p.delivery': { en: 'Island-wide delivery in 1–2 days', el: 'Αποστολή σε όλη την Κύπρο σε 1–2 ημέρες' },
  'p.authentic': { en: 'Official importer stock', el: 'Επίσημα εισαγόμενο' },
  'p.back': { en: 'Back to shop', el: 'Πίσω στο κατάστημα' },
  'p.notFound': { en: 'Product not found', el: 'Το προϊόν δεν βρέθηκε' },

  'badge.bestseller': { en: 'Bestseller', el: 'Δημοφιλές' },
  'badge.flash': { en: 'Flash deal', el: 'Προσφορά' },
  'badge.lactoseFree': { en: 'Lactose free', el: 'Χωρίς λακτόζη' },
  'badge.summer': { en: 'Summer pick', el: 'Επιλογή καλοκαιριού' },

  // --- shop ---------------------------------------------------------------
  'shop.title': { en: 'The whole shelf', el: 'Όλα τα προϊόντα' },
  'shop.results': { en: '{n} products', el: '{n} προϊόντα' },
  'shop.filters': { en: 'Filters', el: 'Φίλτρα' },
  'shop.brand': { en: 'Brand', el: 'Μάρκα' },
  'shop.category': { en: 'Category', el: 'Κατηγορία' },
  'shop.price': { en: 'Max price', el: 'Μέγιστη τιμή' },
  'shop.sort': { en: 'Sort', el: 'Ταξινόμηση' },
  'shop.sort.featured': { en: 'Featured', el: 'Προτεινόμενα' },
  'shop.sort.priceAsc': { en: 'Price: low to high', el: 'Τιμή: αύξουσα' },
  'shop.sort.priceDesc': { en: 'Price: high to low', el: 'Τιμή: φθίνουσα' },
  'shop.sort.rating': { en: 'Best rated', el: 'Καλύτερη βαθμολογία' },
  'shop.clear': { en: 'Clear all', el: 'Καθαρισμός' },
  'shop.empty': { en: 'Nothing matches those filters.', el: 'Κανένα προϊόν με αυτά τα φίλτρα.' },
  'shop.all': { en: 'All', el: 'Όλα' },
  'shop.search': { en: 'Search products…', el: 'Αναζήτηση προϊόντων…' },

  // --- cart ---------------------------------------------------------------
  'cart.title': { en: 'Your cart', el: 'Το καλάθι σου' },
  'cart.empty': { en: 'Your cart is empty.', el: 'Το καλάθι σου είναι άδειο.' },
  'cart.emptyCta': { en: 'Start shopping', el: 'Ξεκίνα τις αγορές' },
  'cart.subtotal': { en: 'Subtotal', el: 'Υποσύνολο' },
  'cart.shipping': { en: 'Delivery', el: 'Αποστολή' },
  'cart.free': { en: 'Free', el: 'Δωρεάν' },
  'cart.total': { en: 'Total', el: 'Σύνολο' },
  'cart.checkout': { en: 'Checkout', el: 'Ολοκλήρωση' },
  'cart.remove': { en: 'Remove', el: 'Αφαίρεση' },
  'cart.freeAt': { en: 'Add €{n} more for free delivery', el: 'Πρόσθεσε €{n} για δωρεάν αποστολή' },
  'cart.freeYes': { en: 'Free delivery unlocked', el: 'Δωρεάν αποστολή ενεργή' },
  'cart.demo': { en: 'Demo store — no real payment is taken.', el: 'Demo κατάστημα — δεν γίνεται πραγματική πληρωμή.' },

  // --- brands page --------------------------------------------------------
  'brands.title': { en: 'Brands on the shelf', el: 'Μάρκες στο ράφι' },
  'brands.sub': {
    en: 'Twelve names we stock directly. If you need something we do not carry, ask — we can usually get it inside a week.',
    el: 'Δώδεκα μάρκες που έχουμε άμεσα. Αν χρειάζεσαι κάτι άλλο, ρώτα μας — συνήθως το φέρνουμε σε μία εβδομάδα.',
  },
  'brands.count': { en: '{n} products', el: '{n} προϊόντα' },
  'brands.count.one': { en: '1 product', el: '1 προϊόν' },

  // --- contact ------------------------------------------------------------
  'contact.title': { en: 'Find us in Meneou', el: 'Βρες μας στο Μενεού' },
  'contact.sub': {
    en: 'Walk in, ask questions, taste before you buy a 5 kg tub. We are five minutes from Larnaca airport.',
    el: 'Έλα από το κατάστημα, ρώτησε, δοκίμασε πριν αγοράσεις. Είμαστε πέντε λεπτά από το αεροδρόμιο Λάρνακας.',
  },
  'contact.address': { en: 'Address', el: 'Διεύθυνση' },
  'contact.phone': { en: 'Phone / WhatsApp', el: 'Τηλέφωνο / WhatsApp' },
  'contact.email': { en: 'Email', el: 'Email' },
  'contact.hours': { en: 'Opening hours', el: 'Ώρες λειτουργίας' },
  'contact.hours.week': { en: 'Mon – Fri', el: 'Δευ – Παρ' },
  'contact.hours.sat': { en: 'Saturday', el: 'Σάββατο' },
  'contact.hours.sun': { en: 'Sunday', el: 'Κυριακή' },
  'contact.hours.closed': { en: 'Closed', el: 'Κλειστά' },
  'contact.form.title': { en: 'Send a message', el: 'Στείλε μήνυμα' },
  'contact.form.name': { en: 'Your name', el: 'Όνομα' },
  'contact.form.email': { en: 'Your email', el: 'Email' },
  'contact.form.msg': { en: 'What do you need?', el: 'Τι χρειάζεσαι;' },
  'contact.form.send': { en: 'Send', el: 'Αποστολή' },
  'contact.form.sent': { en: 'Thanks — we will reply today.', el: 'Ευχαριστούμε — θα απαντήσουμε σήμερα.' },
  'contact.form.demo': { en: 'Demo form — nothing is actually sent.', el: 'Demo φόρμα — δεν αποστέλλεται τίποτα.' },
  'contact.directions': { en: 'Get directions', el: 'Οδηγίες πρόσβασης' },
  'contact.whatsapp': { en: 'Message on WhatsApp', el: 'Μήνυμα στο WhatsApp' },

  // --- newsletter / footer -----------------------------------------------
  'nl.title': { en: 'Get the drop list', el: 'Μάθε πρώτος τις προσφορές' },
  'nl.sub': {
    en: 'New stock, flash prices and the odd training rant. One email a week, no more.',
    el: 'Νέα προϊόντα, προσφορές και συμβουλές προπόνησης. Ένα email την εβδομάδα.',
  },
  'nl.placeholder': { en: 'your@email.com', el: 'your@email.com' },
  'nl.cta': { en: 'Join', el: 'Εγγραφή' },
  'nl.done': { en: 'You are on the list.', el: 'Είσαι στη λίστα.' },

  'foot.shop': { en: 'Shop', el: 'Κατάστημα' },
  'foot.help': { en: 'Help', el: 'Βοήθεια' },
  'foot.company': { en: 'Company', el: 'Εταιρεία' },
  'foot.terms': { en: 'Terms & conditions', el: 'Όροι χρήσης' },
  'foot.returns': { en: 'Return policy', el: 'Πολιτική επιστροφών' },
  'foot.support': { en: 'Support policy', el: 'Πολιτική υποστήριξης' },
  'foot.privacy': { en: 'Privacy policy', el: 'Πολιτική απορρήτου' },
  'foot.shipping': { en: 'Delivery & pickup', el: 'Αποστολή & παραλαβή' },
  'foot.about': { en: 'About the shop', el: 'Σχετικά με εμάς' },
  'foot.rights': { en: 'All rights reserved.', el: 'Όλα τα δικαιώματα κατοχυρωμένα.' },
  'foot.demoNote': {
    en: 'Concept redesign — not the live store.',
    el: 'Πρόταση ανασχεδιασμού — δεν είναι το επίσημο κατάστημα.',
  },

  // --- reviews ------------------------------------------------------------
  'rev.1': {
    en: 'Walked in not knowing anything, walked out with exactly two things instead of the five I was going to buy online. Straight talk.',
    el: 'Μπήκα χωρίς να ξέρω τίποτα και βγήκα με δύο προϊόντα αντί για πέντε. Ειλικρινείς συμβουλές.',
  },
  'rev.2': {
    en: 'Ordered at 15:40, picked it up at 18:00 the same day. Try getting that from a UK site.',
    el: 'Παρήγγειλα στις 15:40 και παρέλαβα στις 18:00 την ίδια μέρα. Απίστευτη ταχύτητα.',
  },
  'rev.3': {
    en: 'Best prices in Larnaca and the tubs are always fresh — never had a short-dated one.',
    el: 'Οι καλύτερες τιμές στη Λάρνακα και τα προϊόντα πάντα φρέσκα.',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('fm-lang') || 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('fm-lang', lang)
    } catch {
      /* private mode — fine, just don't persist */
    }
    document.documentElement.lang = lang === 'el' ? 'el' : 'en'
  }, [lang])

  const value = useMemo(() => {
    const t = (key, vars) => {
      const entry = DICT[key]
      let out = entry ? (entry[lang] ?? entry.en) : key
      if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v)
      return out
    }
    // pick the right language field off a data object ({ en, el })
    const tf = (obj) => (obj ? (obj[lang] ?? obj.en) : '')
    return { lang, setLang, t, tf, toggle: () => setLang((l) => (l === 'en' ? 'el' : 'en')) }
  }, [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>')
  return ctx
}

export const money = (n) =>
  '€' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
