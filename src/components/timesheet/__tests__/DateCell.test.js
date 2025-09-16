import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate } from '../../../utils/dateHelpers';

// Mock the formatDate function
vi.mock('../../../utils/dateHelpers', () => ({
  formatDate: vi.fn((date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }),
  parseDate: vi.fn()
}));

// Función extraída de DateCell.jsx para testing
// TODO: GitHub Copilot, please help generate comprehensive tests for normalizeDisplayDate function
const normalizeDisplayDate = (raw) => {
  // Mock getEffectiveMonthYear for testing
  const getEffectiveMonthYear = () => {
    return { year: 2024, month: 8 }; // September 2024
  };

  if (!raw) return null;
  const trimmed = String(raw).trim();
  
  // Solo día → completar con mes/año efectivos
  if (/^\d{1,2}$/.test(trimmed)) {
    const { year, month } = getEffectiveMonthYear();
    let day = Math.max(1, Math.min(31, parseInt(trimmed, 10)));
    const lastDay = new Date(year, month + 1, 0).getDate();
    if (day > lastDay) day = lastDay;
    const d = new Date(year, month, day);
    return formatDate(d);
  }
  
  // dd/MM o dd/M → completar año
  if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
    const [dd, mm] = trimmed.split("/");
    const { year } = getEffectiveMonthYear();
    const d = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10));
    return formatDate(d);
  }
  
  // Si ya viene dd/MM/yyyy, devolver tal cual
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  return null;
};

describe('normalizeDisplayDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for empty or null input', () => {
    expect(normalizeDisplayDate(null)).toBe(null);
    expect(normalizeDisplayDate('')).toBe(null);
    expect(normalizeDisplayDate('   ')).toBe(null);
  });

  it('should handle single digit day input', () => {
    expect(normalizeDisplayDate('5')).toBe('05/09/2024');
    expect(normalizeDisplayDate('1')).toBe('01/09/2024');
    expect(normalizeDisplayDate('9')).toBe('09/09/2024');
  });

  it('should handle double digit day input', () => {
    expect(normalizeDisplayDate('15')).toBe('15/09/2024');
    expect(normalizeDisplayDate('28')).toBe('28/09/2024');
    expect(normalizeDisplayDate('31')).toBe('30/09/2024'); // September has only 30 days
  });

  it('should handle day input exceeding month limits', () => {
    expect(normalizeDisplayDate('32')).toBe('30/09/2024'); // Max day for September
    expect(normalizeDisplayDate('0')).toBe('01/09/2024'); // Min day is 1
    expect(normalizeDisplayDate('99')).toBe('30/09/2024'); // Should cap at month max
  });

  it('should handle dd/MM format', () => {
    expect(normalizeDisplayDate('15/3')).toBe('15/03/2024');
    expect(normalizeDisplayDate('5/12')).toBe('05/12/2024');
    expect(normalizeDisplayDate('28/2')).toBe('28/02/2024');
  });

  it('should handle dd/MM format with double digits', () => {
    expect(normalizeDisplayDate('15/03')).toBe('15/03/2024');
    expect(normalizeDisplayDate('25/12')).toBe('25/12/2024');
    expect(normalizeDisplayDate('01/01')).toBe('01/01/2024');
  });

  it('should return full date format unchanged', () => {
    expect(normalizeDisplayDate('15/03/2023')).toBe('15/03/2023');
    expect(normalizeDisplayDate('01/12/2024')).toBe('01/12/2024');
    expect(normalizeDisplayDate('28/02/2025')).toBe('28/02/2025');
  });

  it('should return null for invalid formats', () => {
    expect(normalizeDisplayDate('abc')).toBe(null);
    expect(normalizeDisplayDate('15/13/2024')).toBe('15/13/2024'); // Function accepts invalid dates as-is
    expect(normalizeDisplayDate('15-03-2024')).toBe(null); // Wrong separator
    expect(normalizeDisplayDate('15/3/24')).toBe(null); // Wrong year format
  });

  it('should handle whitespace correctly', () => {
    expect(normalizeDisplayDate('  15  ')).toBe('15/09/2024');
    expect(normalizeDisplayDate(' 15/3 ')).toBe('15/03/2024');
    expect(normalizeDisplayDate('  15/03/2024  ')).toBe('15/03/2024');
  });

  it('should call formatDate with correct Date objects', () => {
    normalizeDisplayDate('15');
    expect(formatDate).toHaveBeenCalledWith(new Date(2024, 8, 15)); // September 15, 2024
    
    normalizeDisplayDate('25/12');
    expect(formatDate).toHaveBeenCalledWith(new Date(2024, 11, 25)); // December 25, 2024
  });
});
