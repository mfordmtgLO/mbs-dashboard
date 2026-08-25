import React from 'react';
import { MBSQuote, TreasuryCurveData, TapeItem } from '../types';

interface MarketTapeProps {
  quotes: MBSQuote[];
  treasuryCurve: TreasuryCurveData;
  macroIndices: TapeItem[];
}

export const MarketTape: React.FC<MarketTapeProps> = ({
  quotes,
  treasuryCurve,
  macroIndices,
}) => {
  // Construct Treasury items
  const ustItems: TapeItem[] = [
    {
      id: 'ust-3m',
      name: '3M T-Bill',
      price: treasuryCurve.y3m ? `${treasuryCurve.y3m.toFixed(3)}%` : '5.345%',
      change: '-0.010%',
      up: false,
    },
    {
      id: 'ust-2y',
      name: '2Y CMT',
      price: treasuryCurve.y2 ? `${treasuryCurve.y2.toFixed(3)}%` : '4.412%',
      change: '-0.024%',
      up: false,
    },
    {
      id: 'ust-5y',
      name: '5Y CMT',
      price: treasuryCurve.y5 ? `${treasuryCurve.y5.toFixed(3)}%` : '4.195%',
      change: '-0.031%',
      up: false,
    },
    {
      id: 'ust-10y',
      name: '10Y CMT (Anchor)',
      price: treasuryCurve.y10 ? `${treasuryCurve.y10.toFixed(3)}%` : '4.284%',
      change: '-0.042%',
      up: false,
    },
    {
      id: 'ust-30y',
      name: '30Y CMT',
      price: treasuryCurve.y30 ? `${treasuryCurve.y30.toFixed(3)}%` : '4.512%',
      change: '-0.018%',
      up: false,
    },
    {
      id: 'curve-2y10y',
      name: '2s10s Spread',
      price: treasuryCurve.curve2y10y !== null && treasuryCurve.curve2y10y !== undefined ? `${treasuryCurve.curve2y10y > 0 ? '+' : ''}${(treasuryCurve.curve2y10y * 100).toFixed(0)} bp` : '-13 bp',
      change: '+1.5 bp',
      up: true,
    },
  ];

  // Construct MBS production coupon items
  const mbsItems: TapeItem[] = quotes
    .filter((q) => q.category === 'UMBS_30Y' || q.category === 'GNMA_30Y')
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      name: b.symbol,
      price: b.priceFormatted,
      change: `${b.change32nds >= 0 ? '+' : ''}${b.change32nds}/32 (${b.changeBps >= 0 ? '+' : ''}${b.changeBps.toFixed(1)}bp)`,
      up: b.change32nds >= 0,
    }));

  const allItems = [...ustItems, ...macroIndices, ...mbsItems];
  // Repeat for continuous seamless animation loop
  const tapeLoop = [...allItems, ...allItems];

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#202020] overflow-hidden py-1.5 select-none relative z-20">
      <div className="flex items-center gap-0 w-max animate-marquee hover:[animation-play-state:paused]">
        {tapeLoop.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center space-x-2 px-4 border-r border-[#222222] font-mono text-[11px]"
          >
            <span className="text-gray-400 font-medium">{item.name}</span>
            <span className="text-white font-bold">{item.price}</span>
            {item.change && (
              <span
                className={`font-semibold ${
                  item.up === true
                    ? 'text-green-400'
                    : item.up === false
                    ? 'text-rose-400'
                    : 'text-gray-400'
                }`}
              >
                {item.change}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
