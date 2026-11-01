// Interactive widgets embedded in articles with a fenced block:
// ```vocare-widget
// salary-calculator
// ```
export const ARTICLE_WIDGET_NAMES = ['salary-calculator'] as const;

export type ArticleWidgetName = (typeof ARTICLE_WIDGET_NAMES)[number];

export const isArticleWidgetName = (value: string): value is ArticleWidgetName =>
  (ARTICLE_WIDGET_NAMES as readonly string[]).includes(value);
