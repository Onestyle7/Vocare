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
    <div className="relative grid w-full grid-cols-1 items-start gap-5 overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <SocialProofCard
          compact
          description="“Totalnie zaskoczyło mnie to, jak bardzo można tu sobie skroić naukę pod siebie. Nie musisz lecieć sztywnym planem - system dopasowuje trudność i tempo pod Twój realny skill. Pierwszy raz widzę, żeby platforma tak serio podchodziła do indywidualnego tempa użytkownika.”"
          avatarImg={avatar_1}
          name="Natalia"
          occupation="Studentka"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SocialProofCard
            description="„Zrobiłem analizę SWOT na Vocare i pierwszy raz mam czarno na białym, gdzie mam luki w CV, a co jest moim asem w rękawie. Cała roadmapa kariery wygenerowana pod moje cele to totalny gamechanger. To nie jest portal do nauki, to jest narzędzie do robienia awansu. Bardzo polecam każdemu, kto chce wejść na wyższy level.”"
            avatarImg={avatar_3}
            name="Franek"
            occupation="IT Support"
          />
          <SocialProofCard
            description="„Zawsze miałem problem z tym, co robić 'dalej'. Vocare ogarnęło mi spersonalizowaną ścieżkę kariery, która nie jest generycznym PDF-em, tylko żywym planem. Analiza moich mocnych i słabych stron (SWOT) była tak trafna, że aż trochę creepy. Ale dzięki temu w końcu wiem, na czym się skupić, żeby podbić stawkę.”"
            avatarImg={avatar_2}
            name="Aleksandra"
            occupation="Fizjoterapetka"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <SocialProofCard
          className="text-[20px] lg:text-[24px] [&_p:first-child]:text-inherit"
          description="“Najlepszy feature? Integracja z No Fluff Jobs i ten algorytm dopasowania. Nie muszę filtrować setek ogłoszeń, bo Vocare samo wyrzuca mi oferty, które realnie pasują do mojej aktualnej roadmapy. Widzisz konkretny krok, robisz go i od razu masz podpięte pod to realne opcje pracy. Geniusz.”"
          avatarImg={avatar_4}
          name="Kajtek"
          occupation="Pracownik IT"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SocialProofCard
            description="“Zaskoczyło mnie, jak płynnie to wszystko działa. Od analizy moich kompetencji, przez wyznaczenie konkretnej ścieżki, aż po dopasowane oferty pracy. Nie muszę wychodzić z platformy, żeby zaplanować kolejny rok swojego życia zawodowego.”"
            avatarImg={avatar_6}
            name="Marta"
            occupation="UX Designer"
          />
          <SocialProofCard
            description="„Miałem totalny paraliż decyzyjny, jeśli chodzi o rozwój. Vocare wjechało z analizą SWOT i nagle wszystko stało się jasne. To nie jest wróżenie z fusów, tylko twarde dane o moich skillach zestawione z tym, czego realnie szukają na rynku.”"
            avatarImg={avatar_5}
            name="Bartek"
            occupation="Junior Dev"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-234 bg-linear-to-b from-transparent to-[#0F1013]" />
    </div>
  );
};

export default SocialProof;
