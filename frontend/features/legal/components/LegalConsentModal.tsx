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

  const isAllAccepted =
    documents.length > 0 && documents.every((document) => acceptedDocIds.has(document.id));

  const handleSubmit = async () => {
    if (!isAllAccepted || isSubmitting || isLoggingOut) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const [error] = await acceptLegalConsents({
        documentIds: Array.from(acceptedDocIds),
      });

      if (error) {
        setErrorMessage(error.message || 'Wystąpił błąd podczas akceptacji regulaminów.');
        toast.error('Nie udało się zapisać zgód. Spróbuj ponownie.');
        return;
      }

      toast.success('Zgody prawne zostały pomyślnie zaakceptowane.');
      onSuccess();
    } catch {
      setErrorMessage('Wystąpił błąd podczas akceptacji regulaminów.');
      toast.error('Nie udało się zapisać zgód. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (isSubmitting || isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logOut();
      onLogout?.();

      try {
        localStorage.removeItem('token');
      } catch {
        // Legacy storage can be unavailable without preventing a cookie-based logout.
      }

      router.replace('/sign-in');
    } catch {
      toast.error('Nie udało się wylogować. Spróbuj ponownie.');
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
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="border-border bg-background text-foreground max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-6 shadow-2xl"
      >
        <DialogHeader className="gap-2">
          <div className="text-primary flex items-center gap-2">
            <ShieldCheck className="size-6 text-[#915EFF]" />
            <span className="text-xs font-semibold tracking-wider text-[#915EFF] uppercase">
              Wymagana akceptacja
            </span>
          </div>
          <DialogTitle className="text-foreground text-xl font-bold">
            Aktualizacja Dokumentów Prawnych
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
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
                className="border-border bg-muted/40 hover:border-muted-foreground/40 rounded-lg border p-4 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground size-4.5" />
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {label}{' '}
                        <span className="text-muted-foreground text-xs font-normal">
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

                <div className="border-border mt-3 flex items-start space-x-2 border-t pt-2">
                  <Checkbox
                    id={`consent-${doc.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleDocument(doc.id)}
                    disabled={isSubmitting || isLoggingOut}
                    className="data-[state=checked]:border-[#915EFF] data-[state=checked]:bg-[#915EFF]"
                  />
                  <label
                    htmlFor={`consent-${doc.id}`}
                    className="text-foreground/80 cursor-pointer text-xs leading-snug select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Oświadczam, że zapoznałem się z dokumentem i akceptuję jego postanowienia.
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <p role="alert" className="text-destructive text-center text-xs font-medium">
            {errorMessage}
          </p>
        )}

        <DialogFooter className="mt-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={isSubmitting || isLoggingOut}
            className="text-muted-foreground hover:text-foreground"
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
            className="bg-[#915EFF] font-medium text-white hover:bg-[#7d4de3] disabled:opacity-50"
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
