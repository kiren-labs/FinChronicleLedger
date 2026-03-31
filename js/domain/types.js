/**
 * FinChronicleLedger — Domain: Types & Constants
 * Pure definitions — no logic, no I/O.
 */
(function (global) {
    'use strict';

    // =====================================================================
    // App Metadata
    // =====================================================================
    const APP_VERSION = '1.2.0';
    const APP_NAME = 'FinChronicleLedger';

    // =====================================================================
    // Account Types
    // =====================================================================
    const AccountType = Object.freeze({
        ASSET: 'asset',
        LIABILITY: 'liability',
        EQUITY: 'equity',
        INCOME: 'income',
        EXPENSE: 'expense',
    });

    /** Normal balance direction for each account type */
    const NormalBalance = Object.freeze({
        [AccountType.ASSET]: 'debit',
        [AccountType.LIABILITY]: 'credit',
        [AccountType.EQUITY]: 'credit',
        [AccountType.INCOME]: 'credit',
        [AccountType.EXPENSE]: 'debit',
    });

    // =====================================================================
    // Entry Types
    // =====================================================================
    const EntryType = Object.freeze({
        INCOME: 'income',
        EXPENSE: 'expense',
        TRANSFER: 'transfer',
        OPENING: 'opening',
    });

    // =====================================================================
    // Entry Sources
    // =====================================================================
    const EntrySource = Object.freeze({
        USER_INPUT: 'user-input',
        IMPORT: 'import',
        MIGRATION: 'migration',
        SYSTEM: 'system',
    });

    // =====================================================================
    // Validation Constants
    // =====================================================================
    const MAX_AMOUNT = 999999999;
    const MAX_NOTES_LENGTH = 500;
    const MAX_MEMO_LENGTH = 200;
    const MAX_ACCOUNT_NAME_LENGTH = 100;
    const MIN_DATE_YEAR = 1900;
    const ITEMS_PER_PAGE = 20;
    const BALANCE_TOLERANCE = 0.001;

    // =====================================================================
    // Currency Definitions (20 currencies — parity with v3)
    // =====================================================================
    const Currencies = Object.freeze({
        INR: { symbol: '₹', name: 'Indian Rupee' },
        THB: { symbol: '฿', name: 'Thai Baht' },
        USD: { symbol: '$', name: 'US Dollar' },
        EUR: { symbol: '€', name: 'Euro' },
        GBP: { symbol: '£', name: 'British Pound' },
        JPY: { symbol: '¥', name: 'Japanese Yen' },
        CNY: { symbol: '¥', name: 'Chinese Yuan' },
        SGD: { symbol: 'S$', name: 'Singapore Dollar' },
        HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
        AUD: { symbol: 'A$', name: 'Australian Dollar' },
        NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
        KRW: { symbol: '₩', name: 'South Korean Won' },
        MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
        PHP: { symbol: '₱', name: 'Philippine Peso' },
        IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
        VND: { symbol: '₫', name: 'Vietnamese Dong' },
        AED: { symbol: 'د.إ', name: 'UAE Dirham' },
        SAR: { symbol: 'SR', name: 'Saudi Riyal' },
        CHF: { symbol: 'Fr', name: 'Swiss Franc' },
        CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    });

    // =====================================================================
    // Simple Mode Category Definitions (v3 parity)
    // =====================================================================
    const SimpleCategories = Object.freeze({
        income: [
            'Salary', 'Business', 'Investment', 'Rental Income',
            'Gifts/Refunds', 'Freelance', 'Bonus', 'Other Income',
        ],
        expense: [
            'Food', 'Groceries', 'Transport', 'Utilities/Bills',
            'Kids/School', 'Fees/Docs', 'Debt/Loans', 'Household',
            'Other Expense', 'Rent', 'Healthcare', 'Personal/Shopping',
            'Insurance/Taxes', 'Savings/Investments', 'Charity/Gifts',
            'Misc/Buffer',
        ],
    });

    // =====================================================================
    // Simple Mode Category → Account Code Mapping
    // =====================================================================
    const CategoryAccountMap = Object.freeze({
        // Income
        'Salary':              4000,
        'Business':            4100,
        'Investment':          4200,
        'Rental Income':       4300,
        'Freelance':           4400,
        'Bonus':               4500,
        'Gifts/Refunds':       4600,
        'Other Income':        4900,
        // Expense
        'Food':                5100,
        'Groceries':           5000,
        'Transport':           5200,
        'Utilities/Bills':     5300,
        'Kids/School':         5500,
        'Fees/Docs':           5600,
        'Debt/Loans':          5920,
        'Household':           5940,
        'Other Expense':       5950,
        'Rent':                5400,
        'Healthcare':          5700,
        'Personal/Shopping':   5800,
        'Insurance/Taxes':     5900,
        'Savings/Investments': 5910,
        'Charity/Gifts':       5930,
        'Misc/Buffer':         5950,
    });

    // =====================================================================
    // Budget Status
    // =====================================================================
    const BudgetStatus = Object.freeze({
        ON_TRACK: 'on-track',
        APPROACHING: 'approaching',
        OVER: 'over',
    });

    // =====================================================================
    // Display Constants
    // =====================================================================
    const MONTHS_SHORT = Object.freeze([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]);
    const MONTHS_LONG = Object.freeze([
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ]);
    const TOAST_DURATION_SHORT = 2500;  // standard toast
    const TOAST_DURATION_LONG  = 8000;  // toast with action button (e.g. Undo)

    // =====================================================================
    // Export
    // =====================================================================
    global.FCL = global.FCL || {};
    global.FCL.Types = {
        APP_VERSION,
        APP_NAME,
        AccountType,
        NormalBalance,
        EntryType,
        EntrySource,
        MAX_AMOUNT,
        MAX_NOTES_LENGTH,
        MAX_MEMO_LENGTH,
        MAX_ACCOUNT_NAME_LENGTH,
        MIN_DATE_YEAR,
        ITEMS_PER_PAGE,
        BALANCE_TOLERANCE,
        BudgetStatus,
        MONTHS_SHORT,
        MONTHS_LONG,
        TOAST_DURATION_SHORT,
        TOAST_DURATION_LONG,
        Currencies,
        SimpleCategories,
        CategoryAccountMap,
    };

})(window);
