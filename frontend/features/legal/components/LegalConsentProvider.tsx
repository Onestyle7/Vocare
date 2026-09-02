'use client';

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { useAuthContext } from '@/features/auth/components/AuthProvider';

import { PendingDocumentDto } from '../types';
import { LegalConsentModal } from './LegalConsentModal';

interface LegalConsentContextType {
  pendingDocuments: PendingDocumentDto[];
  hasPendingConsents: boolean;
}

const LegalConsentContext = createContext<LegalConsentContextType>({
  pendingDocuments: [],
  hasPendingConsents: false,
});

export function LegalConsentProvider({
  initialPendingDocuments = [],
  children,
}: {
  initialPendingDocuments?: PendingDocumentDto[];
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuthContext();
  const [pendingDocs, setPendingDocs] = useState<PendingDocumentDto[]>(initialPendingDocuments);
  const router = useRouter();

  useEffect(() => {
    setPendingDocs(initialPendingDocuments);
  }, [initialPendingDocuments]);

  const handleConsentsAccepted = () => {
    setPendingDocs([]);
    router.refresh();
  };

  const handleLogout = () => {
    setPendingDocs([]);
  };

  const hasPendingConsents = isAuthenticated && pendingDocs.length > 0;

  return (
    <LegalConsentContext.Provider
      value={{
        pendingDocuments: isAuthenticated ? pendingDocs : [],
        hasPendingConsents,
      }}
    >
      {children}
      {hasPendingConsents && (
        <LegalConsentModal
          isOpen={hasPendingConsents}
          documents={pendingDocs}
          onSuccess={handleConsentsAccepted}
          onLogout={handleLogout}
        />
      )}
    </LegalConsentContext.Provider>
  );
}

export const useLegalConsent = () => useContext(LegalConsentContext);
