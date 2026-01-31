import { describe, it, expect } from 'vitest';
import { getServerLocalDateString } from './date-utils';

describe('getServerLocalDateString', () => {
    it('should return the correct date string for a given date', () => {
        // Create a fixed date: 2023-10-25T10:00:00Z (UTC)
        // IST is UTC+5:30, so this would be 15:30:00 IST on the same day.
        const date = new Date('2023-10-25T10:00:00Z');
        const result = getServerLocalDateString(date);
        expect(result).toBe('2023-10-25');
    });

    it('should handle date rollovers correctly', () => {
        // Create a date close to midnight UTC: 2023-10-25T20:00:00Z
        // IST is UTC+5:30, so this adds 5.5 hours.
        // 20:00 + 5.5 hours = 25:30 = 01:30 on the NEXT day (2023-10-26).
        const date = new Date('2023-10-25T20:00:00Z');
        const result = getServerLocalDateString(date);
        expect(result).toBe('2023-10-26');
    });

    it('should handle date rollovers near month end', () => {
        // 2023-10-31T20:00:00Z
        // + 5.5 hours => 2023-11-01T01:30:00 IST
        const date = new Date('2023-10-31T20:00:00Z');
        const result = getServerLocalDateString(date);
        expect(result).toBe('2023-11-01');
    });

    it('should default to "now" if no date provided', () => {
        // Ideally we'd mock the system time, but for a simple check:
        const result = getServerLocalDateString();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
