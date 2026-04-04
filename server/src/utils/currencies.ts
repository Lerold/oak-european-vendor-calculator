// Map of country codes to their currency details
// Used for formatting responses with local currency info
export const CURRENCY_MAP: Record<string, { code: string; symbol: string; locale: string }> = {
  DE: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  FR: { code: 'EUR', symbol: '€', locale: 'fr-FR' },
  IT: { code: 'EUR', symbol: '€', locale: 'it-IT' },
  ES: { code: 'EUR', symbol: '€', locale: 'es-ES' },
  NL: { code: 'EUR', symbol: '€', locale: 'nl-NL' },
  PT: { code: 'EUR', symbol: '€', locale: 'pt-PT' },
  FI: { code: 'EUR', symbol: '€', locale: 'fi-FI' },
  EL: { code: 'EUR', symbol: '€', locale: 'el-GR' },
  SK: { code: 'EUR', symbol: '€', locale: 'sk-SK' },
  SI: { code: 'EUR', symbol: '€', locale: 'sl-SI' },
  HR: { code: 'EUR', symbol: '€', locale: 'hr-HR' },
  GB: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  SE: { code: 'SEK', symbol: 'kr', locale: 'sv-SE' },
  DK: { code: 'DKK', symbol: 'kr', locale: 'da-DK' },
  NO: { code: 'NOK', symbol: 'kr', locale: 'nb-NO' },
  PL: { code: 'PLN', symbol: 'zł', locale: 'pl-PL' },
  HU: { code: 'HUF', symbol: 'Ft', locale: 'hu-HU' },
  CZ: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ' },
  RO: { code: 'RON', symbol: 'lei', locale: 'ro-RO' },
};
