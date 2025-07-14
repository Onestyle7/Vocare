import { ChartBarLabel } from '@/components/SupportComponents/ChartBarLabel';
import { ChartPieInteractive } from '@/components/SupportComponents/PieChart';
import { ChartAreaStacked } from '@/components/SupportComponents/SectionsComponents/AreaChart';
import React from 'react';

const DashboardGrid: React.FC = () => {
  return (
    <div className="p-4 min-h-screen max-w-7xl mx-auto border bg-black">
      {/* Main grid container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 max-w-7xl mx-auto font-poppins">
        
        {/* Top row - Balance card (spans 8 columns on desktop, full width on mobile) */}
        <div className="md:col-span-8 border-2 bg-[#F2F0EF] rounded-lg w-full h-84">
          <div className='w-full h-full overflow-hidden'>
            <ChartAreaStacked />
          </div>
        </div>
        
        {/* Top row - Quick trade card (spans 4 columns on desktop, full width on mobile) */}
        <div className="md:col-span-4 border-2 bg-[#F2F0EF] rounded-lg p-4 h-84">
          <div className="text-black text-sm">Quick trade</div>
        </div>
        
        {/* Second row - Orders history (spans 4 columns on desktop, full width on mobile) */}
        <div className="md:col-span-4 border-2 bg-[#F2F0EF] rounded-lg p-4 h-68">

        </div>
        
        {/* Second row - Sales statistics (spans 4 columns on desktop, full width on mobile) */}
        <div className="md:col-span-4 border-2 bg-[#F2F0EF] rounded-lg h-68">
          <div className='w-full h-full'>
            <ChartBarLabel />
          </div>
        </div>
        
        {/* Second row - Exchange offers + User list (spans 4 columns on desktop, full width on mobile) */}
        <div className="md:col-span-4 md:row-span-2 border-2 bg-[#F2F0EF] rounded-lg p-4 h-auto">
          <div className='w-full h-full'>
            <ChartPieInteractive />
          </div>
        </div>
        
        {/* Third row - Transactions (spans 8 columns on desktop, full width on mobile) */}
        <div className="md:col-span-8 border-2 bg-[#F2F0EF] rounded-lg p-4 h-64">
          <div className="text-black text-sm">Transactions</div>
        </div>
        
      </div>
    </div>
  );
};

export default DashboardGrid;