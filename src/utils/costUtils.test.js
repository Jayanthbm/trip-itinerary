import { describe, it, expect } from 'vitest';
import { parseCost } from './costUtils';

describe('parseCost', () => {
  it('passes numbers through', () => {
    expect(parseCost(0)).toBe(0);
    expect(parseCost(500)).toBe(500);
    expect(parseCost(1234.5)).toBe(1234.5);
  });

  it('treats non-finite numbers as 0', () => {
    expect(parseCost(NaN)).toBe(0);
    expect(parseCost(Infinity)).toBe(0);
    expect(parseCost(-Infinity)).toBe(0);
  });

  it('returns 0 for empty/nullish values', () => {
    expect(parseCost(undefined)).toBe(0);
    expect(parseCost(null)).toBe(0);
    expect(parseCost('')).toBe(0);
    expect(parseCost('   ')).toBe(0);
  });

  it('returns 0 for non-string non-numbers', () => {
    expect(parseCost({})).toBe(0);
    expect(parseCost(['500'])).toBe(0);
    expect(parseCost(true)).toBe(0);
  });

  it('parses plain digit strings', () => {
    expect(parseCost('30000')).toBe(30000);
    expect(parseCost('  250 ')).toBe(250);
  });

  it('parses currency-formatted strings', () => {
    expect(parseCost('₹30,000')).toBe(30000);
    expect(parseCost('₹30000')).toBe(30000);
    expect(parseCost('$1,250.75')).toBe(1250.75);
    expect(parseCost('₫2,000,000')).toBe(2000000);
  });

  it('takes the FIRST number of a range string (decision #3)', () => {
    expect(parseCost('₹600 – ₹1,000')).toBe(600);
    expect(parseCost('₹1,500 - ₹2,500')).toBe(1500);
    expect(parseCost('100 to 200')).toBe(100);
    expect(parseCost('₹800–₹1,200')).toBe(800);
  });

  it('returns 0 for unparseable strings', () => {
    expect(parseCost('free')).toBe(0);
    expect(parseCost('TBD')).toBe(0);
    expect(parseCost('₹')).toBe(0);
  });
});
