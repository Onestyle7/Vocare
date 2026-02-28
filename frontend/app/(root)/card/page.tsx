import { ExternalLink } from 'lucide-react';

const page = () => {
  return (
    <div className="font-grotesk relative mx-auto flex h-[360px] w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(145deg,rgba(10,13,22,0.95)_0%,rgba(10,13,22,0.6)_55%,rgba(14,20,34,0.35)_100%)] p-1 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:h-[400px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent"
      />
      <div className="relative z-10 h-[70%] w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/5 backdrop-blur-xl sm:h-[78%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(145,94,255,0.35)_0%,rgba(145,94,255,0.18)_40%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent"
        />
      </div>
      <div className="absolute bottom-6 left-4 z-10 flex items-center justify-center sm:bottom-8 sm:left-6">
        <p className="text-xs text-gray-200/90 sm:text-sm">Data dodania: 01.08.2025</p>
      </div>
      <div className="absolute right-4 bottom-4 z-10 flex items-center justify-center sm:right-6 sm:bottom-[20px]">
        <p className="flex cursor-pointer items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white shadow-sm backdrop-blur-md transition hover:border-white/50 hover:bg-white/20 sm:px-6 sm:py-3 sm:text-base">
          Zobacz ofertę{' '}
          <span>
            <ExternalLink className="ml-1 scale-75" />
          </span>
        </p>
      </div>
    </div>
  );
};

export default page;
