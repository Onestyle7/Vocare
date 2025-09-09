import ScrollMask from '@/components/MaskedScrollImage';

export default function Home() {
  return (
    <main className="h-full w-full">
      <ScrollMask imageUrl="/images/robot.jpg" alt="Opis zdjęcia" />
    </main>
  );
}
