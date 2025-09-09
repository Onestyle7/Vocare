import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AspectRatio } from './ui/aspect-ratio';
import Image from 'next/image';
import { Badge } from './ui/badge';

interface CardData {
  title: string;
  items: string[];
  imageSrc: string;
  badgeText: string;
}

interface ReusableCardProps {
  data: CardData;
}

const ReusableCard = ({ data }: ReusableCardProps) => {
  return (
    <Card className="mr-2 h-full w-full max-w-xs flex-shrink-0 border py-4">
      <CardHeader className="px-4">
        <div className="w-full overflow-hidden rounded-md border">
          <AspectRatio ratio={16 / 9} className="bg-muted/40 overflow-hidden rounded-lg">
            <Image
              src={data.imageSrc}
              alt={data.title}
              fill
              className="h-full w-full rounded-lg object-cover transition-all dark:brightness-[0.6] dark:grayscale dark:hover:brightness-[1] dark:hover:grayscale-0"
            />
          </AspectRatio>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Badge className="w-fit">{data.badgeText}</Badge>
          <ol className="text-md ibm-plex-mono-regular list-inside list-decimal space-y-2 text-left leading-relaxed text-gray-300">
            {data.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReusableCard;
