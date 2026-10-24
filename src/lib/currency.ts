import { useStore } from '../store';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  rate: number; // relative to USD base = 1
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, decimals: 2, symbolPosition: 'prefix' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, decimals: 2, symbolPosition: 'prefix' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, decimals: 2, symbolPosition: 'prefix' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate: 3.67, decimals: 2, symbolPosition: 'suffix' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate: 3.75, decimals: 2, symbolPosition: 'suffix' },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', rate: 3.64, decimals: 2, symbolPosition: 'suffix' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', rate: 0.31, decimals: 3, symbolPosition: 'suffix' },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD', rate: 0.38, decimals: 3, symbolPosition: 'suffix' },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', rate: 0.38, decimals: 3, symbolPosition: 'suffix' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.36, decimals: 2, symbolPosition: 'prefix' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.53, decimals: 2, symbolPosition: 'prefix' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 154.0, decimals: 0, symbolPosition: 'prefix' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.5, decimals: 2, symbolPosition: 'prefix' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, decimals: 2, symbolPosition: 'prefix' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.91, decimals: 2, symbolPosition: 'prefix' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.36, decimals: 2, symbolPosition: 'prefix' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.67, decimals: 2, symbolPosition: 'prefix' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82, decimals: 2, symbolPosition: 'prefix' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.5, decimals: 2, symbolPosition: 'prefix' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 32.5, decimals: 2, symbolPosition: 'prefix' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 91.5, decimals: 2, symbolPosition: 'suffix' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.15, decimals: 2, symbolPosition: 'prefix' },
};

export const SUPPORTED_CURRENCIES = Object.values(CURRENCY_CONFIGS);

export function getCurrencyConfig(code: string): CurrencyConfig {
  const upper = (code || 'USD').toUpperCase();
  return CURRENCY_CONFIGS[upper] || CURRENCY_CONFIGS.USD;
}

/**
 * Converts a base USD amount to the target currency
 */
export function convertCurrency(baseUsdAmount: number, targetCurrency: string): number {
  if (baseUsdAmount === undefined || baseUsdAmount === null || isNaN(Number(baseUsdAmount))) {
    return 0;
  }
  const config = getCurrencyConfig(targetCurrency);
  return Number((baseUsdAmount * config.rate).toFixed(config.decimals));
}

/**
 * Formats a converted amount with proper symbol and decimal placement
 */
export function formatCurrencyAmount(convertedAmount: number, targetCurrency: string): string {
  const config = getCurrencyConfig(targetCurrency);
  const formattedNumber = convertedAmount.toLocaleString(undefined, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  if (config.symbolPosition === 'suffix') {
    return `${formattedNumber} ${config.symbol}`;
  }
  return `${config.symbol}${formattedNumber}`;
}

/**
 * Takes base USD amount, converts it to target currency, and returns formatted price with symbol
 */
export function formatPrice(baseUsdAmount: number, targetCurrency: string = 'USD'): string {
  const converted = convertCurrency(baseUsdAmount, targetCurrency);
  return formatCurrencyAmount(converted, targetCurrency);
}

/**
 * React Hook for currency conversion & formatting across the entire app
 */
export function useCurrency() {
  const { currency } = useStore();
  const config = getCurrencyConfig(currency);

  return {
    currency: config.code,
    symbol: config.symbol,
    rate: config.rate,
    config,
    convert: (baseUsdAmount: number) => convertCurrency(baseUsdAmount, config.code),
    format: (baseUsdAmount: number) => {
      const converted = convertCurrency(baseUsdAmount, config.code);
      return converted.toLocaleString(undefined, {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      });
    },
    formatPrice: (baseUsdAmount: number) => formatPrice(baseUsdAmount, config.code),
  };
}
