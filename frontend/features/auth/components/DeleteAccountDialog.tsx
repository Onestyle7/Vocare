'use client';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { deleteAccount } from '@/features/auth/dal/commands';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountDialog({ isOpen, onClose }: DeleteAccountDialogProps) {
  const [password, setPassword] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    setIsPending(true);
    setErrorMsg(null);

    try {
      const [error] = await deleteAccount(
        password.trim() ? { password: password.trim() } : undefined
      );

      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
        return;
      }

      toast.success('Twoje konto zostało pomyślnie usunięte.');
      try {
        localStorage.removeItem('token');
      } catch {}
      onClose();
      window.location.href = '/';
    } catch {
      const fallbackMsg = 'Wystąpił nieoczekiwany błąd podczas usuwania konta.';
      setErrorMsg(fallbackMsg);
      toast.error(fallbackMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent
        className="border-border bg-background font-poppins text-foreground max-w-md p-6 shadow-2xl"
        onEscapeKeyDown={(e) => isPending && e.preventDefault()}
        onPointerDownOutside={(e) => isPending && e.preventDefault()}
      >
        <DialogHeader className="gap-2">
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangle className="text-destructive size-5" />
            <span className="text-destructive text-xs font-semibold tracking-wider uppercase">
              Strefa niebezpieczna
            </span>
          </div>
          <DialogTitle className="text-foreground text-xl font-bold">
            Trwałe usunięcie konta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Ta operacja jest <span className="text-destructive font-semibold">nieodwracalna</span>.
            Wszystkie Twoje dane (profil zawodowy, wygenerowane CV, roadmapy i historia analiz)
            zostaną bezpowrotnie usunięte. Jeśli posiadasz aktywną subskrypcję, zostanie ona
            natychmiast anulowana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="delete-account-password" className="text-foreground text-xs font-medium">
            Hasło do konta
          </label>
          <Input
            id="delete-account-password"
            type="password"
            placeholder="Wprowadź swoje hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            className="border-border"
          />
          <p className="text-muted-foreground text-xs">
            Pozostaw to pole puste, jeśli logujesz się przez Google.
          </p>

          {errorMsg && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Usuwanie konta...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                Potwierdzam usunięcie konta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
