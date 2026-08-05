'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { ai_magic } from '@/features/marketing/constants';
import { cn } from '@/lib/utils';

const PROMO_DURATION_MS = 5_000;
const REMOUNT_GRACE_PERIOD_MS = 1_000;

interface PromoSession {
  cvId: string;
  dismissed: boolean;
  mountedInstances: number;
  releaseTimer: ReturnType<typeof setTimeout> | null;
  startedAt: number;
}

const promoSessions = new Map<string, PromoSession>();

function acquirePromoSession(cvId: string): PromoSession {
  const existingSession = promoSessions.get(cvId);

  if (existingSession) {
    if (existingSession.releaseTimer) {
      clearTimeout(existingSession.releaseTimer);
      existingSession.releaseTimer = null;
    }

    existingSession.mountedInstances += 1;
    return existingSession;
  }

  const session: PromoSession = {
    cvId,
    dismissed: false,
    mountedInstances: 1,
    releaseTimer: null,
    startedAt: Date.now(),
  };

  promoSessions.set(cvId, session);
  return session;
}

function releasePromoSession(session: PromoSession) {
  session.mountedInstances = Math.max(0, session.mountedInstances - 1);

  if (session.mountedInstances > 0) {
    return;
  }

  session.releaseTimer = setTimeout(() => {
    if (session.mountedInstances === 0 && promoSessions.get(session.cvId) === session) {
      promoSessions.delete(session.cvId);
    }
  }, REMOUNT_GRACE_PERIOD_MS);
}

interface ResumeAnalysisPromoButtonProps {
  cvId: string | null;
  onAnalyze: () => void;
}

export function ResumeAnalysisPromoButton({ cvId, onAnalyze }: ResumeAnalysisPromoButtonProps) {
  const [isPromoVisible, setIsPromoVisible] = useState(false);

  useEffect(() => {
    if (!cvId) {
      setIsPromoVisible(false);
      return;
    }

    const session = acquirePromoSession(cvId);
    const elapsedTime = Date.now() - session.startedAt;
    const remainingTime = Math.max(0, PROMO_DURATION_MS - elapsedTime);
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    if (!session.dismissed && remainingTime > 0) {
      setIsPromoVisible(true);
      hideTimer = setTimeout(() => {
        session.dismissed = true;
        setIsPromoVisible(false);
      }, remainingTime);
    } else {
      setIsPromoVisible(false);
    }

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      releasePromoSession(session);
    };
  }, [cvId]);

  const handleAnalyze = () => {
    if (!cvId) {
      return;
    }

    const session = promoSessions.get(cvId);
    if (session) {
      session.dismissed = true;
    }
    setIsPromoVisible(false);
    onAnalyze();
  };

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!cvId}
        aria-label="Przeanalizuj swoje CV"
        title="Przeanalizuj swoje CV"
        className="group relative isolate flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-[linear-gradient(140deg,rgba(145,94,255,0.95)_0%,rgba(145,94,255,0.5)_19%,transparent_42%,transparent_69%,rgba(157,155,255,0.58)_86%,rgba(145,94,255,0.9)_100%)] p-[1.5px] shadow-[0_8px_20px_-13px_rgba(145,94,255,0.9)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_10px_24px_-12px_rgba(145,94,255,0.95)] focus-visible:ring-2 focus-visible:ring-[#915EFF]/35 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="absolute inset-[1.5px] rounded-[10.5px] bg-white transition-colors duration-200 group-hover:bg-[#F8F5FF] motion-reduce:transition-none"
        />
        <Image
          src={ai_magic}
          width={27}
          height={27}
          alt=""
          aria-hidden="true"
          className="relative z-10"
        />
      </button>

      {cvId && (
        <span
          aria-hidden="true"
          data-state={isPromoVisible ? 'visible' : 'hidden'}
          className={cn(
            'pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-50 -translate-y-1/2 rounded-lg border border-[#915EFF]/20 bg-[#F3EDFF] px-3 py-2 text-xs font-medium whitespace-nowrap text-[#7440DC] shadow-[0_8px_24px_-10px_rgba(74,32,151,0.45)] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
            isPromoVisible ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
          )}
        >
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-[5px] h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b border-l border-[#915EFF]/20 bg-[#F3EDFF]"
          />
          Przeanalizuj swoje CV
        </span>
      )}
    </div>
  );
}
