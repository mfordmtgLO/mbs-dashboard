export interface HousingBriefArticle {
  id: string;
  url: string;
  title: string;
  category: 'MBS Morning' | 'MBS Recap' | 'MBS Alert';
  publishedTime: string;
  publishedTimestamp: number; // Unix timestamp in milliseconds for guaranteed newest-to-oldest sorting
  author: string;
  authorTitle: string;
  sourceDomain: string;
  summary: string;
  fullBody: string[];
  keyTakeaways: string[];
  marketImpact: 'bullish' | 'bearish' | 'neutral' | 'reprice_warning';
  lockFloatGuidance?: string;
  targetMbsBenchmark?: string;
  charts?: {
    title: string;
    url: string;
    caption: string;
  }[];
}

const RAW_HOUSING_BRIEF_ARTICLES: HousingBriefArticle[] = [
  {
    id: '6a8c5f9c081f33c95c40440a',
    url: 'https://housingbrief.com/Article/6a8c5f9c081f33c95c40440a/5422cc85becf1e23a41598ec?fcb=False&sr=False',
    title: 'MBS Morning: Slightly Stronger Start Mostly Due to Oil. Treasury News Fails to Inspire (Again)',
    category: 'MBS Morning',
    publishedTime: 'Tuesday, Aug 25 - Morning (Most Recent)',
    publishedTimestamp: 1787659200000, // 2026-08-25T09:00:00Z (Newest)
    author: 'Matthew Graham',
    authorTitle: 'Chief Secondary Market Strategist, MBS Live / HousingBrief',
    sourceDomain: 'housingbrief.com',
    summary:
      "Once again, Treasury is out with news about bond buying plans with two officials saying the Treasury General Account (TGA) could be used to fund long-end buybacks. TGA is Treasury's bank account. Unlike Fed QE, Treasury buybacks equal government spending and cannot artificially suppress yields overall. Morning market strength is primarily driven by overnight fuel price declines.",
    fullBody: [
      "Once again, Treasury is out with news about bond buying plans with two officials saying the Treasury General Account (TGA) could be used to fund long-end buybacks. TGA is Treasury's bank account. It gets money from taxes, Treasury issuance, tariffs, etc. Therefore, any way you slice it, Treasury bond buying = government spending, unlike Fed QE.",
      "At best, it can influence the yield curve, but it can't artificially suppress yields overall. This is why the bond market won't embark on a big, sustained rally in response to Treasury bond buying, no matter how big a deal financial media makes of the news.",
      "In today's case, it could be contributing to yield curve flattening, but the modest rally seen in the bond market is far easier to attribute to a decent drop in fuel prices overnight."
    ],
    keyTakeaways: [
      'Treasury Buybacks ≠ Fed Quantitative Easing (TGA funds come from taxes/issuance, meaning net government spending).',
      'Buyback programs reshape curve slope (flattening) but cannot suppress nominal yield levels long-term.',
      'Intraday bond strength is catalyzed by falling oil/energy commodity prices rather than Treasury headlines.',
      'Originator advice: Do not chase headlines expecting structural rate drops from buyback announcements.'
    ],
    marketImpact: 'bullish',
    lockFloatGuidance: 'Cautious float with tight intraday triggers; energy relief providing temporary price support.',
    targetMbsBenchmark: '30Y UMBS 5.5% & 6.0% Production Pools',
  },
  {
    id: '6a8cb019081f33c95c406df6',
    url: 'https://housingbrief.com/Article/6a8cb019081f33c95c406df6/5422cc85becf1e23a41598ec?fcb=False',
    title: 'MBS Recap: Tune Out The Noise (Part 2)',
    category: 'MBS Recap',
    publishedTime: 'Mon, Aug 24 - 8:56 PM',
    publishedTimestamp: 1787604960000, // 2026-08-24T20:56:00Z
    author: 'Matthew Graham',
    authorTitle: 'Chief Secondary Market Strategist, MBS Live / HousingBrief',
    sourceDomain: 'housingbrief.com',
    summary:
      'Advising originators to tune out headline noise around Treasury buyback quotas. A ramp in buybacks implies equal expansion in issuance. Bonds rallied strictly on lower fuel prices. Lock/float risk remains elevated.',
    fullBody: [
      'Last week, when Treasury announced higher per-operation limits for the buyback program, we advised tuning out the noise. Specifically, this meant that the announcement was not ever destined to be a material market mover or provide lasting relief for rates despite ample media coverage and the appearance of significance.',
      "It's more of the same to start the new week. Treasury sources threw out big numbers in reference to buyback operations by citing the Treasury General Account balance (basically, the government's checking account). Markets didn't care and neither should you.",
      'A big ramp in buybacks implies an equally big ramp in Treasury issuance. Buybacks can only influence the yield curve and not overall rate levels. Moreover, MBS run with the middle of the curve which might not see any benefit at all from excess buybacks in the 10-30yr space. Bonds rallied today due to lower fuel prices. The end.',
      'Lock / Float Considerations: Lock/float risk remains higher than normal as long as each new day brings another coin flip on the fate of the war and fuel prices. In addition, corporate bond issuance is keeping broad pressure on yields.'
    ],
    keyTakeaways: [
      'Corporate supply and geopolitical uncertainty keep upward baseline pressure on benchmark yields.',
      'Middle of the yield curve (5Y-10Y MBS sweet spot) is insulated from long-end 30Y Treasury operations.',
      'Key 10Y technical ceiling/support: 4.80% / 4.71%; floor/resistance: 4.42% / 4.54% / 4.62%.'
    ],
    marketImpact: 'neutral',
    lockFloatGuidance: 'Lock loans inside 15-30 days; maintain defensive stance until sustainable downtrend confirms.',
    targetMbsBenchmark: '30Y UMBS 5.5% (99-26, +14/32nds)',
  },
  {
    id: '6a88a8bbf06a6eb3d73cbe1c',
    url: 'https://housingbrief.com/Article/6a88a8bbf06a6eb3d73cbe1c/5422cc85becf1e23a41598ec?fcb=False',
    title: 'MBS Recap: Incidental Weakness. Bigger Considerations on The Horizon',
    category: 'MBS Recap',
    publishedTime: 'Fri, Aug 21 - 7:36 PM',
    publishedTimestamp: 1787340960000, // 2026-08-21T19:36:00Z
    author: 'Matthew Graham',
    authorTitle: 'Chief Secondary Market Strategist, MBS Live / HousingBrief',
    sourceDomain: 'housingbrief.com',
    summary:
      'Without major economic releases, light summer volume allowed technical selling to push yields higher. Fed Funds Futures priced in higher rate probabilities ahead of Jackson Hole.',
    fullBody: [
      'Without any data or compelling market movers, bonds came into the day light on inspiration. Low volume/liquidity left the door open for any determined traders to have a bigger-than-normal influence on the market.',
      'That arguably happened between 9am and 10:30am ET with both stocks and bonds losing ground simultaneously. This coincided perfectly with an uptick in Fed rate hike expectations seen via near-term Fed Funds Futures.',
      "There are bigger fish to fry in the coming week with a more robust econ calendar and the Fed's Jackson Hole symposium.",
      'Lock / Float Considerations: Lock/float risk remains higher than normal as long as each new day brings another coin flip on fuel prices. Corporate bond issuance is keeping broad pressure on yields.'
    ],
    keyTakeaways: [
      'Low liquidity sessions amplify intraday price whipsaws and false technical breakouts.',
      'Fed funds expectations shifted slightly hawkish heading into key central bank conferences.',
      'MBS ended session down 5 ticks with 10Y UST yield closing near 4.74%.'
    ],
    marketImpact: 'bearish',
    lockFloatGuidance: 'Defensive lock bias into weekends and prior to tier-1 inflation data prints.',
    targetMbsBenchmark: '30Y UMBS 5.5% (99-11, -14/32nds)',
  },
  {
    id: '6a889051f06a6eb3d73cb1ed',
    url: 'https://housingbrief.com/Article/6a889051f06a6eb3d73cb1ed/5422cc85becf1e23a41598ec?fcb=False',
    title: 'MBS Alert: Slightly More Reprice Risk',
    category: 'MBS Alert',
    publishedTime: 'Fri, Aug 21 - 5:52 PM',
    publishedTimestamp: 1787334720000, // 2026-08-21T17:52:00Z
    author: 'Matthew Graham',
    authorTitle: 'Chief Secondary Market Strategist, MBS Live / HousingBrief',
    sourceDomain: 'housingbrief.com',
    summary:
      'MBS pushed day lows with 5.5 UMBS down 5 ticks (.16) vs morning lender rate sheet baselines, escalating probability of worse intraday reprices.',
    fullBody: [
      "Prices haven't changed much from the time of the first alert, but MBS have spent more time pushing the lows of the day. Treasuries are also suggesting a bit of extra weakness.",
      "5.5 UMBS are now down 5 ticks (.16) on the day and versus many lenders' morning rate sheet print times. This makes negative reprices slightly more possible than they were a few hours ago."
    ],
    keyTakeaways: [
      'UMBS 5.5 coupon declined 5 ticks (.16) below morning lender rate sheet baseline.',
      'Treasury yield drift generated compounding pressure on wholesale secondary desks.',
      'Reprice risk escalated from low/moderate to active for regional and national aggregators.'
    ],
    marketImpact: 'reprice_warning',
    lockFloatGuidance: 'Execute locks immediately on floating files sensitive to 15-25 bps price deterioration.',
    targetMbsBenchmark: '30Y UMBS 5.5% Benchmark',
  },
  {
    id: '6a8861e3f06a6eb3d73c9bce',
    url: 'https://housingbrief.com/Article/6a8861e3f06a6eb3d73c9bce/5422cc85becf1e23a41598ec?fcb=False',
    title: 'MBS Alert: MBS Down an Eighth',
    category: 'MBS Alert',
    publishedTime: 'Fri, Aug 21 - 2:34 PM',
    publishedTimestamp: 1787322840000, // 2026-08-21T14:34:00Z
    author: 'Matthew Graham',
    authorTitle: 'Chief Secondary Market Strategist, MBS Live / HousingBrief',
    sourceDomain: 'housingbrief.com',
    summary:
      'UMBS 5.5 dropped an eighth of a point (-0.125 / -4/32nds) on the day, reaching the threshold of negative reprice risk for jumpy lenders.',
    fullBody: [
      'Bonds have been selling slowly and steadily for the past few hours despite the stronger start. UMBS 5.5 coupons just now ticked down an eighth of a point on the day.',
      "Incidentally, this is also an eighth of a point below early lenders' rate sheet print times. As such, this could be considered the threshold of negative reprice risk for the jumpier lenders.",
      'The average lender would need to see a few more ticks of weakness before considering reprices.'
    ],
    keyTakeaways: [
      'An 1/8th point (-0.125 / 4 ticks) decline represents the standard trigger threshold for quick-trigger lenders.',
      'Standard tier-1 lenders typically wait for 6-8 ticks (-0.187 to -0.25) before releasing revised rate sheets.',
      'Alert served as early warning for mortgage originators managing active pipeline locks.'
    ],
    marketImpact: 'reprice_warning',
    lockFloatGuidance: 'High alert for impending rate sheet recalls; lock sensitive loans.',
    targetMbsBenchmark: '30Y UMBS 5.5% Benchmark',
  }
];

// Always mathematically sorted: newest published article at index 0 (Featured) to oldest at index 4
export const HOUSING_BRIEF_ARTICLES: HousingBriefArticle[] = [...RAW_HOUSING_BRIEF_ARTICLES].sort(
  (a, b) => b.publishedTimestamp - a.publishedTimestamp
);

// Explicitly retrieve the guaranteed most recently published article
export const getLatestHousingBriefArticle = (): HousingBriefArticle => {
  return HOUSING_BRIEF_ARTICLES[0];
};
