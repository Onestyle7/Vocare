import AssistantPage from '@/components/AssistantComponents/MainPageAssisstant';
import { ScrollProgress } from '@/components/magicui/scroll-progress';
import Header from '@/components/SectionsComponents/Header';
import React from 'react';

const page = () => {
  return (
    <main>
      <ScrollProgress />
      <Header />
      {/* <NewAssistantComponent /> */}
      <AssistantPage />
    </main>
  );
};

export default page;
