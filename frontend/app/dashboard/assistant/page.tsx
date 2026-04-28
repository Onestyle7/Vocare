import React from 'react';

import AssistantPage from '@/components/AssistantComponents/MainPageAssisstant';
import { ScrollProgress } from '@/components/magicui/scroll-progress';
import Header from '@/components/SectionsComponents/Header';

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
