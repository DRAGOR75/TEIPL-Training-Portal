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
