import Footer from './_components/Footer';
import Header from './_components/Header';

export default function BlogLayoutPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative mx-auto min-h-screen max-w-[1200px] px-5 before:fixed before:inset-0 before:z-[-1] before:bg-[radial-gradient(circle_at_50%_20%,rgba(167,139,250,0.1)_0%,rgba(15,16,19,0)_70%)]">
      <Header />
      {children}
      <Footer />
    </main>
  );
}
