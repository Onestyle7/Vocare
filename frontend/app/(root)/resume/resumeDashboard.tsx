'use client';
import React, { useEffect, useState } from 'react';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import { getUserCvs, getCvLimits, deleteCv } from '@/lib/api/cv';
import { CvListItemDto, CvLimits } from '@/lib/types/cv';
import Link from 'next/link';
import { Plus, FileText, Clock, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const ResumeDashboard = () => {
  const [cvs, setCvs] = useState<CvListItemDto[]>([]);
  const [limits, setLimits] = useState<CvLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [limitPopoverOpen, setLimitPopoverOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cvData, limitData] = await Promise.all([getUserCvs(), getCvLimits()]);
        setCvs(cvData);
        setLimits(limitData);
      } catch (err) {
        console.error('Failed to load CV data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      return { label: 'Updated', variant: 'updated' };
    }

    return null;
  };

  const SkeletonCard = () => (
    <div className="flex h-[400px] flex-col gap-2 rounded-xl border p-4">
      <div className="h-full rounded-md border">
        <div className="bg-muted group relative mb-2 h-1/2 animate-pulse rounded-tl-md rounded-tr-md"></div>
        <div className="space-y-3 p-4">
          <div className="bg-muted h-6 w-3/4 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded-md" />
        </div>
        <Separator className="w-full" />
        <div className="flex flex-row items-center justify-between p-4">
          <div className="bg-muted h-9 w-16 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed">
      <FileText className="text-muted-foreground mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-medium">No resumes yet</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
        Create your first resume to get started with your career journey.
      </p>
      <Link href="/resume/create">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Resume
        </Button>
      </Link>
    </div>
  );

  const handleDelete = async (cvId: string) => {
    try {
      await deleteCv(cvId);
      setCvs((prev) => prev.filter((cv) => cv.id !== cvId));
      const updatedLimits = await getCvLimits();
      setLimits(updatedLimits);
    } catch (err) {
      console.error('Failed to delete CV', err);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="font-poppins relative">
        <GridBackgroundDemo />
        <div className="relative z-10 w-full py-20 lg:py-40">
          <div className="container mx-auto">
            <div className="flex flex-col gap-10">
              {/* Header Section */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {limits ? `${limits.currentCount}/${limits.maxLimit}` : 'Basic'}
                  </Badge>
                  {!loading && cvs.length > 0 && (
                    limits && limits.currentCount >= limits.maxLimit ? (
                      <Popover open={limitPopoverOpen} onOpenChange={setLimitPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Resume
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="font-poppins w-72">
                          <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-medium">You have reached the maximum number of resumes.</h4>
                            <p className="text-muted-foreground text-xs">Remove some resumes or upgrade your plan.</p>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => setLimitPopoverOpen(false)}>
                                Close
                              </Button>
                              <Link href="/pricing">
                                <Button size="sm">Upgrade</Button>
                              </Link>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Link href="/resume/create">
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          New Resume
                        </Button>
                      </Link>
                    )
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="font-regular max-w-xl text-left text-3xl tracking-tighter md:text-5xl">
                    Your resumes
                  </h2>
                  <p className="text-muted-foreground max-w-xl text-left text-lg leading-relaxed tracking-tight lg:max-w-lg">
                    {limits
                      ? `You can save up to ${limits.maxLimit} resumes in your current plan.`
                      : 'Manage your professional resumes and track your applications.'}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </>
                ) : cvs.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {cvs.map((cv) => (
                      <Link key={cv.id} href={`/resume/${cv.id}`} className="block">
                        <div className="group flex h-[400px] flex-col gap-2 rounded-xl border p-4 transition-shadow hover:shadow-lg bg-background">
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
                                <AlertDialog
                                  open={deleteId === cv.id}
                                  onOpenChange={(open) => setDeleteId(open ? cv.id : null)}
                                >
                                  <AlertDialogTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteId(cv.id);
                                      }}
                                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/30 p-2 text-white opacity-0 shadow-md backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-red-500/80"
                                    >
                                      <Trash2
                                        size={16}
                                        className="transition-all hover:scale-110"
                                      />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="font-poppins">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep the resume</AlertDialogCancel>
                                      <AlertDialogAction
                                        className='bg-red-500 text-white hover:bg-red-400'
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDelete(cv.id);
                                        }}>
                                        Yes, I want to delete
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
                                {cv.targetPosition || 'No target position specified'}
                              </p>
                            </div>

                            <Separator className="w-full" />

                            {/* Card Actions */}
                            <div className="flex min-h-[72px] flex-row items-center justify-between p-4">
                              <Button size="sm">Edit</Button>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <Clock className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm font-semibold">
                                  {cv.lastModifiedAt
                                    ? `Modified ${formatDateTime(cv.lastModifiedAt)}`
                                    : 'Created recently'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDashboard;