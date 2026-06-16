import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[600px] rounded-full border-2 duration-200 focus-within:border-[#818fff] focus-within:ring-1 focus-within:ring-[#818fff]',
        className
      )}
    >
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-7 w-7 -translate-y-1/2" />
      <Input
        className="h-auto rounded-full pl-14 focus-visible:ring-0"
        name="article-search"
        type="text"
        placeholder="Szukaj artykułów, porad, trendów..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
