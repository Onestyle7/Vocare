import React from 'react';

import {
  avatar_1,
  avatar_2,
  avatar_3,
  avatar_4,
  avatar_5,
  avatar_6,
} from '@/features/marketing/constants';

import SocialProofCard from './social-proof-card';

const SocialProof = () => {
  return (
    <div className="relative grid w-full grid-cols-1 items-start gap-5 overflow-hidden min-[1400px]:grid-cols-2">
      <div className="flex flex-col gap-5">
        <SocialProofCard
          compact
          description="“w nazwie stanowiska jest limit słów, czyli widać 3/4 tego, co wpisałam i trzy kropki. Udało mi się to skrócić, ale szkoda. Poza tym to chyba najlepiej wyglądający darmowy kreator CV, jakiego używałam, i na pewno jeszcze skorzystam”"
          avatarImg={avatar_4}
          name="Anonim"
          occupation="Opinia z Facebooka"
        />

        <div className="grid grid-cols-1 gap-5 min-[1400px]:grid-cols-2">
          <SocialProofCard
            description="„Korzystałam już z kilku kreatorów CV, ale ten chyba najbardziej mi odpowiada. Duży plus za wygląd i to, że można zrobić wszystko za darmo. Przydałoby się tylko trochę więcej miejsca na niektóre opisy”"
            avatarImg={avatar_3}
            name="Wiktoria"
            occupation="Opinia z Facebooka"
          />
          <SocialProofCard
            description="„jestem pozytywnie zaskoczona. Myślałam, że darmowy kreator będzie mocno ograniczony, a tutaj CV wygląda naprawdę dobrze. Kilka drobiazgów można jeszcze poprawić, ale ogólnie bardzo na plus.”"
            avatarImg={avatar_2}
            name="Ola"
            occupation="Opinia z Facebooka"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <SocialProofCard
          className="text-[20px] lg:text-[24px] [&_p:first-child]:text-inherit"
          description="“Super aplikacja, całkiem coś innego niż np. znane pracuj.pl.”"
          avatarImg={avatar_6}
          name="Bożysia"
          occupation="Opinia z Facebooka"
        />

        <div className="grid grid-cols-1 gap-5 min-[1400px]:grid-cols-2">
          <SocialProofCard
            description="“Strona ładna, przejrzysta.”"
            avatarImg={avatar_1}
            name="Viktoria"
            occupation="Opinia z Facebooka"
          />
          <SocialProofCard
            description="“Jeden z lepszych darmowych kreatorów, z jakich korzystałam. Ładnie, prosto i bez miliona reklam czy wyskakujących okienek. Oby tak dalej”"
            avatarImg={avatar_5}
            name="Bartek"
            occupation="Opinia z Facebooka"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-234 bg-linear-to-b from-transparent to-[#0F1013]" />
    </div>
  );
};

export default SocialProof;
