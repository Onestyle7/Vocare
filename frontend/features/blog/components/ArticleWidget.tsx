'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import type { ArticleWidgetName } from '../utils/articleWidgets';

// Loaded with next/dynamic so the widget is still server-rendered into the static article HTML,
// but its JS chunk is fetched only by articles that embed it.
const ARTICLE_WIDGETS: Record<ArticleWidgetName, ComponentType> = {
  'salary-calculator': dynamic(
    () => import('@/features/salary-calculator/components/SalaryCalculator')
  ),
};

export default function ArticleWidget({ name }: { name: ArticleWidgetName }) {
  const Widget = ARTICLE_WIDGETS[name];
  return <Widget />;
}
