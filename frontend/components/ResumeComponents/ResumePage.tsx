// 'use client'
// import AnimatedHeadline from '@/components/AnimatedText'
// import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo'

// import { ResumeFormModal } from '@/components/ResumeComponents/ResumeFormModal'
// import Section from '@/components/Section'
// import { CvDto } from '@/lib/types/resume'
// import { useState } from 'react'
// import { Button } from '@/components/ui/button'
// import ResumeDetails from './ResumeDetails'

// export default function ResumePage() {
//   const [cv, setCv] = useState<CvDto | null>(null)
//   const [showForm, setShowForm] = useState(true)

//   const handleGenerated = (generatedCv: CvDto) => {
//     setCv(generatedCv)
//     setShowForm(false)
//   }

//   const handleReset = () => {
//     setCv(null)
//     setShowForm(true)
//   }

//   return (
//     <Section
//       className="relative -mt-[5.25rem] pt-[7.5rem]"
//       crosses
//       crossesOffset="lg:translate-y-[7.5rem]"
//       customPaddings
//       id="resume"
//     >
//       <div className="main-font-color relative xl:mx-10 flex flex-col items-center justify-center xl:border-t">
//         <GridBackgroundDemo />
//         <div className="relative p-6 max-w-5xl mx-auto flex items-center justify-center flex-col h-[80vh] space-y-6">
//           <h1 className="text-[50px] leading-12 sm:leading-17 font-bold uppercase text-center lg:text-[78px] xl:text-[88px] 2xl:text-[108px] 2xl:leading-21">
//             <AnimatedHeadline
//               lines={['Create your', 'resume']}
//               className="items-center"
//             />
//           </h1>

//           {showForm && (
//             <ResumeFormModal onGenerated={handleGenerated} />
//           )}

//           {cv && (
//             <>
//               <div className="mt-10">
//                 <ResumeDetails cv={cv} />
//               </div>
//               <Button
//                 onClick={handleReset}
//                 className="mt-6 rounded-full h-[44px] bg-[#713ae8] hover:bg-[#9c7dde] text-white"
//               >
//                 Create new resume
//               </Button>
//             </>
//           )}
//         </div>
//       </div>
//     </Section>
//   )
// }

// "use client";

// import { useState, useEffect } from 'react';
// import ResumeDetails from './ResumeDetails';
// import { CvDto, fetchGeneratedCv } from '@/lib/types/resume';

// export default function CvPage() {
//   const [cv, setCv] = useState<CvDto | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [position, setPosition] = useState<string>('');

//   // Function to generate CV
//   const generateCv = async (positionValue?: string) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const data = await fetchGeneratedCv(positionValue);
//       setCv(data);
//     } catch (err) {
//       setError('Failed to generate CV. Please try again later.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Generate CV on initial load
//   useEffect(() => {
//     generateCv();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-white rounded-lg shadow-md p-6 mb-8">
//           <h1 className="text-2xl font-bold mb-4">CV Generator</h1>

//           <div className="flex flex-col md:flex-row gap-4 mb-6">
//             <input
//               type="text"
//               placeholder="Enter position (e.g., UI Designer, Web Developer)"
//               className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={position}
//               onChange={(e) => setPosition(e.target.value)}
//             />
//             <button
//               onClick={() => generateCv(position)}
//               className="bg-blue-600 text-white font-medium py-2 px-6 rounded hover:bg-blue-700 transition duration-300"
//               disabled={loading}
//             >
//               {loading ? 'Generating...' : 'Generate CV'}
//             </button>
//           </div>

//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
//               {error}
//             </div>
//           )}
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         ) : cv ? (
//           <ResumeDetails cv={cv} />
//         ) : null}
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState } from 'react';
import ResumeDetails from './ResumeDetails';
import Section from '../SupportComponents/Section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import Image from 'next/image';
import Link from 'next/link';
import { star_generate } from '@/app/constants';

const ResumePage = () => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { tokenBalance, isLoading: isBalanceLoading, refresh } = useTokenBalanceContext();

  const handleGenerateResume = async () => {
    // Tu można dodać logikę odejmowania tokenów
    console.log('Token deducted and resume unlocked');
    setHasAccess(true);
    refresh();
  };

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="hero"
    >
      {!hasAccess && (
        <>
          <div className="font-poppins mb-12 flex flex-col items-center text-center">
            <h2 className="mb-2 text-2xl font-bold text-[#915EFF]">Your Resume</h2>
            <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              This CV is created using a layout compatible with AI-based CV scanners. <br />
              The data shown here is pulled from your profile. If you&apos;d like to make changes,
              simply update your profile and regenerate your CV.
            </p>
          </div>

          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setIsConfirmDialogOpen(true)}
              className="font-poppins rounded-md bg-[#915EFF] px-6 py-3 text-white transition hover:bg-[#7b4ee0]"
            >
              Generate Resume
            </button>
          </div>
        </>
      )}

      {hasAccess && (
        <div className="mt-8">
          <ResumeDetails />
        </div>
      )}

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="font-poppins mx-auto max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Generate new resume?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will take <b className="text-[#915EFF]">50 credits</b> from your account.
            </AlertDialogDescription>

            <div className="mt-2 text-center text-sm font-extralight">
              Current balance:{' '}
              <span className="font-bold">{isBalanceLoading ? '...' : tokenBalance}</span>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>

            {!isBalanceLoading && typeof tokenBalance === 'number' && tokenBalance < 50 ? (
              <Link href="/pricing">
                <AlertDialogAction
                  className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                  onClick={() => setIsConfirmDialogOpen(false)}
                >
                  Get tokens
                  <Image src={star_generate} alt="star" width={16} height={16} />
                </AlertDialogAction>
              </Link>
            ) : (
              <AlertDialogAction
                onClick={async () => {
                  await handleGenerateResume();
                  setIsConfirmDialogOpen(false);
                }}
                className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
              >
                Generate
                <Image src={star_generate} alt="star" width={16} height={16} />
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
};

export default ResumePage;
