import type { Language } from '../i18n'

/** Currencies exposed in the UI. The DB allows a couple more for headroom;
 *  add here (and to the `groups.currency` check constraint) to expose a new one. */
export const CURRENCY_OPTIONS = ['CAD', 'KRW'] as const
export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]

export const DEFAULT_CURRENCY: CurrencyCode = 'CAD'

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-CA',
  ko: 'ko-KR',
}

export function formatCurrency(amount: number | string, currency: string, language: Language): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(value)
}
