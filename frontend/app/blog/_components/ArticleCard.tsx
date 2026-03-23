import { ArticleMetadata } from '../_utils/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Clock7 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ArticleCard({ article }: { article: ArticleMetadata }) {
  return (
    <Card className="group bg-card hover:border-primary flex h-full flex-col overflow-hidden rounded-xl border-2 border-transparent pt-0 text-left duration-300 hover:-translate-y-2 hover:border-2">
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        <Image
          src={article.coverImage}
          fill
          alt={article.title}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardContent className="font-poppins flex-1 space-y-3">
        <div className="font-korbin flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Badge key={article.slug + tag}>{tag}</Badge>
          ))}
        </div>
        <h4 className="font-bold">{article.title}</h4>
        <p className="text-muted-foreground text-sm">{article.description}</p>
      </CardContent>
      <CardFooter className="text- text-muted-foreground mt-auto flex items-center justify-between text-[12px]">
        {/* <p>{article.date.toDateString()}</p> */}
        <p className="flex items-center gap-2">
          <Clock7 width={15} />
          {article.estimatedReadTime} min. czytania
        </p>
        <p>Czytaj dalej&rarr;</p>
      </CardFooter>
    </Card>
  );
}
