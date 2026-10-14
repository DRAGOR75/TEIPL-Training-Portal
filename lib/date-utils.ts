/**
 * Returns the local date string (YYYY-MM-DD) for server-side queries.
 * Defaults to IST (UTC+5:30) offset adjustment if no date is provided.
 * 
 * This effectively shifts the UTC server time to match the expected "wall clock" day
 * for the primary user base (India), preventing "yesterday's data" issues late at night UTC.
 */
export function getServerLocalDateString(date: Date = new Date()): string {
    // IST Offset in minutes (+5:30 = 330 minutes)
    // Note: getTimezoneOffset() returns -330 for IST, but we are adding time manually to UTC.
    // We want to ADD 5.5 hours to the UTC timestamp to get the "Local" time value,
    // then ISO stringify that time value.
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const localDate = new Date(date.getTime() + IST_OFFSET_MS);
    return localDate.toISOString().split('T')[0];
}

/**
 * Calculates the financial year format (e.g., "24-25", "25-26", "26-27") from a given date.
 * Financial year in India runs April 1 - March 31.
 */
export function getFinancialYear(dateInput?: string | Date | null): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const fullYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-11: Jan=0, Feb=1, Mar=2, Apr=3...

    let startYear: number, endYear: number;
    if (currentMonth < 3) {
        startYear = fullYear - 1;
        endYear = fullYear;
    } else {
        startYear = fullYear;
        endYear = fullYear + 1;
    }

    return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

/**
 * Returns date range bounds for a given financial year string (e.g., "24-25" or "FY 24-25").
 * Covers April 1 00:00:00 IST of startYear to March 31 23:59:59.999 IST of endYear.
 */
export function getFinancialYearDateRange(fyInput?: string | null): {
    start: Date;
    end: Date;
    queryStart: Date;
    queryEnd: Date;
} | null {
    if (!fyInput || fyInput.toUpperCase() === 'ALL') return null;
    const cleaned = fyInput.replace(/^FY\s*/i, '').trim();
    const parts = cleaned.split('-');
    if (parts.length !== 2) return null;
    let startY = parseInt(parts[0], 10);
    let endY = parseInt(parts[1], 10);
    if (isNaN(startY) || isNaN(endY)) return null;
    if (startY < 100) startY = (startY > 50 ? 1900 : 2000) + startY;
    if (endY < 100) endY = (endY > 50 ? 1900 : 2000) + endY;

    const start = new Date(`${startY}-04-01T00:00:00+05:30`);
    const end = new Date(`${endY}-03-31T23:59:59.999+05:30`);

    // 1-day safety buffer for SQL queries
    const queryStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const queryEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    return { start, end, queryStart, queryEnd };
}

const MONTHS_MAP: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * Parses flexible date inputs including DD-MMM-YY (e.g. 08-Feb-21),
 * Excel numeric serials (e.g. 44235), DD/MM/YYYY, or YYYY-MM-DD
 * into a standardized YYYY-MM-DD string without timezone skew.
 */
export function parseFlexibleDate(val: any): string | undefined {
    if (val === null || val === undefined || val === '') return undefined;
    if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (isNaN(d.getTime())) return undefined;
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    const str = String(val).trim();
    if (!str) return undefined;

    // Match DD-MMM-YY or DD-MMM-YYYY (e.g. 08-Feb-21 or 08-Feb-2021)
    const mAlpha = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})$/i);
    if (mAlpha) {
        const d = mAlpha[1].padStart(2, '0');
        const mon = MONTHS_MAP[mAlpha[2].toLowerCase()];
        let y = mAlpha[3];
        if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
        if (mon) return `${y}-${mon}-${d}`;
    }

    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const mNum = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (mNum) {
        const d = mNum[1].padStart(2, '0');
        const m = mNum[2].padStart(2, '0');
        let y = mNum[3];
        if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
        return `${y}-${m}-${d}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return str;
}
