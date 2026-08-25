import * as XLSX from 'xlsx';
import { MBSQuote } from '../types';
import { decimalTo32nds } from './mbsCalculations';

export type LoanProgram = 'CONVENTIONAL' | 'FHA' | 'VA' | 'USDA_RD';

export interface ClientFundedLoan {
  id: string;
  firstName: string;
  lastName: string;
  propertyAddress: string;
  city?: string;
  state?: string;
  zip?: string;
  loanAmount: number;
  purchasePrice: number;
  ltv: number;
  fundedDate: string;
  interestRate: number; // e.g. 7.375
  program: LoanProgram;
  
  // Custom or additional raw fields
  loanNumber?: string;
  termMonths?: number;
}

export interface AnalyzedClientLoan extends ClientFundedLoan {
  // MBS Coupon at Funding
  mbsAgency: 'FNMA' | 'GNMA' | 'FHLMC';
  mbsCouponRate: number; // e.g. 6.5
  mbsCouponSymbol: string; // e.g. "FNMA 30Y 6.5%"
  mbsFundedPrice: number; // price at funded date e.g. 99.125
  mbsFundedPriceFormatted: string; // "99-04"

  // MBS Coupon Today
  mbsCurrentPrice: number; // today's price e.g. 102.375
  mbsCurrentPriceFormatted: string; // "102-12"

  // Spread & Rate Changes
  mbsSpreadChangePts: number; // e.g. +3.25 pts
  mbsSpreadChangeBps: number; // e.g. +325 bps
  mbsSpreadChange32nds: number; // e.g. +104/32nds
  
  // Translated Current Interest Rate
  todayEstimatedMarketRate: number; // e.g. 6.375%
  rateChangeFromFunding: number; // e.g. -1.000% (-100 bps)
  
  // Monthly Payment & Refi Opportunity
  originalMonthlyPI: number;
  todayMonthlyPI: number;
  monthlySavings: number;
  annualSavings: number;
  refiStatus: 'HIGH_TRIGGER' | 'MODERATE_TRIGGER' | 'MONITOR' | 'LOCKED_IN';
  refiStatusLabel: string;
}

/**
 * Calculate Monthly P&I Payment using standard amortization
 */
