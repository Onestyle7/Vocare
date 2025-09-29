import { ChartAreaStacked } from '@/components/SectionsComponents/AreaChart';
import { ChartBarLabel } from '@/components/SupportComponents/ChartBarLabel';
import { ChartPieInteractive } from '@/components/SupportComponents/PieChart';
import React from 'react';

const DashboardGrid: React.FC = () => {
  return (
    <div className="mx-auto min-h-screen max-w-7xl border bg-black p-4">
      {/* Main grid container */}
      <div className="font-poppins mx-auto grid max-w-7xl grid-cols-1 gap-2 md:grid-cols-12">
        {/* Top row - Balance card (spans 8 columns on desktop, full width on mobile) */}
        <div className="h-84 w-full rounded-lg border-2 bg-[#F2F0EF] md:col-span-8">
          <div className="h-full w-full overflow-hidden">
            <ChartAreaStacked />
          </div>
        </div>

        {/* Top row - Quick trade card (spans 4 columns on desktop, full width on mobile) */}
        <div className="h-84 rounded-lg border-2 bg-[#F2F0EF] p-4 md:col-span-4">
          <div className="text-sm text-black">Quick trade</div>
        </div>

        {/* Second row - Orders history (spans 4 columns on desktop, full width on mobile) */}
        <div className="h-68 rounded-lg border-2 bg-[#F2F0EF] p-4 md:col-span-4"></div>

        {/* Second row - Sales statistics (spans 4 columns on desktop, full width on mobile) */}
        <div className="h-68 rounded-lg border-2 bg-[#F2F0EF] md:col-span-4">
          <div className="h-full w-full">
            <ChartBarLabel />
          </div>
        </div>

        {/* Second row - Exchange offers + User list (spans 4 columns on desktop, full width on mobile) */}
        <div className="h-auto rounded-lg border-2 bg-[#F2F0EF] p-4 md:col-span-4 md:row-span-2">
          <div className="h-full w-full">
            <ChartPieInteractive />
          </div>
        </div>

        {/* Third row - Transactions (spans 8 columns on desktop, full width on mobile) */}
        <div className="h-64 rounded-lg border-2 bg-[#F2F0EF] p-4 md:col-span-8">
          <div className="text-sm text-black">Transactions</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
