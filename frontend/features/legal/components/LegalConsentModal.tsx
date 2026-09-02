'use client';

import { ExternalLink, FileText, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logOut } from '@/features/auth/dal/commands';

import { acceptLegalConsents } from '../dal/commands';
import { LegalDocumentType, PendingDocumentDto } from '../types';

interface LegalConsentModalProps {
  isOpen: boolean;
  documents: PendingDocumentDto[];
  onSuccess: () => void;
  onLogout?: () => void;
}

const DOCUMENT_LABELS: Record<LegalDocumentType, string> = {
  TermsOfService: 'Regulamin Serwisu',
  PrivacyPolicy: 'Polityka Prywatności',
};

export function LegalConsentModal({
  isOpen,
  documents,
  onSuccess,
  onLogout,
}: LegalConsentModalProps) {
  const [acceptedDocIds, setAcceptedDocIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const toggleDocument = (id: string) => {
    setAcceptedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllAccepted = documents.length > 0 && acceptedDocIds.size === documents.length;

  const handleSubmit = async () => {
    if (!isAllAccepted || isSubmitting || isLoggingOut) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const [error, data] = await acceptLegalConsents({
      documentIds: Array.from(acceptedDocIds),
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || 'Wystąpił błąd podczas akceptacji regulaminów.');
      toast.error('Nie udało się zapisać zgód. Spróbuj ponownie.');
      return;
    }

    if (data?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('token', data.accessToken);
    }

    toast.success('Zgody prawne zostały pomyślnie zaakceptowane.');
    onSuccess();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      onLogout?.();
      await logOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/sign-in';
      } else {
        router.replace('/sign-in');
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      } else {
        router.replace('/sign-in');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen || documents.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        hideCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-lg border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
      >
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-6 text-[#915EFF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#915EFF]">
              Wymagana akceptacja
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Aktualizacja Dokumentów Prawnych
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Aby kontynuować korzystanie z serwisu Vocare, zapoznaj się z poniższymi dokumentami i
            potwierdź ich akceptację.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-4">
          {documents.map((doc) => {
            const isChecked = acceptedDocIds.has(doc.id);
            const label = DOCUMENT_LABELS[doc.type] || doc.type;

            return (
              <div
                key={doc.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4.5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {label}{' '}
                        <span className="text-xs text-zinc-500 font-normal">
                          (wersja {doc.version})
                        </span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.contentPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#915EFF] underline-offset-4 hover:underline"
                  >
                    Otwórz PDF
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-zinc-800/80">
                  <Checkbox
                    id={`consent-${doc.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleDocument(doc.id)}
                    disabled={isSubmitting || isLoggingOut}
                    className="data-[state=checked]:bg-[#915EFF] data-[state=checked]:border-[#915EFF]"
                  />
                  <label
                    htmlFor={`consent-${doc.id}`}
                    className="cursor-pointer text-xs text-zinc-300 select-none leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Oświadczam, że zapoznałem się z dokumentem i akceptuję jego postanowienia.
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-500 text-center font-medium">{errorMessage}</p>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={isSubmitting || isLoggingOut}
            className="border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Wylogowywanie...
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" />
                Wyloguj się
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isAllAccepted || isSubmitting || isLoggingOut}
            className="bg-[#915EFF] hover:bg-[#7d4de3] text-white font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Zapisywanie zgód...
              </>
            ) : (
              'Akceptuję i przechodzę do serwisu'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
