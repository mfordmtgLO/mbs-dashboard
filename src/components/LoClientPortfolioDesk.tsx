import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Sparkles,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  User,
  MapPin,
  Flame,
  Zap,
  Star,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  SlidersHorizontal,
  X,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { MBSQuote } from '../types';
import {
  ClientFundedLoan,
  AnalyzedClientLoan,
  analyzeClientFundedLoans,
  SAMPLE_FUNDED_LOANS,
  parseUploadedLoanFile,
  exportAnalyzedLoansToCsv,
  LoanProgram,
} from '../utils/portfolioMbsEngine';

interface LoClientPortfolioDeskProps {
  quotes: MBSQuote[];
  current10YYield?: number;
  onSyncPortfolioCouponsToWatchlist?: (coupons: number[]) => void;
  onSelectCouponForChart?: (symbol: string) => void;
}

export const LoClientPortfolioDesk: React.FC<LoClientPortfolioDeskProps> = ({
  quotes,
  current10YYield = 4.660,
  onSyncPortfolioCouponsToWatchlist,
  onSelectCouponForChart,
}) => {
  const [loans, setLoans] = useState<ClientFundedLoan[]>(SAMPLE_FUNDED_LOANS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [refiStatusFilter, setRefiStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'savings' | 'rateDrop' | 'loanAmount' | 'date'>('savings');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  // Selected client for deep-dive call script / refi scenario
  const [selectedLoan, setSelectedLoan] = useState<AnalyzedClientLoan | null>(null);
  const [isCopiedScript, setIsCopiedScript] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Manual Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newLoan, setNewLoan] = useState<Partial<ClientFundedLoan>>({
    firstName: '',
    lastName: '',
    propertyAddress: '',
    city: '',
    state: '',
    loanAmount: 450000,
    purchasePrice: 560000,
    ltv: 80.0,
    fundedDate: new Date().toISOString().split('T')[0],
    interestRate: 7.250,
    program: 'CONVENTIONAL',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run Real-Time Analysis Engine
  const analyzedLoans: AnalyzedClientLoan[] = useMemo(() => {
    return analyzeClientFundedLoans(loans, quotes, current10YYield);
  }, [loans, quotes, current10YYield]);

  // Aggregate Portfolio Metrics
  const summaryMetrics = useMemo(() => {
    const totalVolume = analyzedLoans.reduce((acc, l) => acc + l.loanAmount, 0);
    const highRefiLoans = analyzedLoans.filter((l) => l.refiStatus === 'HIGH_TRIGGER');
    const totalRefiVolume = analyzedLoans
      .filter((l) => l.refiStatus === 'HIGH_TRIGGER' || l.refiStatus === 'MODERATE_TRIGGER')
      .reduce((acc, l) => acc + l.loanAmount, 0);
    
    const totalMonthlySavings = analyzedLoans.reduce((acc, l) => acc + Math.max(0, l.monthlySavings), 0);
    const totalAnnualSavings = totalMonthlySavings * 12;

    const inTheMoneyLoans = analyzedLoans.filter((l) => l.rateChangeFromFunding < 0);
    const avgRateDrop = inTheMoneyLoans.length > 0
      ? inTheMoneyLoans.reduce((acc, l) => acc + Math.abs(l.rateChangeFromFunding), 0) / inTheMoneyLoans.length
      : 0;

    return {
      totalVolume,
      highRefiCount: highRefiLoans.length,
      totalRefiCount: inTheMoneyLoans.length,
      totalRefiVolume,
      totalMonthlySavings,
      totalAnnualSavings,
      avgRateDrop,
    };
  }, [analyzedLoans]);

  // Filter and Sort
  const filteredLoans = useMemo(() => {
    return analyzedLoans
      .filter((l) => {
        if (programFilter !== 'ALL' && l.program !== programFilter) return false;
        if (refiStatusFilter === 'HIGH_TRIGGER' && l.refiStatus !== 'HIGH_TRIGGER') return false;
        if (refiStatusFilter === 'MODERATE_TRIGGER' && l.refiStatus !== 'MODERATE_TRIGGER') return false;
        if (refiStatusFilter === 'IN_THE_MONEY' && l.rateChangeFromFunding >= 0) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = `${l.firstName} ${l.lastName}`.toLowerCase().includes(q);
          const matchAddress = l.propertyAddress.toLowerCase().includes(q) || (l.city && l.city.toLowerCase().includes(q));
          const matchNumber = (l.loanNumber && l.loanNumber.toLowerCase().includes(q)) || false;
          return matchName || matchAddress || matchNumber;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'savings') diff = b.monthlySavings - a.monthlySavings;
        else if (sortBy === 'rateDrop') diff = a.rateChangeFromFunding - b.rateChangeFromFunding; // larger negative drop first
        else if (sortBy === 'loanAmount') diff = b.loanAmount - a.loanAmount;
        else if (sortBy === 'date') diff = new Date(b.fundedDate).getTime() - new Date(a.fundedDate).getTime();
        return sortAsc ? -diff : diff;
      });
  }, [analyzedLoans, programFilter, refiStatusFilter, searchQuery, sortBy, sortAsc]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const parsed = parseUploadedLoanFile(buffer, file.name);
          if (parsed.length > 0) {
            setLoans(parsed);
            setSyncFeedback(`Successfully mapped ${parsed.length} client loan closings from "${file.name}"!`);
            setTimeout(() => setSyncFeedback(null), 4000);
          } else {
            alert('Could not detect client loan rows in file. Please ensure columns include Borrower Name, Loan Amount, Funded Date, Interest Rate.');
          }
        } catch (err) {
          console.error('File parsing error:', err);
          alert('Error reading Excel/CSV file. Please verify file format.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sync unique coupons to watchlist
  const handleSyncToWatchlist = () => {
    const uniqueCoupons = Array.from(new Set(analyzedLoans.map((l) => l.mbsCouponRate))).sort((a, b) => a - b);
    if (onSyncPortfolioCouponsToWatchlist) {
      onSyncPortfolioCouponsToWatchlist(uniqueCoupons);
      setSyncFeedback(`Synced ${uniqueCoupons.length} MBS coupons (${uniqueCoupons.map((c) => `${c}%`).join(', ')}) to your Active Live Watchlist!`);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleCopyCallScript = (loan: AnalyzedClientLoan) => {
    const script = `Hi ${loan.firstName},\n\nOur secondary capital markets desk is monitoring mortgage-backed securities (MBS) pricing for your loan. Since your ${loan.program} loan closed at ${loan.interestRate.toFixed(3)}% on ${loan.fundedDate}, the underlying ${loan.mbsCouponSymbol} coupon has rallied ${loan.mbsSpreadChangePts > 0 ? '+' : ''}${loan.mbsSpreadChangePts} points.\n\nThis translates to a current market interest rate of ~${loan.todayEstimatedMarketRate.toFixed(3)}% (a drop of ${Math.abs(loan.rateChangeFromFunding).toFixed(3)}%), creating an estimated monthly savings of $${loan.monthlySavings.toLocaleString()}/month ($${loan.annualSavings.toLocaleString()}/year) on your $${loan.loanAmount.toLocaleString()} balance.\n\nLet's review whether a no-cost streamline refinance is right for your home at ${loan.propertyAddress}.`;

    navigator.clipboard.writeText(script);
    setIsCopiedScript(true);
    setTimeout(() => setIsCopiedScript(false), 3000);
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#262626] shadow-2xl overflow-hidden flex flex-col">
      {/* Top Banner & Action Bar */}
      <div className="p-4 bg-[#0d0d0d] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              Loan Officer Portfolio CRM & MBS Refinance Matrix
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 text-[10px] font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFD700]" />
                CSV / EXCEL AI MAPPING
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Live tracking of funded client closings against real-time MBS coupon spread movements & refi triggers
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
            id="lo-portfolio-file-upload"
          />

          <button
            id="btn-upload-portfolio-file"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#383838] text-gray-200 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            id="btn-load-sample-pipeline"
            onClick={() => {
              setLoans(SAMPLE_FUNDED_LOANS);
              setSyncFeedback('Loaded 12 sample funded client loans (Conventional, FHA, VA, USDA)!');
              setTimeout(() => setSyncFeedback(null), 3000);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1e1b07] hover:bg-[#2c270b] border border-[#FFD700]/50 text-[#FFD700] font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Pipeline</span>
          </button>

          <button
            id="btn-sync-portfolio-coupons"
            onClick={handleSyncToWatchlist}
            className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            title="Sync all unique coupons from this client pipeline to your live MBS watchlist"
          >
            <Star className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Sync Coupons to Watchlist</span>
          </button>

          <button
            id="btn-export-portfolio-csv"
            onClick={() => exportAnalyzedLoansToCsv(analyzedLoans)}
            className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#202020] border border-[#333333] text-gray-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-single-loan"
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#FFD700] hover:brightness-110 text-black font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Loan</span>
          </button>
        </div>
      </div>

      {/* Sync / Success Toast Feedback */}
      {syncFeedback && (
        <div className="px-4 py-2 bg-green-950/90 border-b border-green-700/60 text-green-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-green-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Executive Portfolio KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0a0a0a] border-b border-[#202020]">
        <div className="p-3 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Total Portfolio Monitored</div>
          <div className="text-lg font-mono font-extrabold text-white mt-0.5">
            ${(summaryMetrics.totalVolume / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            {analyzedLoans.length} Funded Client Closings
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1a1705] border border-[#FFD700]/40">
          <div className="text-[10px] font-mono text-[#FFD700] uppercase tracking-wider flex items-center justify-between">
            <span>🔥 Active Refi Pipeline</span>
            <span className="px-1.5 py-0.2 rounded bg-[#FFD700]/20 text-[#FFD700] text-[9px] font-bold">
              {summaryMetrics.totalRefiCount} In-The-Money
            </span>
          </div>
          <div className="text-lg font-mono font-extrabold text-[#FFD700] mt-0.5">
            ${(summaryMetrics.totalRefiVolume / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
            {summaryMetrics.highRefiCount} High Trigger (&gt;$150/mo savings)
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1713] border border-green-700/50">
          <div className="text-[10px] font-mono text-green-400 uppercase tracking-wider">Borrower Savings Potential</div>
          <div className="text-lg font-mono font-extrabold text-green-400 mt-0.5">
            ${Math.round(summaryMetrics.totalMonthlySavings).toLocaleString()}{' '}
            <span className="text-xs text-gray-400 font-normal">/ month</span>
          </div>
          <div className="text-[10px] text-green-500/80 font-mono mt-0.5">
            ${Math.round(summaryMetrics.totalAnnualSavings).toLocaleString()} / year cumulative
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#141414] border border-[#242424]">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Avg Rate Improvement</div>
          <div className="text-lg font-mono font-extrabold text-blue-400 mt-0.5">
            -{summaryMetrics.avgRateDrop.toFixed(3)}%
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            MBS Spread Shift Driven
          </div>
        </div>
      </div>

      {/* Filter, Search & Sorting Controls */}
      <div className="p-3 bg-[#0d0d0d] border-b border-[#1f1f1f] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-portfolio-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search borrower name, address, loan #..."
            className="w-full bg-[#141414] border border-[#2b2b2b] focus:border-[#FFD700] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none font-mono">
          <span className="text-gray-500 text-[11px]">Program:</span>
          {['ALL', 'CONVENTIONAL', 'FHA', 'VA', 'USDA_RD'].map((prog) => (
            <button
              key={prog}
              onClick={() => setProgramFilter(prog)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                programFilter === prog
                  ? 'bg-[#FFD700] text-black shadow-sm'
                  : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2b2b2b]'
              }`}
            >
              {prog === 'USDA_RD' ? 'USDA RD' : prog}
            </button>
          ))}
        </div>

        {/* Refi Trigger Filter */}
        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
          <span className="text-gray-500">Refi Status:</span>
          <select
            value={refiStatusFilter}
            onChange={(e) => setRefiStatusFilter(e.target.value)}
            className="bg-[#181818] border border-[#2b2b2b] text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#FFD700]"
          >
            <option value="ALL">All Clients ({analyzedLoans.length})</option>
            <option value="HIGH_TRIGGER">🔥 High Refi Trigger</option>
            <option value="MODERATE_TRIGGER">⚡ Moderate Trigger</option>
            <option value="IN_THE_MONEY">💰 All In-The-Money</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
          <span className="text-gray-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#181818] border border-[#2b2b2b] text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#FFD700]"
          >
            <option value="savings">Monthly Savings ($/mo)</option>
            <option value="rateDrop">Rate Drop (Δ %)</option>
            <option value="loanAmount">Loan Amount ($)</option>
            <option value="date">Funded Date</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1 rounded bg-[#181818] border border-[#2b2b2b] text-gray-300 hover:text-white"
            title="Toggle sort order"
          >
            {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main CRM / Database Data Table */}
      <div className="overflow-x-auto max-h-[520px] bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#121212] border-b border-[#262626] text-gray-400 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Client & Property</th>
              <th className="py-2.5 px-2.5">Program</th>
              <th className="py-2.5 px-2.5">Loan Amount</th>
              <th className="py-2.5 px-2.5">LTV</th>
              <th className="py-2.5 px-2.5">Funded Date</th>
              <th className="py-2.5 px-2.5 text-center">Original Rate</th>
              <th className="py-2.5 px-2.5 text-center bg-[#151515] border-l border-[#242424] text-[#FFD700]">
                MBS Coupon @ Funded
              </th>
              <th className="py-2.5 px-2.5 text-center bg-[#151515] text-[#FFD700]">
                MBS Value Today
              </th>
              <th className="py-2.5 px-2.5 text-center bg-[#151515] border-r border-[#242424] text-green-400">
                MBS Spread Δ
              </th>
              <th className="py-2.5 px-2.5 text-center">Today Est. Rate</th>
              <th className="py-2.5 px-2.5 text-center text-green-400 font-bold">Monthly Savings</th>
              <th className="py-2.5 px-3 text-center">Refi Opportunity Status</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-gray-500 font-mono">
                  No matching client loans found. Click "Load Sample Pipeline" or "Import CSV / Excel" to populate.
                </td>
              </tr>
            ) : (
              filteredLoans.map((loan) => {
                const isHighTrigger = loan.refiStatus === 'HIGH_TRIGGER';
                const isModerateTrigger = loan.refiStatus === 'MODERATE_TRIGGER';
                const hasSavings = loan.monthlySavings > 0;

                const programBadgeBg =
                  loan.program === 'CONVENTIONAL'
                    ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                    : loan.program === 'FHA'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                    : loan.program === 'VA'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';

                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-[#151515] transition-colors group ${
                      isHighTrigger ? 'bg-[#181507]/40' : ''
                    }`}
                  >
                    {/* Client & Property */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white group-hover:text-[#FFD700] transition-colors">
                        {loan.firstName} {loan.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[180px]">
                        {loan.propertyAddress}
                        {loan.city ? `, ${loan.city}` : ''}
                      </div>
                      {loan.loanNumber && (
                        <div className="text-[9px] text-gray-500 font-mono">{loan.loanNumber}</div>
                      )}
                    </td>

                    {/* Program */}
                    <td className="py-2.5 px-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${programBadgeBg}`}>
                        {loan.program === 'USDA_RD' ? 'USDA' : loan.program}
                      </span>
                    </td>

                    {/* Loan Amount */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-gray-200">${loan.loanAmount.toLocaleString()}</div>
                      <div className="text-[9px] text-gray-500">Pur: ${loan.purchasePrice.toLocaleString()}</div>
                    </td>

                    {/* LTV */}
                    <td className="py-2.5 px-2.5 text-gray-300">{loan.ltv.toFixed(1)}%</td>

                    {/* Funded Date */}
                    <td className="py-2.5 px-2.5 text-gray-400 whitespace-nowrap">{loan.fundedDate}</td>

                    {/* Original Rate */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-gray-200">
                      {loan.interestRate.toFixed(3)}%
                    </td>

                    {/* MBS Coupon at Funded Date */}
                    <td className="py-2.5 px-2.5 text-center bg-[#131313] border-l border-[#222222]">
                      <div className="font-bold text-[#FFD700]">{loan.mbsCouponSymbol}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {loan.mbsFundedPriceFormatted} ({loan.mbsFundedPrice.toFixed(3)})
                      </div>
                    </td>

                    {/* MBS Value Today */}
                    <td className="py-2.5 px-2.5 text-center bg-[#131313]">
                      <div className="font-bold text-white">{loan.mbsCurrentPriceFormatted}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{loan.mbsCurrentPrice.toFixed(3)}</div>
                    </td>

                    {/* MBS Spread / Price Δ */}
                    <td className="py-2.5 px-2.5 text-center bg-[#131313] border-r border-[#222222]">
                      <div
                        className={`font-bold font-mono ${
                          loan.mbsSpreadChangePts > 0
                            ? 'text-green-400'
                            : loan.mbsSpreadChangePts < 0
                            ? 'text-rose-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {loan.mbsSpreadChangePts > 0 ? '+' : ''}
                        {loan.mbsSpreadChangePts.toFixed(3)} pts
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        ({loan.mbsSpreadChangeBps > 0 ? '+' : ''}
                        {loan.mbsSpreadChangeBps} bps | {loan.mbsSpreadChange32nds > 0 ? '+' : ''}
                        {loan.mbsSpreadChange32nds}/32)
                      </div>
                    </td>

                    {/* Today's Estimated Market Rate */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="font-bold text-white">{loan.todayEstimatedMarketRate.toFixed(3)}%</div>
                      <div
                        className={`text-[10px] font-mono font-bold ${
                          loan.rateChangeFromFunding < 0 ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        {loan.rateChangeFromFunding < 0 ? '▼ ' : loan.rateChangeFromFunding > 0 ? '▲ +' : ''}
                        {loan.rateChangeFromFunding.toFixed(3)}%
                      </div>
                    </td>

                    {/* Monthly Savings */}
                    <td className="py-2.5 px-2.5 text-center">
                      {hasSavings ? (
                        <div>
                          <div className="font-bold text-green-400 text-xs">
                            +${Math.round(loan.monthlySavings).toLocaleString()} /mo
                          </div>
                          <div className="text-[9px] text-green-500/70 font-mono">
                            ${Math.round(loan.annualSavings).toLocaleString()} /yr
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Refi Opportunity Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isHighTrigger ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-[#FFD700] border border-amber-600/70 text-[9px] font-bold">
                          <Flame className="w-3 h-3 text-[#FFD700]" />
                          <span>HIGH REFI TRIGGER</span>
                        </span>
                      ) : isModerateTrigger ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 text-[9px] font-bold">
                          <Zap className="w-3 h-3 text-blue-400" />
                          <span>REFI OPPORTUNITY</span>
                        </span>
                      ) : loan.rateChangeFromFunding < 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161616] text-gray-300 border border-[#2b2b2b] text-[9px]">
                          <span>MONITORING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#141414] text-gray-500 border border-[#222222] text-[9px]">
                          <span>LOCKED IN</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedLoan(loan)}
                          className="px-2 py-1 rounded bg-[#1f1b07] hover:bg-[#2e280c] border border-[#FFD700]/50 text-[#FFD700] text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                          title="View Client Call Script & Strategy"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Script</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Originator Instructions */}
      <div className="p-3 bg-[#0a0a0a] border-t border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
          <span>Secondary Spread Translation:</span>
          <span className="text-gray-300 hidden md:inline">
            Each 1.00 pt (+32/32) rally in the borrower's funded MBS coupon produces ~0.250% drop in primary market note rate pricing.
          </span>
        </div>

        <div className="flex items-center space-x-3 text-gray-400">
          <span>Showing {filteredLoans.length} of {analyzedLoans.length} Loans</span>
          <button
            onClick={() => exportAnalyzedLoansToCsv(analyzedLoans)}
            className="text-[#FFD700] hover:underline flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>Export to Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Client Refinance Pitch & Strategy Script Modal Drawer */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333333] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Refinance Strategy & Call Script: {selectedLoan.firstName} {selectedLoan.lastName}
                  </h4>
                  <p className="text-xs text-gray-400 font-mono">
                    {selectedLoan.propertyAddress} | Loan #{selectedLoan.loanNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-[#222222] text-xs font-mono">
              <div>
                <span className="text-gray-500 text-[10px] uppercase">Funded Loan</span>
                <div className="font-bold text-white">
                  ${selectedLoan.loanAmount.toLocaleString()} @ {selectedLoan.interestRate.toFixed(3)}%
                </div>
                <div className="text-[10px] text-gray-400">Date: {selectedLoan.fundedDate}</div>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase">MBS Coupon Rally</span>
                <div className="font-bold text-[#FFD700]">
                  {selectedLoan.mbsCouponSymbol}: {selectedLoan.mbsSpreadChangePts > 0 ? '+' : ''}{selectedLoan.mbsSpreadChangePts} pts
                </div>
                <div className="text-[10px] text-gray-400">
                  Funded: {selectedLoan.mbsFundedPriceFormatted} → Today: {selectedLoan.mbsCurrentPriceFormatted}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase">Estimated Savings</span>
                <div className="font-bold text-green-400">
                  +${Math.round(selectedLoan.monthlySavings).toLocaleString()} / month
                </div>
                <div className="text-[10px] text-green-500/80">
                  ${Math.round(selectedLoan.annualSavings).toLocaleString()} / year
                </div>
              </div>
            </div>

            {/* Tailored Pitch Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#FFD700]" />
                  Secondary-Grounded Borrower Call / Email Script:
                </span>
                <button
                  onClick={() => handleCopyCallScript(selectedLoan)}
                  className="px-2.5 py-1 rounded bg-[#1f1b07] hover:bg-[#2e280c] text-[#FFD700] border border-[#FFD700]/50 text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  {isCopiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-line select-all">
                {`Hi ${selectedLoan.firstName},\n\nOur secondary capital markets desk is monitoring mortgage-backed securities (MBS) pricing for your loan. Since your ${selectedLoan.program} loan closed at ${selectedLoan.interestRate.toFixed(3)}% on ${selectedLoan.fundedDate}, the underlying ${selectedLoan.mbsCouponSymbol} coupon has rallied ${selectedLoan.mbsSpreadChangePts > 0 ? '+' : ''}${selectedLoan.mbsSpreadChangePts} points.\n\nThis translates to a current market interest rate of ~${selectedLoan.todayEstimatedMarketRate.toFixed(3)}% (a drop of ${Math.abs(selectedLoan.rateChangeFromFunding).toFixed(3)}%), creating an estimated monthly savings of $${selectedLoan.monthlySavings.toLocaleString()}/month ($${selectedLoan.annualSavings.toLocaleString()}/year) on your $${selectedLoan.loanAmount.toLocaleString()} balance.\n\nLet's review whether a no-cost streamline refinance is right for your home at ${selectedLoan.propertyAddress}.`}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#222222]">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#282828] text-gray-300 font-mono text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCopyCallScript(selectedLoan);
                  setSelectedLoan(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#FFD700] text-black font-bold font-mono text-xs"
              >
                Copy Script & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Loan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333333] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FFD700]" />
                Add Client Funded Loan Record
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">First Name</label>
                <input
                  type="text"
                  value={newLoan.firstName}
                  onChange={(e) => setNewLoan({ ...newLoan, firstName: e.target.value })}
                  placeholder="e.g. Marcus"
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Last Name</label>
                <input
                  type="text"
                  value={newLoan.lastName}
                  onChange={(e) => setNewLoan({ ...newLoan, lastName: e.target.value })}
                  placeholder="e.g. Holloway"
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="col-span-2">
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Property Address</label>
                <input
                  type="text"
                  value={newLoan.propertyAddress}
                  onChange={(e) => setNewLoan({ ...newLoan, propertyAddress: e.target.value })}
                  placeholder="e.g. 742 Evergreen Terrace"
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={newLoan.loanAmount}
                  onChange={(e) => setNewLoan({ ...newLoan, loanAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Purchase Price ($)</label>
                <input
                  type="number"
                  value={newLoan.purchasePrice}
                  onChange={(e) => setNewLoan({ ...newLoan, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Funded Date</label>
                <input
                  type="date"
                  value={newLoan.fundedDate}
                  onChange={(e) => setNewLoan({ ...newLoan, fundedDate: e.target.value })}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.125"
                  value={newLoan.interestRate}
                  onChange={(e) => setNewLoan({ ...newLoan, interestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="col-span-2">
                <label className="text-gray-400 font-mono text-[10px] block mb-1">Loan Program</label>
                <select
                  value={newLoan.program}
                  onChange={(e) => setNewLoan({ ...newLoan, program: e.target.value as any })}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded p-2 text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="CONVENTIONAL">Conventional (FNMA UMBS)</option>
                  <option value="FHA">FHA (Ginnie Mae II)</option>
                  <option value="VA">VA (Ginnie Mae II)</option>
                  <option value="USDA_RD">USDA Rural Development</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#222222]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1c1c1c] text-gray-300 font-mono text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newLoan.firstName || !newLoan.loanAmount) {
                    alert('Please enter at least a First Name and Loan Amount');
                    return;
                  }
                  const ltv = newLoan.purchasePrice && newLoan.purchasePrice > 0
                    ? +((newLoan.loanAmount! / newLoan.purchasePrice) * 100).toFixed(1)
                    : 80.0;

                  const completeLoan: ClientFundedLoan = {
                    id: `loan-${Date.now()}`,
                    firstName: newLoan.firstName || 'Client',
                    lastName: newLoan.lastName || 'Borrower',
                    propertyAddress: newLoan.propertyAddress || '100 Main St',
                    loanAmount: newLoan.loanAmount || 400000,
                    purchasePrice: newLoan.purchasePrice || 500000,
                    ltv,
                    fundedDate: newLoan.fundedDate || '2023-10-15',
                    interestRate: newLoan.interestRate || 7.250,
                    program: newLoan.program as LoanProgram || 'CONVENTIONAL',
                    loanNumber: `LN-${Math.floor(100000 + Math.random() * 900000)}`,
                  };

                  setLoans([completeLoan, ...loans]);
                  setIsAddModalOpen(false);
                  setSyncFeedback(`Added ${completeLoan.firstName} ${completeLoan.lastName} to your monitored portfolio!`);
                  setTimeout(() => setSyncFeedback(null), 3000);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#FFD700] text-black font-bold font-mono text-xs"
              >
                Save & Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