export function calculateMonthlyPI(principal: number, annualRatePercent: number, termYears: number = 30): number {
  if (principal <= 0 || annualRatePercent <= 0) return 0;
  const monthlyRate = (annualRatePercent / 100) / 12;
  const numberOfPayments = termYears * 12;
  const monthlyPayment = (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Map loan program and interest rate to the appropriate MBS Coupon
 */
export function deriveMbsCouponForLoan(program: LoanProgram, noteRate: number): {
  agency: 'FNMA' | 'GNMA' | 'FHLMC';
  couponRate: number;
  symbol: string;
} {
  const isGov = program === 'FHA' || program === 'VA' || program === 'USDA_RD';
  const agency = isGov ? 'GNMA' : 'FNMA';

  // Standard spread between note rate and MBS coupon is typically ~50 - 75 bps
  // Note rate 7.375% -> MBS 6.5% coupon (87.5 bps spread)
  // Note rate 7.000% -> MBS 6.5% coupon (50 bps spread)
  // Note rate 6.875% -> MBS 6.0% coupon (87.5 bps spread)
  // Note rate 6.500% -> MBS 6.0% coupon (50 bps spread)
  // Note rate 6.375% -> MBS 5.5% coupon (87.5 bps spread)
  // Note rate 6.000% -> MBS 5.5% coupon (50 bps spread)
  // Note rate 5.500% -> MBS 5.0% coupon
  // Note rate 4.500% -> MBS 4.0% coupon
  // Note rate 3.500% -> MBS 3.0% coupon
  // Note rate 2.875% -> MBS 2.5% coupon

  let couponRate = Math.floor((noteRate - 0.375) * 2) / 2;
  // Bound to sensible 0.5% increments between 2.0% and 8.5%
  couponRate = Math.max(2.0, Math.min(8.5, couponRate));

  const symbol = `${agency} 30Y ${couponRate.toFixed(1)}%`;
  return { agency, couponRate, symbol };
}

/**
 * Estimate historical MBS price for coupon on the funding date
 */
export function estimateHistoricalMbsPrice(couponRate: number, fundedDateStr: string, isGov: boolean): number {
  const parsedDate = new Date(fundedDateStr);
  const year = isNaN(parsedDate.getFullYear()) ? 2023 : parsedDate.getFullYear();
  const month = isNaN(parsedDate.getMonth()) ? 9 : parsedDate.getMonth();

  // Baseline yield regimes over time:
  // 2020-2021: 10Y ~ 1.0 - 1.6%, rates 2.75 - 3.25%
  // 2022: 10Y ~ 2.0 - 4.2%, rates 3.50 - 7.00%
  // 2023 Late (Sep-Nov): 10Y ~ 4.80 - 5.00%, rates 7.75 - 8.00%
  // 2024 Early-Mid: 10Y ~ 4.20 - 4.70%, rates 6.875 - 7.25%
  // 2025-2026: 10Y ~ 4.20 - 4.66%, rates 6.375 - 6.625%

  let basePriceAtIssuance = 99.50; // Par at issuance date is typically 99.00 - 100.50

  if (year === 2023 && month >= 8 && month <= 11) {
    // Peak rate peak sell-off period
    basePriceAtIssuance = 98.75;
  } else if (year === 2022 && month >= 9) {
    basePriceAtIssuance = 99.125;
  } else if (year <= 2021) {
    basePriceAtIssuance = 101.50;
  } else {
    basePriceAtIssuance = 99.875;
  }

  if (isGov) basePriceAtIssuance += 0.25;

  return +basePriceAtIssuance.toFixed(4);
}

/**
 * Get or estimate current MBS price for any coupon rate
 */
export function getCurrentMbsPriceForCoupon(
  agency: 'FNMA' | 'GNMA' | 'FHLMC',
  couponRate: number,
  quotes: MBSQuote[]
): number {
  // Check if active quote exists in quotes list
  const existingQuote = quotes.find(
    (q) => q.agency === agency && (q.couponRate === couponRate || q.symbol.includes(`${couponRate.toFixed(1)}%`))
  );

  if (existingQuote) {
    return existingQuote.price;
  }

  // If quote not in live list, dynamically compute based on baseline 6.0% @ 101.125
  const isGov = agency === 'GNMA';
  const core60Price = quotes.find((q) => q.agency === agency && q.couponRate === 6.0)?.price ?? (isGov ? 101.4375 : 101.125);
  
  // Each 0.5% coupon delta is approximately ~2.5 - 3.2 points in price
  const diffFrom60 = couponRate - 6.0;
  const estimatedPrice = core60Price + diffFrom60 * 2.85;

  return +estimatedPrice.toFixed(4);
}

/**
 * Perform comprehensive Portfolio & Refinance Analysis on an array of client loans
 */
export function analyzeClientFundedLoans(
  loans: ClientFundedLoan[],
  quotes: MBSQuote[],
  current10YYield: number = 4.660
): AnalyzedClientLoan[] {
  return loans.map((loan) => {
    const isGov = loan.program === 'FHA' || loan.program === 'VA' || loan.program === 'USDA_RD';
    const { agency, couponRate, symbol } = deriveMbsCouponForLoan(loan.program, loan.interestRate);

    // 1. MBS Price on Funding Date
    const mbsFundedPrice = estimateHistoricalMbsPrice(couponRate, loan.fundedDate, isGov);
    const mbsFundedPriceFormatted = decimalTo32nds(mbsFundedPrice);

    // 2. MBS Price Today
    const mbsCurrentPrice = getCurrentMbsPriceForCoupon(agency, couponRate, quotes);
    const mbsCurrentPriceFormatted = decimalTo32nds(mbsCurrentPrice);

    // 3. MBS Spread Change (points, bps, 32nds)
    const mbsSpreadChangePts = +(mbsCurrentPrice - mbsFundedPrice).toFixed(4);
    const mbsSpreadChangeBps = Math.round(mbsSpreadChangePts * 100);
    const mbsSpreadChange32nds = Math.round(mbsSpreadChangePts * 32);

    // 4. Translated Today Market Interest Rate
    // Rule of thumb: 1.00 pt in MBS price shift ≈ 0.250% (25 bps) shift in borrower note rate.
    // Price going UP means interest rate went DOWN (cheaper borrow).
    const rateShiftFromMbs = -(mbsSpreadChangePts * 0.25);
    
    // Calculate current benchmark estimated note rate for this profile
    const currentBasePar = isGov ? 6.375 : 6.625;
    const baseTargetRate = loan.interestRate + rateShiftFromMbs;
    // Bound rate within realistic market bands
    const todayEstimatedMarketRate = +(Math.round(Math.min(baseTargetRate, currentBasePar + 0.25) * 8) / 8).toFixed(3);
    const rateChangeFromFunding = +(todayEstimatedMarketRate - loan.interestRate).toFixed(3);

    // 5. Monthly Payment Analysis
    const originalMonthlyPI = calculateMonthlyPI(loan.loanAmount, loan.interestRate, 30);
    const todayMonthlyPI = calculateMonthlyPI(loan.loanAmount, todayEstimatedMarketRate, 30);
    const monthlySavings = +(originalMonthlyPI - todayMonthlyPI).toFixed(2);
    const annualSavings = +(monthlySavings * 12).toFixed(2);

    // 6. Refinance Status
    let refiStatus: 'HIGH_TRIGGER' | 'MODERATE_TRIGGER' | 'MONITOR' | 'LOCKED_IN' = 'MONITOR';
    let refiStatusLabel = 'Monitor Spread';

    if (rateChangeFromFunding <= -0.750 && monthlySavings >= 150) {
      refiStatus = 'HIGH_TRIGGER';
      refiStatusLabel = '🔥 REFI TRIGGER (High Savings)';
    } else if (rateChangeFromFunding <= -0.375 && monthlySavings >= 75) {
      refiStatus = 'MODERATE_TRIGGER';
      refiStatusLabel = '⚡ REFI OPPORTUNITY (Moderate)';
    } else if (rateChangeFromFunding < 0) {
      refiStatus = 'MONITOR';
      refiStatusLabel = '👀 Spread Improving';
    } else {
      refiStatus = 'LOCKED_IN';
      refiStatusLabel = '🔒 Low Rate Retained';
    }

    return {
      ...loan,
      mbsAgency: agency,
      mbsCouponRate: couponRate,
      mbsCouponSymbol: symbol,
      mbsFundedPrice,
      mbsFundedPriceFormatted,
      mbsCurrentPrice,
      mbsCurrentPriceFormatted,
      mbsSpreadChangePts,
      mbsSpreadChangeBps,
      mbsSpreadChange32nds,
      todayEstimatedMarketRate,
      rateChangeFromFunding,
      originalMonthlyPI,
      todayMonthlyPI,
      monthlySavings,
      annualSavings,
      refiStatus,
      refiStatusLabel,
    };
  });
}

/**
 * Sample funded client pipeline dataset for instant loan officer testing
 */
export const SAMPLE_FUNDED_LOANS: ClientFundedLoan[] = [
  {
    id: 'loan-101',
    firstName: 'Marcus',
    lastName: 'Holloway',
    propertyAddress: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
    loanAmount: 485000,
    purchasePrice: 610000,
    ltv: 79.5,
    fundedDate: '2023-10-18',
    interestRate: 7.875,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984210',
  },
  {
    id: 'loan-102',
    firstName: 'Elena',
    lastName: 'Rostova',
    propertyAddress: '1428 Elm Street',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    loanAmount: 620000,
    purchasePrice: 775000,
    ltv: 80.0,
    fundedDate: '2023-11-04',
    interestRate: 7.625,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984211',
  },
  {
    id: 'loan-103',
    firstName: 'David',
    lastName: 'Chen',
    propertyAddress: '882 Ocean Avenue',
    city: 'San Diego',
    state: 'CA',
    zip: '92109',
    loanAmount: 710000,
    purchasePrice: 890000,
    ltv: 79.8,
    fundedDate: '2023-10-25',
    interestRate: 7.375,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984212',
  },
  {
    id: 'loan-104',
    firstName: 'Sarah & Keith',
    lastName: 'Miller',
    propertyAddress: '315 Pine Valley Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    loanAmount: 395000,
    purchasePrice: 410000,
    ltv: 96.3,
    fundedDate: '2023-11-15',
    interestRate: 7.250,
    program: 'FHA',
    loanNumber: 'LN-984213',
  },
  {
    id: 'loan-105',
    firstName: 'Major Robert',
    lastName: 'Vance',
    propertyAddress: '550 Patriot Way',
    city: 'Virginia Beach',
    state: 'VA',
    zip: '23451',
    loanAmount: 540000,
    purchasePrice: 540000,
    ltv: 100.0,
    fundedDate: '2023-10-12',
    interestRate: 7.125,
    program: 'VA',
    loanNumber: 'LN-984214',
  },
  {
    id: 'loan-106',
    firstName: 'Emily',
    lastName: 'Thornton',
    propertyAddress: '104 Meadowview Lane',
    city: 'Bozeman',
    state: 'MT',
    zip: '59715',
    loanAmount: 340000,
    purchasePrice: 350000,
    ltv: 97.1,
    fundedDate: '2023-09-28',
    interestRate: 7.500,
    program: 'USDA_RD',
    loanNumber: 'LN-984215',
  },
  {
    id: 'loan-107',
    firstName: 'Jonathan',
    lastName: 'Cruz',
    propertyAddress: '2405 Peachtree St NE',
    city: 'Atlanta',
    state: 'GA',
    zip: '30309',
    loanAmount: 515000,
    purchasePrice: 650000,
    ltv: 79.2,
    fundedDate: '2024-04-19',
    interestRate: 7.250,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984216',
  },
  {
    id: 'loan-108',
    firstName: 'Amanda',
    lastName: 'Sterling',
    propertyAddress: '412 Harbor Blvd',
    city: 'Tampa',
    state: 'FL',
    zip: '33602',
    loanAmount: 430000,
    purchasePrice: 550000,
    ltv: 78.1,
    fundedDate: '2024-05-14',
    interestRate: 7.000,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984217',
  },
  {
    id: 'loan-109',
    firstName: 'Tyler & Brooke',
    lastName: 'Harrison',
    propertyAddress: '780 Aspen Creek Dr',
    city: 'Boise',
    state: 'ID',
    zip: '83702',
    loanAmount: 380000,
    purchasePrice: 400000,
    ltv: 95.0,
    fundedDate: '2024-06-02',
    interestRate: 6.875,
    program: 'FHA',
    loanNumber: 'LN-984218',
  },
  {
    id: 'loan-110',
    firstName: 'Captain William',
    lastName: 'Reynolds',
    propertyAddress: '120 Heritage Way',
    city: 'San Antonio',
    state: 'TX',
    zip: '78209',
    loanAmount: 610000,
    purchasePrice: 610000,
    ltv: 100.0,
    fundedDate: '2024-03-20',
    interestRate: 6.750,
    program: 'VA',
    loanNumber: 'LN-984219',
  },
  {
    id: 'loan-111',
    firstName: 'Rachel',
    lastName: 'Goldberg',
    propertyAddress: '550 Wacker Drive #14B',
    city: 'Chicago',
    state: 'IL',
    zip: '60606',
    loanAmount: 580000,
    purchasePrice: 750000,
    ltv: 77.3,
    fundedDate: '2024-01-15',
    interestRate: 6.625,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984220',
  },
  {
    id: 'loan-112',
    firstName: 'Brian & Jessica',
    lastName: 'O\'Connor',
    propertyAddress: '920 Beacon Hill Rd',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
    loanAmount: 750000,
    purchasePrice: 950000,
    ltv: 78.9,
    fundedDate: '2022-04-10',
    interestRate: 5.125,
    program: 'CONVENTIONAL',
    loanNumber: 'LN-984221',
  },
];

/**
 * Robust CSV and Excel File Parser for Loan Officer files
 */
export function parseUploadedLoanFile(fileBuffer: ArrayBuffer, fileName: string): ClientFundedLoan[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) return [];

  return rawRows.map((row, idx) => {
    // Normalization helper
    const getVal = (keys: string[]): any => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find((rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    // Client Names
    let fullName = getVal(['clientname', 'borrowername', 'borrower', 'name', 'client', 'borrowerfullname']);
    let firstName = getVal(['firstname', 'borrowerfirstname', 'first']);
    let lastName = getVal(['lastname', 'borrowerlastname', 'last']);

    if (!firstName && !lastName && fullName) {
      const parts = String(fullName).trim().split(/\s+/);
      firstName = parts[0] || 'Client';
      lastName = parts.slice(1).join(' ') || `#${idx + 1}`;
    }
    if (!firstName) firstName = `Borrower`;
    if (!lastName) lastName = `#${idx + 1}`;

    // Address
    const propertyAddress = String(getVal(['propertyaddress', 'address', 'street', 'subjectproperty', 'property', 'streetaddress']) || '100 Main St');
    const city = String(getVal(['city', 'propertycity']) || '');
    const state = String(getVal(['state', 'propertystate']) || '');
    const zip = String(getVal(['zip', 'zipcode', 'postalcode']) || '');

    // Numeric Loan Fields
    const parseNum = (val: any, defaultVal: number = 0): number => {
      if (typeof val === 'number') return val;
      if (!val) return defaultVal;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const loanAmount = parseNum(getVal(['loanamount', 'amount', 'balance', 'fundedloanamount', 'originalbalance', 'loan_amount']), 400000);
    const purchasePrice = parseNum(getVal(['purchaseprice', 'price', 'propertyvalue', 'appraisedvalue', 'salesprice', 'purchase_price']), loanAmount * 1.25);
    let ltv = parseNum(getVal(['ltv', 'loan_to_value', 'loantovalue']), 0);
    if (ltv <= 0 && purchasePrice > 0) {
      ltv = +(Math.min(100, (loanAmount / purchasePrice) * 100)).toFixed(1);
    }

    // Funded Date
    let fundedDateVal = getVal(['fundeddate', 'closedate', 'fundingdate', 'closingdate', 'datefunded', 'settlementdate', 'date']);
    let fundedDate = '2023-10-15';
    if (fundedDateVal instanceof Date) {
      fundedDate = fundedDateVal.toISOString().split('T')[0];
    } else if (typeof fundedDateVal === 'string' && fundedDateVal.trim()) {
      fundedDate = fundedDateVal.trim();
    }

    // Interest Rate
    let interestRate = parseNum(getVal(['interestrate', 'noterate', 'rate', 'originalrate', 'fundedrate', 'coupon']), 7.125);
    // If rate entered as decimal like 0.07125, convert to 7.125
    if (interestRate < 0.20 && interestRate > 0.01) {
      interestRate = +(interestRate * 100).toFixed(3);
    }

    // Loan Program
    const rawProgram = String(getVal(['program', 'loantype', 'loanprogram', 'type', 'product', 'mortgagetype'])).toUpperCase();
    let program: LoanProgram = 'CONVENTIONAL';
    if (rawProgram.includes('FHA')) program = 'FHA';
    else if (rawProgram.includes('VA') || rawProgram.includes('VETERAN')) program = 'VA';
    else if (rawProgram.includes('USDA') || rawProgram.includes('RD') || rawProgram.includes('RURAL')) program = 'USDA_RD';
    else program = 'CONVENTIONAL';

    const loanNumber = String(getVal(['loannumber', 'loan_number', 'filenumber', 'id', 'loanid']) || `LN-${100000 + idx}`);

    return {
      id: `imported-${Date.now()}-${idx}`,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      propertyAddress: propertyAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      loanAmount,
      purchasePrice,
      ltv,
      fundedDate,
      interestRate,
      program,
      loanNumber,
    };
  });
}

/**
 * Export analyzed portfolio CRM table to CSV
 */
export function exportAnalyzedLoansToCsv(loans: AnalyzedClientLoan[]): void {
  const headers = [
    'Client First Name',
    'Client Last Name',
    'Property Address',
    'City',
    'State',
    'Loan Amount',
    'Purchase Price',
    'LTV (%)',
    'Funded Date',
    'Original Note Rate (%)',
    'Loan Program',
    'MBS Coupon at Funding',
    'MBS Price on Funded Date',
    'MBS Price Today',
    'MBS Spread / Price Change (pts)',
    'MBS Spread Change (bps)',
    'Today Est. Market Rate (%)',
    'Rate Change from Funding (%)',
    'Original Monthly P&I ($)',
    'Today Monthly P&I ($)',
    'Monthly Savings ($)',
    'Annual Savings ($)',
    'Refi Opportunity Status',
  ];

  const rows = loans.map((l) => [
    `"${l.firstName}"`,
    `"${l.lastName}"`,
    `"${l.propertyAddress}"`,
    `"${l.city || ''}"`,
    `"${l.state || ''}"`,
    l.loanAmount,
    l.purchasePrice,
    l.ltv,
    l.fundedDate,
    l.interestRate,
    l.program,
    `"${l.mbsCouponSymbol}"`,
    `"${l.mbsFundedPriceFormatted}"`,
    `"${l.mbsCurrentPriceFormatted}"`,
    l.mbsSpreadChangePts,
    l.mbsSpreadChangeBps,
    l.todayEstimatedMarketRate,
    l.rateChangeFromFunding,
    l.originalMonthlyPI,
    l.todayMonthlyPI,
    l.monthlySavings,
    l.annualSavings,
    `"${l.refiStatusLabel}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MBS_Client_Portfolio_Refi_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
