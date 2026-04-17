import React from 'react';

import { ScrollProgress } from '@/components/magicui/scroll-progress';
import Header from '@/components/SectionsComponents/Header';
import AssistantPage from '@/features/assistant/components/MainPageAssisstant';

const page = () => {
  return (
    <main>
      <ScrollProgress />
      <Header />
      <AssistantPage />
    </main>
  );
};

export default page;
