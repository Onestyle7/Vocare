import AssistantPage from '@/components/AssistantComponents/MainPageAssisstant';
import { ScrollProgress } from '@/components/magicui/scroll-progress';
import NewAssistantComponent from '@/components/MarketComponents/NewAssistantComponent';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import React from 'react';

const page = () => {
  return (
    <main>
      <ScrollProgress />
      <Header />
      <NewAssistantComponent />
    </main>
  );
};

export default page;
