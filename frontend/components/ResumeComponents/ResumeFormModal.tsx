'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CvDto } from '@/lib/types/resume';
import Image from 'next/image';
import { shape1, star_generate } from '@/app/constants';
import { ScrollParallax } from 'react-just-parallax';
import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  onGenerated: (cv: CvDto) => void;
}

export function ResumeFormModal({ onGenerated }: Props) {
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { tokenBalance, isLoading: isBalanceLoading, refresh } = useTokenBalanceContext();

  const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', {
        description: 'Please sign in to continue.',
      });
      return;
    }

    try {
      setLoading(true);
      const cv = await generateResume(position, token);
      onGenerated(cv);
      refresh();
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to generate resume.',
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins flex flex-col items-center gap-2 space-y-6">
      <div className="relative z-30 flex flex-col items-center justify-center space-y-4">
        <Input
          placeholder="Position (ex. Engineer)"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="flex w-full max-w-md items-center justify-center rounded-lg border-1 border-gray-500 p-2 text-center"
        />
        <Button
          className="h-[44px] w-full rounded-full bg-[#713ae8] text-white hover:bg-[#9c7dde]"
          onClick={() => setIsConfirmDialogOpen(true)}
          disabled={loading || !position}
        >
          {loading ? 'Generating...' : 'Generate resume'}
        </Button>
      </div>
      <ScrollParallax isAbsolutelyPositioned>
        <div className="absolute top-1/7 right-1/6 z-20 sm:top-1/9 sm:-right-20">
          <Image
            src={shape1}
            alt="shape"
            width={78}
            height={78}
            className="scale-65 -rotate-20 sm:scale-100"
          />
        </div>
      </ScrollParallax>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="font-poppins mx-auto max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Generate resume?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will take <b className="text-[#915EFF]">50 credits</b> from Your account.
            </AlertDialogDescription>

            <div className="mt-2 text-center text-sm font-extralight">
              Current balance:{' '}
              <span className="font-bold">{isBalanceLoading ? '...' : tokenBalance}</span>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerate}
              className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
            >
              Generate
              <Image src={star_generate} alt="star" width={16} height={16} />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function generateResume(position: string, token: string) {
  throw new Error('Function not implemented.');
}
