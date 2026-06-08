'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ScrollParallax } from 'react-just-parallax';

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
import {
  circle_pricing,
  shape1,
  square_pricing,
  trapez_pricing,
} from '@/features/marketing/constants';

import { pricingPlans } from '../constants';
import { useBillingActions } from '../hooks/useBillingActions';
import { PricingCard } from './PricingCard';

const icons = [circle_pricing, square_pricing, trapez_pricing];

export function PricingInteractive() {
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false);
  const { handleCheckout, isPending } = useBillingActions();

  const individualPlan = pricingPlans.find((plan) => plan.type === 'individual');

  const handleIndividualProceed = async () => {
    if (!individualPlan) return;
    setIndividualDialogOpen(false);
    handleCheckout(individualPlan.priceId, individualPlan.type);
  };

  return (
    <>
      <div className="relative mt-6 mb-10 w-full px-4 md:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            width: 'min(80vw, 960px)',
            height: 'min(70vh, 780px)',
            background:
              'radial-gradient(ellipse at center, rgba(145,94,255,0.28) 0%, rgba(145,94,255,0.16) 45%, rgba(145,94,255,0.06) 65%, transparent 75%)',
            filter: 'blur(32px)',
          }}
        />
        <div className="font-grotesk grid items-end gap-8 md:grid-cols-3">
          <ScrollParallax isAbsolutelyPositioned zIndex={20}>
            <div className="absolute top-1/5 -left-4 z-20 sm:top-1/7 xl:top-0">
              <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
            </div>
            <div className="absolute top-1/2 -right-4 z-20">
              <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
            </div>
          </ScrollParallax>

          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={plan.priceId}
              plan={plan}
              icon={icons[index % icons.length]}
              isPending={isPending}
              onSelect={(priceId, type) => {
                if (type === 'individual') {
                  setIndividualDialogOpen(true);
                } else {
                  handleCheckout(priceId, type);
                }
              }}
            />
          ))}
        </div>
      </div>

      {individualPlan && (
        <AlertDialog open={individualDialogOpen} onOpenChange={setIndividualDialogOpen}>
          <AlertDialogContent className="font-grotesk max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Przejść do płatności?</AlertDialogTitle>
              <AlertDialogDescription>
                Skontaktujemy się przez<span className="font-bold text-[#818fff]"> e-mail </span>
                na adres powiązany z płatnością, gdy tylko zostanie zaksięgowana. <br />
                Czy chcesz teraz przejść do bezpiecznego checkoutu?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-3 sm:flex-row">
              <AlertDialogCancel className="rounded-full px-6">Anuluj</AlertDialogCancel>
              <AlertDialogAction className="rounded-full px-6" onClick={handleIndividualProceed}>
                Kontynuuj
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
