/**
 * Custom hook that provides pre-bound formatting functions.
 * 
 * Instead of repeating local wrapper functions in every component like:
 *   const formatProjectName = (value: string) => formatProjectNameUtil(value, t);
 *   const formatSize = (value: string) => formatSizeUtil(value, t);
 * 
 * Components can simply:
 *   const { formatDate, formatProjectName, formatSize, ... } = useFormatters();
 */
import { useTranslation } from 'react-i18next';
import {
    formatCurrency,
    formatDateWithOptions,
    formatDate as formatDateSimple,
    formatEnum,
    formatPaymentPlan,
    formatPaymentMethod as formatPaymentMethodUtil,
    formatPaymentType as formatPaymentTypeUtil,
    formatSize as formatSizeUtil,
    formatProjectName as formatProjectNameUtil,
    formatPlotType,
    formatPlotNumberInput,
    getMarlaCount,
} from '@/utils/formatters';

export function useFormatters() {
    const { t } = useTranslation();

    /** Format date with short month: "Jan 1, 2025" */
    const formatDateShort = (dateString: string | Date) =>
        formatDateWithOptions(dateString, 'en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

    /** Format date with long month: "January 1, 2025" */
    const formatDateLong = (dateString: string | Date) =>
        formatDateWithOptions(dateString, 'en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

    /** Format project name with translation support */
    const formatProjectName = (value: string) => formatProjectNameUtil(value, t);

    /** Format plot size with translation support */
    const formatSize = (value: string) => formatSizeUtil(value, t);

    /** Format payment method with translation support */
    const formatPaymentMethod = (method: string) => formatPaymentMethodUtil(method, t);

    /** Format payment type with translation support */
    const formatPaymentType = (type: string) => formatPaymentTypeUtil(type, t);

    return {
        // Date formatters
        formatDateShort,
        formatDateLong,
        formatDateSimple,
        formatDateWithOptions,

        // Translation-bound formatters
        formatProjectName,
        formatSize,
        formatPaymentMethod,
        formatPaymentType,

        // Pass-through formatters (no translation needed)
        formatCurrency,
        formatEnum,
        formatPaymentPlan,
        formatPlotType,
        formatPlotNumberInput,
        getMarlaCount,
    };
}
