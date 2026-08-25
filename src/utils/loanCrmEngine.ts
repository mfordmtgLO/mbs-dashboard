import { ClientLoanClosingRecord, LoanProgramType, MBSQuote, CustomMbsWatchlist } from '../types';
import { decimalTo32nds } from './mbsCalculations';

export const WATCHLIST_STORAGE_KEY = 'mbs_custom_watchlists_v1';
export const CLIENT_CRM_STORAGE_KEY = 'mbs_client_loan_crm_v1';

export const DEFAULT_WATCHLISTS: CustomMbsWatchlist[] = [
  {
    id: 'benchmark-defaults',
    name: 'Production Core Benchmarks (5.5, 6.0, 6.5)',
    description: 'Standard agency production coupon stack (Fannie/Freddie 30Y & Ginnie II)',
    isDefault: true,
    couponIds: ['us-10y-treasury', 'umbs-30-55', 'umbs-30-60', 'umbs-30-65', 'gnma-30-55', 'gnma-30-60', 'gnma-30-65'],
  },
  {
    id: 'full-30yr-stack',
    name: 'Deep 30-Year Conforming & Govt Stack (4.5% - 7.5%)',
    description: 'Extended spectrum for discount loans to premium cash-out and high DTI pipelines',
    couponIds: ['umbs-30-45', 'umbs-30-50', 'umbs-30-55', 'umbs-30-60', 'umbs-30-65', 'umbs-30-70', 'gnma-30-55', 'gnma-30-60', 'gnma-30-65'],
  },
  {
    id: 'government-fha-va',
    name: 'Ginnie Mae Govt Desk (FHA, VA, USDA RD)',
    description: 'Specialized GNMA II pools tracking FHA, VA, and USDA RD production',
    couponIds: ['gnma-30-50', 'gnma-30-55', 'gnma-30-60', 'gnma-30-65', 'gnma-30-70'],
  },
  {
    id: '15yr-conforming',
    name: '15-Year Refi & Accelerated Amortization Stack',
    description: '15-Year UMBS coupons for rapid refi retention and prime borrowers',
    couponIds: ['umbs-15-45', 'umbs-15-50', 'umbs-15-55', 'umbs-15-60'],
  },
  {
    id: 'custom-high-yield',
    name: 'High Note Rate Opportunities (6.5% - 7.5% Closings)',
    description: 'Targeted watchlist for monitoring loans closed at peaks for rapid refi trigger alerts',
    couponIds: ['umbs-30-60', 'umbs-30-65', 'umbs-30-70', 'gnma-30-65', 'gnma-30-70'],
  },
];

// Map program and rate to corresponding MBS Coupon Symbol
export function determineMbsCouponForLoan(program: LoanProgramType, interestRate: number): string {
  const isGovt = program === 'FHA' || program === 'VA' || program === 'USDA RD';
  // Coupon is typically Note Rate minus ~62.5 - 75 bps servicing & guarantee fee, rounded to nearest 0.5%
  const roughCoupon = Math.round((interestRate - 0.75) * 2) / 2;
  const clampedCoupon = Math.min(Math.max(roughCoupon, 4.5), 7.5).toFixed(1);

  if (isGovt) {
    return `GNMA II 30yr ${clampedCoupon}%`;
  }
  return `UMBS 30yr ${clampedCoupon}%`;
}

