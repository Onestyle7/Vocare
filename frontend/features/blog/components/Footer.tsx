import Link from 'next/link';

import {
  contact_pages,
  down_links,
  links_pages,
  links_social,
} from '@/features/marketing/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="mx-2 grid grid-cols-1 gap-10 pb-10 md:mx-0 md:grid-cols-2 md:gap-2 md:pb-40">
      <section className="border-t-2 text-center md:col-span-2">
        <Button
          asChild
          className="mt-10 self-center rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] px-20 py-6 font-bold text-white focus:ring-2 focus:ring-[#915EFF]/50 focus:outline-none md:my-10"
        >
          <Link href="/profile">Sprawdź Vocare</Link>
        </Button>
      </section>
      <section className="font-poppins md:max-w-[20rem]">
        <h2 className="text-4xl">Nie przegap tego.</h2>
        <Input
          disabled
          className="mt-8 max-w-[20rem]"
          placeholder="Email (newsletter wkrótce)"
        ></Input>
        <p className="text-muted-foreground mt-4 text-xs">
          Podając swój adres e-mail, jako pierwszy dowiesz się o nadchodzących aktualizacjach
          Vocare. Możesz w każdej chwili zrezygnować z subskrypcji.
        </p>
      </section>
      <section>
        <div className="font-korbin flex flex-row justify-around gap-8">
          <FooterLinkGroup title="Sociale" links={links_social} />
          <FooterLinkGroup title="Linki" links={links_pages} />
          <FooterLinkGroup title="Kontakt" links={contact_pages} />
        </div>
      </section>
      <section className="flex flex-col items-center justify-around gap-2 md:col-span-2 md:mt-10 md:flex-row">
        <FooterLegalLinks className="" links={down_links} />
        <p className="font-poppins text-center text-4xl">Twoja droga zaczyna się tutaj</p>
      </section>
    </footer>
  );
}

type FooterLink = {
  name: string;
  url: string;
};

function FooterLegalLinks({ links, className }: { links: FooterLink[]; className?: string }) {
  return (
    <div
      className={cn(
        'font-korbin text-muted-foreground space-x-2 text-center text-sm uppercase',
        className
      )}
    >
      {links.map(({ name, url }) => (
        <Link href={url} key={`${name}-${url}`}>
          {name}
        </Link>
      ))}
    </div>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-muted-foreground uppercase">{title}</h3>
      <ul className="lin flex flex-col gap-2 text-sm leading-2">
        {links.map((link) => (
          <li key={link.url}>
            <Link href={link.url}>{link.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
