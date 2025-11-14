import Image from "next/image";

type TileDirection = 'left' | 'right' | 'up' | 'down';

interface TileProps {
  title: string;
  description: string;
  imageUrl: string;
  className?: string;
  tileDirection?: TileDirection;
  onClick?: () => void;
}

const Tile = ({
    title,
    description,
    imageUrl,
    className,
    onClick,
}: TileProps) => {
  return (
    <div className={`w-[175px] h-[175px] border rounded-[36px] flex flex-col items-center justify-center p-4 ${className}`} onClick={onClick}>
        <Image src={imageUrl} alt={title} width={56} height={56} className="mb-4" draggable={false}/>
        <div className="w-full flex flex-col items-center justify-center">
            <h3 className="text-sm text-center text-black">{title}</h3>
            <p className="text-xs text-center text-gray-400">{description}</p>
        </div>
    </div>
  )
}

export default Tile