// Estimate historical MBS coupon price at loan funding date
export function lookupHistoricalMbsPrice(couponSymbol: string, fundedDateStr: string): number {
  const fundedDate = new Date(fundedDateStr);
  const now = new Date('2026-08-25');
  const diffDays = Math.max(1, Math.round((now.getTime() - fundedDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Base price for coupon
  const rateMatch = couponSymbol.match(/(\d+\.\d+)%/);
  const couponRate = rateMatch ? parseFloat(rateMatch[1]) : 6.0;
  
  // Benchmark base price around 100 par
  let basePrice = 100.0 + (couponRate - 6.0) * 2.2;

  // If funded during peak yield times (e.g. 60-180 days ago when 10Y was ~4.85%), price was lower (e.g. 98.5 - 99.8)
  const timeFactor = Math.sin(diffDays / 45) * 0.8 - (diffDays > 60 ? 1.25 : 0.4);
  const finalPrice = Math.max(94.0, Math.min(103.5, basePrice + timeFactor));

  return +finalPrice.toFixed(4);
}

// Calculate monthly Principal and Interest payment
export function calculateMonthlyPayment(principal: number, annualRatePct: number, termYears = 30): number {
  if (principal <= 0 || annualRatePct <= 0) return 0;
  const monthlyRate = (annualRatePct / 100) / 12;
  const numPayments = termYears * 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return +payment.toFixed(2);
}

// Process a loan record with current live MBS Quotes
export function enrichLoanClosingWithLiveMbs(
  record: Partial<ClientLoanClosingRecord>,
  currentQuotes: MBSQuote[]
): ClientLoanClosingRecord {
  const id = record.id || `loan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const clientFirstName = record.clientFirstName || 'Client';
  const clientLastName = record.clientLastName || 'Borrower';
  const propertyAddress = record.propertyAddress || '123 Main St, Anytown, USA';
  const loanAmount = record.loanAmount || 450000;
  const purchasePrice = record.purchasePrice || Math.round(loanAmount / 0.8);
  const ltv = record.ltv || +( (loanAmount / purchasePrice) * 100 ).toFixed(1);
  const fundedDate = record.fundedDate || '2026-04-15';
  const interestRate = record.interestRate || 6.875;
  const program = record.program || 'Conventional';

  const mbsCouponUsed = record.mbsCouponUsed || determineMbsCouponForLoan(program, interestRate);

  // Find live quote matching coupon or derive from closest
  const matchedQuote = currentQuotes.find(
    (q) => q.symbol.toLowerCase() === mbsCouponUsed.toLowerCase() ||
           q.name.toLowerCase().includes(mbsCouponUsed.toLowerCase())
  ) || currentQuotes.find((q) => q.id === 'umbs-30-60') || currentQuotes[0];

  const currentMbsPrice = matchedQuote ? matchedQuote.price : 101.125;
  const currentMbsPriceFormatted = matchedQuote ? matchedQuote.priceFormatted : decimalTo32nds(currentMbsPrice);

  const fundedMbsPrice = record.fundedMbsPrice || lookupHistoricalMbsPrice(mbsCouponUsed, fundedDate);
  const fundedMbsPriceFormatted = record.fundedMbsPriceFormatted || decimalTo32nds(fundedMbsPrice);

  // MBS Spread Change
  const priceDelta = currentMbsPrice - fundedMbsPrice;
  const mbsSpreadChangeBps = +(priceDelta * 100).toFixed(1);
  const mbsSpreadChange32nds = Math.round(priceDelta * 32);

  // Translate MBS Price Change to Primary Note Rate Change
  // Rule of thumb: ~100 bps in MBS price ≈ -30 to -35 bps in borrower note rate (Duration ~ 3.5 - 4.0)
  const duration = matchedQuote?.duration || 3.6;
  const translatedRateChangePct = +(- (priceDelta / duration)).toFixed(3);

  const currentImpliedRefiRate = Math.max(4.25, +(interestRate + translatedRateChangePct).toFixed(3));

  // Monthly payment comparisons
  const originalMonthlyPayment = calculateMonthlyPayment(loanAmount, interestRate);
  const newImpliedPayment = calculateMonthlyPayment(loanAmount, currentImpliedRefiRate);
  const monthlySavings = +(Math.max(0, originalMonthlyPayment - newImpliedPayment)).toFixed(2);
  const annualSavings = +(monthlySavings * 12).toFixed(2);

  // Refi Opportunity Trigger (e.g. rate drop > 0.35% and savings > $75/mo)
  const refiOpportunityFlag = translatedRateChangePct <= -0.30 && monthlySavings >= 75;

  return {
    id,
    clientFirstName,
    clientLastName,
    propertyAddress,
    loanAmount,
    purchasePrice,
    ltv,
    fundedDate,
    interestRate,
    program,
    mbsCouponUsed,
    fundedMbsPrice,
    fundedMbsPriceFormatted,
    currentMbsPrice,
    currentMbsPriceFormatted,
    mbsSpreadChangeBps,
    mbsSpreadChange32nds,
    translatedRateChangePct,
    currentImpliedRefiRate,
    refiOpportunityFlag,
    monthlySavings,
    annualSavings,
    clientPhone: record.clientPhone || '(555) 234-8901',
    clientEmail: record.clientEmail || `${clientFirstName.toLowerCase()}.${clientLastName.toLowerCase()}@example.com`,
    notes: record.notes || 'Funded purchase transaction.',
  };
}

// Initial Sample Loan Closings for LO CRM Desk
export const INITIAL_SAMPLE_LOAN_CLOSINGS: Partial<ClientLoanClosingRecord>[] = [
  {
    id: 'loan-001',
    clientFirstName: 'Marcus',
    clientLastName: 'Vance',
    propertyAddress: '742 Evergreen Terr, Springfield, OR',
    loanAmount: 580000,
    purchasePrice: 725000,
    ltv: 80.0,
    fundedDate: '2026-03-12',
    interestRate: 7.125,
    program: 'Conventional',
    mbsCouponUsed: 'UMBS 30yr 6.5%',
    fundedMbsPrice: 99.25,
    notes: 'Primary Residence. Closed during spring Treasury spike. High priority refi candidate.',
  },
  {
    id: 'loan-002',
    clientFirstName: 'Elena',
    clientLastName: 'Rostova',
    propertyAddress: '1488 Biscayne Blvd #12B, Miami, FL',
    loanAmount: 640000,
    purchasePrice: 800000,
    ltv: 80.0,
    fundedDate: '2026-04-20',
    interestRate: 6.990,
    program: 'Conventional',
    mbsCouponUsed: 'UMBS 30yr 6.0%',
    fundedMbsPrice: 99.625,
    notes: 'Condo purchase. Loan officer follow-up requested upon MBS +100bps surge.',
  },
  {
    id: 'loan-003',
    clientFirstName: 'Devon',
    clientLastName: 'Miller',
    propertyAddress: '3204 Prairie Sun Way, Austin, TX',
    loanAmount: 435000,
    purchasePrice: 450000,
    ltv: 96.5,
    fundedDate: '2026-02-18',
    interestRate: 6.875,
    program: 'FHA',
    mbsCouponUsed: 'GNMA II 30yr 6.0%',
    fundedMbsPrice: 99.125,
    notes: 'FHA Streamline refi prospect once rates improve by 50 bps.',
  },
  {
    id: 'loan-004',
    clientFirstName: 'Captain Robert',
    clientLastName: 'Holloway',
    propertyAddress: '881 Harbor Point Rd, Virginia Beach, VA',
    loanAmount: 520000,
    purchasePrice: 520000,
    ltv: 100.0,
    fundedDate: '2026-01-25',
    interestRate: 6.625,
    program: 'VA',
    mbsCouponUsed: 'GNMA II 30yr 5.5%',
    fundedMbsPrice: 98.875,
    notes: 'VA IRRRL refi candidate. No appraisal required.',
  },
  {
    id: 'loan-005',
    clientFirstName: 'Sarah & Thomas',
    clientLastName: 'Jenkins',
    propertyAddress: '412 Country Ridge Lane, Bozeman, MT',
    loanAmount: 390000,
    purchasePrice: 390000,
    ltv: 100.0,
    fundedDate: '2026-05-10',
    interestRate: 7.250,
    program: 'USDA RD',
    mbsCouponUsed: 'GNMA II 30yr 6.5%',
    fundedMbsPrice: 99.50,
    notes: 'Rural Development purchase. Strong equity growth and rate drop alert.',
  },
  {
    id: 'loan-006',
    clientFirstName: 'Derrick',
    clientLastName: 'Sterling',
    propertyAddress: '2214 Pacific Palisades Dr, Newport Beach, CA',
    loanAmount: 1150000,
    purchasePrice: 1550000,
    ltv: 74.2,
    fundedDate: '2026-03-30',
    interestRate: 7.375,
    program: 'Jumbo',
    mbsCouponUsed: 'UMBS 30yr 6.5%',
    fundedMbsPrice: 99.375,
    notes: 'High net worth borrower. Substantial cash savings on refi.',
  },
  {
    id: 'loan-007',
    clientFirstName: 'Chloe',
    clientLastName: 'Nguyen',
    propertyAddress: '519 Pinehurst St, Seattle, WA',
    loanAmount: 495000,
    purchasePrice: 550000,
    ltv: 90.0,
    fundedDate: '2026-06-02',
    interestRate: 6.750,
    program: 'Conventional',
    mbsCouponUsed: 'UMBS 30yr 6.0%',
    fundedMbsPrice: 100.125,
    notes: 'First-time homebuyer. Monitoring for 6.25% target note rate.',
  },
];

// LocalStorage helpers
export function loadSavedWatchlists(): CustomMbsWatchlist[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLISTS;
  try {
    const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load custom watchlists from localStorage:', e);
  }
  return DEFAULT_WATCHLISTS;
}

export function saveWatchlists(watchlists: CustomMbsWatchlist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlists));
  } catch (e) {
    console.error('Failed to save watchlists to localStorage:', e);
  }
}

export function loadSavedClientLoans(currentQuotes: MBSQuote[]): ClientLoanClosingRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_SAMPLE_LOAN_CLOSINGS.map((c) => enrichLoanClosingWithLiveMbs(c, currentQuotes));
  }
  try {
    const saved = localStorage.getItem(CLIENT_CRM_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => enrichLoanClosingWithLiveMbs(item, currentQuotes));
      }
    }
  } catch (e) {
    console.error('Failed to load client loans from localStorage:', e);
  }
  const initialized = INITIAL_SAMPLE_LOAN_CLOSINGS.map((c) => enrichLoanClosingWithLiveMbs(c, currentQuotes));
  saveClientLoans(initialized);
  return initialized;
}

export function saveClientLoans(records: ClientLoanClosingRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLIENT_CRM_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save client loans to localStorage:', e);
  }
}

// Parse CSV / TSV text imported by user
export function parseLoanClosingCsv(csvText: string, currentQuotes: MBSQuote[]): ClientLoanClosingRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const records: ClientLoanClosingRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV quotes
    const values = line.split(/[,\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const firstName = rowObj['first name'] || rowObj['client first name'] || rowObj['firstname'] || values[0] || 'Client';
    const lastName = rowObj['last name'] || rowObj['client last name'] || rowObj['lastname'] || values[1] || 'Borrower';
    const propertyAddress = rowObj['property address'] || rowObj['address'] || rowObj['property'] || values[2] || 'Property Address';
    const loanAmount = parseFloat((rowObj['loan amount'] || rowObj['amount'] || values[3] || '400000').replace(/[^0-9.]/g, '')) || 400000;
    const purchasePrice = parseFloat((rowObj['purchase price'] || rowObj['price'] || values[4] || `${loanAmount * 1.25}`).replace(/[^0-9.]/g, '')) || loanAmount * 1.25;
    const ltv = parseFloat((rowObj['ltv'] || values[5] || `${(loanAmount / purchasePrice) * 100}`).replace(/[^0-9.]/g, '')) || 80.0;
    const fundedDate = rowObj['funded date'] || rowObj['closing date'] || rowObj['date'] || values[6] || '2026-03-15';
    const interestRate = parseFloat((rowObj['interest rate'] || rowObj['rate'] || rowObj['note rate'] || values[7] || '6.875').replace(/[^0-9.]/g, '')) || 6.875;
    
    let rawProgram = (rowObj['program'] || rowObj['loan type'] || values[8] || 'Conventional').toUpperCase();
    let program: LoanProgramType = 'Conventional';
    if (rawProgram.includes('FHA')) program = 'FHA';
    else if (rawProgram.includes('VA')) program = 'VA';
    else if (rawProgram.includes('USDA') || rawProgram.includes('RD')) program = 'USDA RD';
    else if (rawProgram.includes('JUMBO')) program = 'Jumbo';

    const enriched = enrichLoanClosingWithLiveMbs({
      clientFirstName: firstName,
      clientLastName: lastName,
      propertyAddress,
      loanAmount,
      purchasePrice,
      ltv,
      fundedDate,
      interestRate,
      program,
      notes: rowObj['notes'] || values[9] || 'Imported via CSV/Excel.',
    }, currentQuotes);

    records.push(enriched);
  }

  return records;
}

// Generate CSV export string
export function exportLoansToCsv(records: ClientLoanClosingRecord[]): string {
  const headers = [
    'Client First Name',
    'Client Last Name',
    'Property Address',
    'Loan Amount',
    'Purchase Price',
    'LTV (%)',
    'Funded Date',
    'Note Interest Rate (%)',
    'Loan Program',
    'MBS Coupon Used',
    'Funding MBS Price',
    'Today MBS Price',
    'MBS Spread Delta (bps)',
    'Translated Rate Change (%)',
    'Current Implied Refi Rate (%)',
    'Refi Opportunity Alert',
    'Est. Monthly Payment Savings ($)',
    'Est. Annual Savings ($)',
    'Notes'
  ];

  const rows = records.map((r) => [
    `"${r.clientFirstName}"`,
    `"${r.clientLastName}"`,
    `"${r.propertyAddress}"`,
    r.loanAmount,
    r.purchasePrice,
    r.ltv,
    r.fundedDate,
    r.interestRate,
    `"${r.program}"`,
    `"${r.mbsCouponUsed}"`,
    `"${r.fundedMbsPriceFormatted} (${r.fundedMbsPrice.toFixed(3)})"`,
    `"${r.currentMbsPriceFormatted} (${r.currentMbsPrice.toFixed(3)})"`,
    `${r.mbsSpreadChangeBps > 0 ? '+' : ''}${r.mbsSpreadChangeBps} bps`,
    `${r.translatedRateChangePct > 0 ? '+' : ''}${r.translatedRateChangePct}%`,
    `${r.currentImpliedRefiRate}%`,
    r.refiOpportunityFlag ? 'HOT REFI OPPORTUNITY' : 'MONITORING',
    r.monthlySavings,
    r.annualSavings,
    `"${r.notes || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
