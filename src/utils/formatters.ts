/**
 * Common formatting utility functions
 * Centralized to avoid code duplication across components
 */

import { TFunction } from 'i18next';
import { getProjectTranslationKey } from '@/constants/projects';

/**
 * Format currency values to Pakistani Rupees
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Format enum values to human-readable format
 * Example: SOME_VALUE -> Some Value
 */
export const formatEnum = (value: string): string => {
  if (!value) return "";
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Format project names with translation support
 */
export const formatProjectName = (value: string, t: TFunction): string => {
  if (!value) return "";
  
  // Get translation key for the project
  const translationKey = getProjectTranslationKey(value);
  if (translationKey) {
    const translated = t(translationKey);
    if (translated && !translated.startsWith('projects.')) return translated;
  }
  
  // Fallback to formatting the enum value
  return formatEnum(value);
};

/**
 * Format plot size with translation support
 */
export const formatSize = (value: string, t: TFunction): string => {
  if (!value) return "";
  
  const sizeMap: { [key: string]: string } = {
    'FIVE_MARLA': t('plotSizes.fiveMarla'),
    'SEVEN_MARLA': t('plotSizes.sevenMarla'),
    'TEN_MARLA': t('plotSizes.tenMarla'),
    'ONE_KANAL': t('plotSizes.oneKanal'),
    'TWO_KANAL': t('plotSizes.twoKanal'),
  };
  
  return sizeMap[value] || formatEnum(value);
};

/**
 * Format payment method with translation support
 */
export const formatPaymentMethod = (method: string, t: TFunction): string => {
  if (!method) return "";
  return t(`payments.paymentMethods.${method}`) || formatEnum(method);
};

/**
 * Format payment type with translation support
 */
export const formatPaymentType = (type: string, t: TFunction): string => {
  if (!type) return "";
  return t(`payments.paymentTypes.${type}`) || formatEnum(type);
};

/**
 * Format date to localized string
 */
export const formatDate = (dateString: string | Date, locale: string = 'en-PK'): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(locale);
};

/**
 * Format date with specific options
 */
export const formatDateWithOptions = (
  dateString: string | Date,
  locale: string = 'en-PK',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "N/A";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(dateString).toLocaleDateString(locale, options || defaultOptions);
};

/**
 * Format plot type (corner vs regular)
 */
export const formatPlotType = (isCorner: boolean): string => {
  return isCorner ? "Corner Plot" : "Regular Plot";
};

/**
 * Get marla count from plot size enum
 */
export const getMarlaCount = (size: string): number => {
  const marlaMap: { [key: string]: number } = {
    'FIVE_MARLA': 5,
    'SEVEN_MARLA': 7,
    'TEN_MARLA': 10,
    'ONE_KANAL': 20,
    'TWO_KANAL': 40,
  };
  
  return marlaMap[size] || 0;
};

/**
 * Format payment plan text
 */
export const formatPaymentPlan = (installmentMonths?: number, installmentType?: string): string => {
  if (!installmentMonths || installmentMonths === 0) {
    return "Full Payment";
  }
  
  if (installmentType === 'QUARTERLY') {
    return `${installmentMonths} Quarters Installment`;
  }
  
  return `${installmentMonths} Months Installment`;
};
