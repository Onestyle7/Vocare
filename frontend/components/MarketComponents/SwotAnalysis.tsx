import React from 'react';
import { Badge } from '../ui/badge';

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface SwotAnalysisProps {
  data: SwotData;
  className?: string;
}

const SwotAnalysis: React.FC<SwotAnalysisProps> = ({ data, className = '' }) => {
  const GRAD_TL =
    'bg-[radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.12)_0%,rgba(34,197,94,0.06)_15%,transparent_40%)]';
  const GRAD_TR =
    'bg-[radial-gradient(circle_at_0%_100%,rgba(239,68,68,0.12)_0%,rgba(239,68,68,0.06)_15%,transparent_40%)]';
  const GRAD_BL =
    'bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.12)_0%,rgba(59,130,246,0.06)_15%,transparent_40%)]';
  const GRAD_BR =
    'bg-[radial-gradient(circle_at_0%_0%,rgba(249,115,22,0.12)_0%,rgba(249,115,22,0.06)_15%,transparent_40%)]';

  const QuadrantItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = '',
  }) => <div className={`h-full min-h-0 p-2 sm:p-3 lg:p-4 ${className}`}>{children}</div>;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="grid grid-cols-1 items-stretch gap-0 overflow-hidden rounded-lg border shadow-lg md:h-[460px] lg:h-[500px] lg:[grid-auto-rows:1fr] lg:grid-cols-2">
          <QuadrantItem className={`${GRAD_TL} max-lg:border-b`}>
            <div className="flex h-full flex-col">
              <div className="mb-4 flex w-full items-center justify-start">
                <Badge>Mocne strony</Badge>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-2 text-xs text-gray-300 sm:text-sm lg:text-base">
                {data.strengths.map((strength, i) => (
                  <div key={i} className="flex items-start">
                    <span className="mr-2 font-bold text-gray-300">•</span>
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </QuadrantItem>

          <QuadrantItem className={`lg:border-l ${GRAD_TR}`}>
            <div className="flex h-full flex-col">
              <div className="mb-4 flex w-full items-center justify-end">
                <Badge>Słabe strony</Badge>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-2 text-xs text-gray-300 sm:text-sm lg:text-base">
                {data.weaknesses.map((weakness, i) => (
                  <div key={i} className="flex items-start">
                    <span className="mr-2 font-bold text-gray-300">•</span>
                    <span>{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          </QuadrantItem>

          <QuadrantItem className={`border-t ${GRAD_BL}`}>
            <div className="flex h-full flex-col">
              <div className="mb-4 flex w-full items-center justify-start">
                <Badge>Możliwości</Badge>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-2 text-xs text-gray-300 sm:text-sm lg:text-base">
                {data.opportunities.map((opportunity, i) => (
                  <div key={i} className="flex items-start">
                    <span className="mr-2 font-bold text-gray-300">•</span>
                    <span>{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          </QuadrantItem>

          <QuadrantItem className={`border-t lg:border-l ${GRAD_BR}`}>
            <div className="flex h-full flex-col">
              <div className="mb-4 flex w-full items-center justify-end">
                <Badge>Zagrożenia</Badge>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-2 text-xs text-gray-300 sm:text-sm lg:text-base">
                {data.threats.map((threat, i) => (
                  <div key={i} className="flex items-start">
                    <span className="mr-2 font-bold text-gray-300">•</span>
                    <span>{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          </QuadrantItem>
        </div>
      </div>
    </div>
  );
};

export default SwotAnalysis;
