'use client';
import { Clock, FileText, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { CvLimits, CvListItemDto } from '@/lib/types/cv';

import { useResumeDashboardActions } from '../hooks/useResumeDashboardActions';

interface ResumeDashboardProps {
  initialCvs: CvListItemDto[];
  initialLimits: CvLimits | null;
}

const ResumeDashboard = ({ initialCvs, initialLimits }: ResumeDashboardProps) => {
  const router = useRouter();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const isMobile = useIsMobile();
  const { handleDeleteResume, handleCreateResume, isCreating } = useResumeDashboardActions();
  const cvs = initialCvs;
  const limits = initialLimits;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  };

  const getCvBadgeInfo = (createdAt: string, lastModifiedAt: string) => {
    const created = new Date(createdAt);
    const modified = new Date(lastModifiedAt);
    const now = new Date();

    const daysSinceCreated = (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
    const daysSinceModified = (now.getTime() - modified.getTime()) / (24 * 60 * 60 * 1000);
    const timeBetweenCreatedAndModified = (modified.getTime() - created.getTime()) / (60 * 1000); // w minutach

    // Nowe: utworzone max 3 dni temu I nie było znacząco modyfikowane
    if (daysSinceCreated <= 3 && timeBetweenCreatedAndModified < 30) {
      return { label: 'New', variant: 'new' };
    }

    // Zaktualizowane: modyfikowane w ciągu ostatnich 2 dni
    if (daysSinceModified <= 2 && timeBetweenCreatedAndModified >= 30) {
      return { label: 'Zaktualizowano', variant: 'updated' };
    }

    return null;
  };

  const EmptyState = () => (
    <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed">
      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-medium">Brak CV</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
        {isMobile
          ? 'Tworzenie i edycja CV są dostępne na komputerze. Po utworzeniu zobaczysz podgląd w tym miejscu.'
          : 'Rozpocznij tworzenie swojego pierwszego CV, klikając przycisk poniżej.'}
      </p>
      {!isMobile && (
        <Button className="gap-2" onClick={handleCreateResume} disabled={isCreating}>
          <Plus className="h-4 w-4" />
          {isCreating ? 'Tworzenie...' : 'Stwórz CV'}
        </Button>
      )}
    </div>
  );

  const handleNewResumeClick = () => {
    if (isMobile) return;
    if (limits && limits.currentCount >= limits.maxLimit) {
      setShowLimitDialog(true);
    } else {
      handleCreateResume();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="font-grotesk relative">
        <GridBackgroundDemo />
        <div className="relative z-10 w-full py-4">
          <div className="container mx-auto">
            <div className="flex flex-col gap-10">
              {/* Header Section */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {limits ? `${limits.currentCount}/${limits.maxLimit}` : 'Basic'}
                  </Badge>
                  {cvs.length > 0 && !isMobile && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleNewResumeClick}
                      disabled={isCreating}
                    >
                      <Plus className="h-4 w-4" />
                      {isCreating ? 'Tworzenie...' : 'Stwórz nowe'}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
                    Twoje cv
                  </h2>
                  <p className="text-muted-foreground max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                    {limits
                      ? `Możesz zapisać do ${limits.maxLimit} CV w swoim aktualnym planie.`
                      : 'Zarządzaj swoimi profesjonalnymi CV i śledź swoje aplikacje.'}
                  </p>
                  {isMobile && (
                    <p className="text-muted-foreground max-w-xl text-left text-sm leading-relaxed tracking-tight lg:max-w-lg">
                      Na telefonie dostępny jest podgląd i pobieranie CV. Tworzenie i edycja są
                      możliwe na komputerze.
                    </p>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {cvs.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {cvs.map((cv) => (
                      <div
                        key={cv.id}
                        onClick={() => router.push(`/dashboard/resume/${cv.id}`)}
                        className="block cursor-pointer"
                      >
                        <div className="group bg-background flex h-[400px] flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-lg">
                          <div className="flex h-full flex-col rounded-md border">
                            <div className="bg-muted group relative mb-2 h-1/2 rounded-tl-md rounded-tr-md">
                              {/* Badge - conditionally rendered based on CV status */}
                              {(() => {
                                const badgeInfo = getCvBadgeInfo(cv.createdAt, cv.lastModifiedAt);
                                return badgeInfo ? (
                                  <div className="absolute top-0 right-0 p-2">
                                    <Badge
                                      className={
                                        badgeInfo.variant === 'new'
                                          ? 'bg-white text-black hover:bg-white'
                                          : 'bg-white text-black hover:bg-white'
                                      }
                                    >
                                      {badgeInfo.label}
                                    </Badge>
                                  </div>
                                ) : null;
                              })()}

                              {/* Delete Button */}
                              <div className="absolute top-0 left-0 p-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/30 p-2 text-white opacity-0 shadow-md backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-red-500/80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2
                                        size={16}
                                        className="transition-all hover:scale-110"
                                      />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="font-grotesk">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Usunąć CV?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ta akcja nie może być cofnięta.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                        Zachowaj CV
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 text-white hover:bg-red-400"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteResume(cv.id);
                                        }}
                                      >
                                        Tak, chcę usunąć
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              {/* Preview Area */}
                              <div className="flex h-full items-center justify-center overflow-hidden">
                                <FileText className="text-muted-foreground/50 h-52 w-52 translate-y-1/2 transition-all group-hover:translate-y-1/3" />
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 p-4">
                              <h3 className="line-clamp-1 text-xl tracking-tight">{cv.name}</h3>
                              <p className="text-muted-foreground line-clamp-2 text-base">
                                {cv.targetPosition || 'Nie określono stanowiska docelowego'}
                              </p>
                            </div>

                            <Separator className="w-full" />

                            {/* Card Actions */}
                            <div className="flex min-h-[72px] flex-row items-center justify-between p-4">
                              <Button size="sm">{isMobile ? 'Podgląd' : 'Edytuj'}</Button>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <Clock className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm font-semibold">
                                  {cv.lastModifiedAt
                                    ? `Zmodyfikowano ${formatDateTime(cv.lastModifiedAt)}`
                                    : 'Utworzono niedawno'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Reached Alert Dialog */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent className="font-grotesk">
          <AlertDialogHeader>
            <AlertDialogTitle>Osiągnąłeś limit CV dla swojego planu</AlertDialogTitle>
            <AlertDialogDescription>
              Usuń nieaktualne CV lub podnieś swój plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = '/pricing';
              }}
            >
              Podnieś
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResumeDashboard;
