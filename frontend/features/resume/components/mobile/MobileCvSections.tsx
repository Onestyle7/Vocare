'use client';

import {
  AlignLeft,
  Award,
  Briefcase,
  Check,
  ChevronRight,
  FolderOpen,
  GraduationCap,
  Heart,
  IdCard,
  Languages as LanguagesIcon,
  Link2,
  Pencil,
  Plus,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useState } from 'react';

import { Switch } from '@/components/ui/switch';
import { educationDegreeLabels } from '@/lib/types/profile';
import { cn } from '@/lib/utils';
import { makeClientId } from '@/lib/utils/id';
import { FLUENCY_OPTIONS, getFluencyLabel } from '@/lib/utils/normalizeFluency';
import { SOCIAL_LINK_SUGGESTIONS } from '@/lib/utils/socialLinks';

import type {
  Certificate,
  Education,
  Experience,
  Hobby,
  Language,
  PersonalInfo,
  PrivacyStatement,
  Project,
  Skill,
  SocialLink,
} from '../resumeEditorTypes';
import {
  AreaField,
  EntryFooter,
  Field,
  fieldClass,
  MobileSheet,
  MonthField,
  PrimaryButton,
  SelectField,
  SwitchRow,
  TextField,
} from './MobileSheet';

export interface MobileCvData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  certificates: Certificate[];
  skills: Skill[];
  languages: Language[];
  hobbies: Hobby[];
  privacyStatement: PrivacyStatement;
}

export interface MobileCvSetters {
  setPersonalInfo: Dispatch<SetStateAction<PersonalInfo>>;
  setExperiences: Dispatch<SetStateAction<Experience[]>>;
  setEducation: Dispatch<SetStateAction<Education[]>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setCertificates: Dispatch<SetStateAction<Certificate[]>>;
  setSkills: Dispatch<SetStateAction<Skill[]>>;
  setLanguages: Dispatch<SetStateAction<Language[]>>;
  setHobbies: Dispatch<SetStateAction<Hobby[]>>;
  setPrivacyStatement: Dispatch<SetStateAction<PrivacyStatement>>;
}

type SheetState =
  | { kind: 'basics' }
  | { kind: 'summary' }
  | { kind: 'experience'; id?: string }
  | { kind: 'project'; id?: string }
  | { kind: 'education'; id?: string }
  | { kind: 'certificate'; id?: string }
  | { kind: 'language'; id?: string }
  | { kind: 'link'; id?: string }
  | { kind: 'skills' }
  | { kind: 'hobbies' }
  | { kind: 'privacy' };

// ── List helpers ─────────────────────────────────────────────────────────

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

const removeById = <T extends { id: string }>(list: T[], id: string) =>
  list.filter((x) => x.id !== id);

const moveById = <T extends { id: string }>(list: T[], id: string, offset: -1 | 1) => {
  const from = list.findIndex((x) => x.id === id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/** Reorder actions for an item, hidden at the ends of the list. */
const reorder = <T extends { id: string }>(
  list: T[],
  id: string | undefined,
  set: Dispatch<SetStateAction<T[]>>,
  close: () => void
) => {
  const index = id ? list.findIndex((x) => x.id === id) : -1;
  if (index < 0) return {};
  return {
    onMoveUp:
      index > 0
        ? () => {
            set((l) => moveById(l, id!, -1));
            close();
          }
        : undefined,
    onMoveDown:
      index < list.length - 1
        ? () => {
            set((l) => moveById(l, id!, 1));
            close();
          }
        : undefined,
    onDelete: () => {
      set((l) => removeById(l, id!));
      close();
    },
  };
};

// ── Dates ────────────────────────────────────────────────────────────────

const monthYear = (value: string) => {
  if (!value) return '';
  const [y, m] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });
};

const dateRange = (start: string, end: string, current: boolean) => {
  if (!start && !end && !current) return '';
  return `${start ? monthYear(start) : '?'} – ${current || !end ? 'obecnie' : monthYear(end)}`;
};

const thisMonth = () => new Date().toISOString().slice(0, 7);

const joinDot = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' · ');

// ── Cards ────────────────────────────────────────────────────────────────

function SectionCard({
  id,
  title,
  icon,
  filled,
  highlighted,
  onAdd,
  onEdit,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  filled: boolean;
  highlighted: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const action = onAdd ?? onEdit;
  return (
    <section
      data-cv-form-section={id}
      className={cn(
        'bg-card border-border scroll-mt-24 rounded-3xl border p-4 transition-[box-shadow,transform] duration-500',
        highlighted &&
          'scale-[1.01] shadow-[0_0_0_3px_rgba(145,94,255,0.35),0_12px_32px_rgba(145,94,255,0.18)]'
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        {/* The "filled" check sits on the icon so long titles keep their width. */}
        <span className="bg-muted relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#915EFF]">
          {icon}
          {filled && (
            <span
              role="img"
              aria-label="Uzupełnione"
              className="ring-card absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2"
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
            </span>
          )}
        </span>
        <h2 className="text-foreground min-w-0 flex-1 truncate text-base font-semibold">{title}</h2>
        {action && (
          <button
            type="button"
            onClick={action}
            aria-label={onAdd ? `Dodaj: ${title}` : `Edytuj: ${title}`}
            className="text-muted-foreground active:bg-muted -mr-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            {onAdd ? (
              <Plus className="h-5 w-5 text-[#915EFF]" />
            ) : (
              <Pencil className="h-4.5 w-4.5" />
            )}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground px-1 text-sm leading-relaxed">{children}</p>;
}

function EntryRows({
  items,
  empty,
  onOpen,
}: {
  items: { id: string; title: string; subtitle: string }[];
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item.id)}
          className="bg-muted/60 active:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
        >
          <span className="min-w-0 flex-1">
            <span className="text-foreground block truncate text-[15px] font-medium">
              {item.title}
            </span>
            {item.subtitle && (
              <span className="text-muted-foreground block truncate text-[13px]">
                {item.subtitle}
              </span>
            )}
          </span>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="bg-muted text-foreground rounded-full px-3 py-1 text-[13px]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Sections list ────────────────────────────────────────────────────────

export function MobileCvSections({
  data,
  setters,
  sectionOrder,
  highlightedSection,
  privacyTemplate,
}: {
  data: MobileCvData;
  setters: MobileCvSetters;
  sectionOrder: string[];
  highlightedSection: string | null;
  privacyTemplate: string;
}) {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [open, setOpen] = useState(false);
  // Every opening starts from the saved data, never from an abandoned draft.
  const [opening, setOpening] = useState(0);

  const show = (next: SheetState) => {
    setSheet(next);
    setOpening((n) => n + 1);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const onOpenChange = (next: boolean) => {
    if (!next) close();
  };

  const { personalInfo: info } = data;
  const contact = joinDot(info.email, info.phone, joinDot(info.address, info.country));

  const cards: Record<string, ReactNode> = {
    profile: (
      <SectionCard
        id="profile"
        title="Profil osobisty"
        icon={<AlignLeft className="h-5 w-5" />}
        filled={!!info.summary.trim()}
        highlighted={highlightedSection === 'profile'}
        onEdit={() => show({ kind: 'summary' })}
      >
        {info.summary.trim() ? (
          <p className="text-foreground/85 line-clamp-4 px-1 text-sm leading-relaxed whitespace-pre-line">
            {info.summary}
          </p>
        ) : (
          <Empty>2–4 zdania: kim jesteś zawodowo, w czym jesteś mocny i czego szukasz.</Empty>
        )}
      </SectionCard>
    ),
    experience: (
      <SectionCard
        id="experience"
        title="Doświadczenie zawodowe"
        icon={<Briefcase className="h-5 w-5" />}
        filled={data.experiences.length > 0}
        highlighted={highlightedSection === 'experience'}
        onAdd={() => show({ kind: 'experience' })}
      >
        <EntryRows
          empty="Dodaj stanowiska, staże i praktyki - najnowsze na górze."
          items={data.experiences.map((e) => ({
            id: e.id,
            title: e.position || 'Stanowisko',
            subtitle: joinDot(e.company, dateRange(e.startDate, e.endDate, e.isCurrent)),
          }))}
          onOpen={(id) => show({ kind: 'experience', id })}
        />
      </SectionCard>
    ),
    projects: (
      <SectionCard
        id="projects"
        title="Projekty"
        icon={<FolderOpen className="h-5 w-5" />}
        filled={data.projects.length > 0}
        highlighted={highlightedSection === 'projects'}
        onAdd={() => show({ kind: 'project' })}
      >
        <EntryRows
          empty="Projekty z GitHuba, studiów lub pracy - z linkiem, jeśli to możliwe."
          items={data.projects.map((p) => ({
            id: p.id,
            title: p.title || 'Projekt',
            subtitle: p.url,
          }))}
          onOpen={(id) => show({ kind: 'project', id })}
        />
      </SectionCard>
    ),
    education: (
      <SectionCard
        id="education"
        title="Edukacja"
        icon={<GraduationCap className="h-5 w-5" />}
        filled={data.education.length > 0}
        highlighted={highlightedSection === 'education'}
        onAdd={() => show({ kind: 'education' })}
      >
        <EntryRows
          empty="Dodaj uczelnię lub szkołę."
          items={data.education.map((e) => ({
            id: e.id,
            title: e.school || 'Uczelnia',
            subtitle: joinDot(
              e.field,
              e.degree && (educationDegreeLabels[e.degree] ?? e.degree),
              dateRange(e.startDate, e.endDate, e.isCurrent)
            ),
          }))}
          onOpen={(id) => show({ kind: 'education', id })}
        />
      </SectionCard>
    ),
    certificates: (
      <SectionCard
        id="certificates"
        title="Certyfikaty"
        icon={<Award className="h-5 w-5" />}
        filled={data.certificates.length > 0}
        highlighted={highlightedSection === 'certificates'}
        onAdd={() => show({ kind: 'certificate' })}
      >
        <EntryRows
          empty="Kursy i certyfikaty potwierdzające umiejętności."
          items={data.certificates.map((c) => ({
            id: c.id,
            title: c.name || 'Certyfikat',
            subtitle: c.hasDate && c.date ? monthYear(c.date) : '',
          }))}
          onOpen={(id) => show({ kind: 'certificate', id })}
        />
      </SectionCard>
    ),
    skills: (
      <SectionCard
        id="skills"
        title="Umiejętności"
        icon={<Zap className="h-5 w-5" />}
        filled={data.skills.length > 0}
        highlighted={highlightedSection === 'skills'}
        onEdit={() => show({ kind: 'skills' })}
      >
        <Chips
          items={data.skills.map((s) => s.name)}
          empty="Technologie, narzędzia i kompetencje."
        />
      </SectionCard>
    ),
    languages: (
      <SectionCard
        id="languages"
        title="Języki"
        icon={<LanguagesIcon className="h-5 w-5" />}
        filled={data.languages.length > 0}
        highlighted={highlightedSection === 'languages'}
        onAdd={() => show({ kind: 'language' })}
      >
        <EntryRows
          empty="Języki obce z poziomem znajomości."
          items={data.languages.map((l) => ({
            id: l.id,
            title: l.name || 'Język',
            subtitle: getFluencyLabel(l.level, 'pl'),
          }))}
          onOpen={(id) => show({ kind: 'language', id })}
        />
      </SectionCard>
    ),
    hobbies: (
      <SectionCard
        id="hobbies"
        title="Zainteresowania"
        icon={<Heart className="h-5 w-5" />}
        filled={data.hobbies.length > 0}
        highlighted={highlightedSection === 'hobbies'}
        onEdit={() => show({ kind: 'hobbies' })}
      >
        <Chips
          items={data.hobbies.map((h) => h.name)}
          empty="Kilka zainteresowań, które coś o Tobie mówią."
        />
      </SectionCard>
    ),
    privacy: (
      <SectionCard
        id="privacy"
        title="Klauzula RODO"
        icon={<ShieldCheck className="h-5 w-5" />}
        filled={!!data.privacyStatement.content.trim()}
        highlighted={highlightedSection === 'privacy'}
        onEdit={data.privacyStatement.content.trim() ? () => show({ kind: 'privacy' }) : undefined}
      >
        <div className="flex items-center gap-3 px-1">
          <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
            Zgoda na przetwarzanie danych w rekrutacji na końcu CV. Wielu pracodawców w Polsce jej
            oczekuje.
          </p>
          <Switch
            checked={!!data.privacyStatement.content.trim()}
            aria-label="Klauzula RODO"
            className="data-[state=checked]:bg-[#915EFF]"
            onCheckedChange={(on) =>
              setters.setPrivacyStatement((p) => ({ ...p, content: on ? privacyTemplate : '' }))
            }
          />
        </div>
      </SectionCard>
    ),
  };

  return (
    <div className="space-y-3">
      <SectionCard
        id="contact"
        title="Dane osobowe"
        icon={<IdCard className="h-5 w-5" />}
        filled={!!(info.firstName.trim() && info.lastName.trim() && info.email.trim())}
        highlighted={highlightedSection === 'contact'}
        onEdit={() => show({ kind: 'basics' })}
      >
        {info.firstName || info.lastName || contact ? (
          <div className="px-1">
            <p className="text-foreground text-[17px] font-semibold">
              {joinDot(`${info.firstName} ${info.lastName}`.trim()) || 'Imię i nazwisko'}
            </p>
            {info.profession && <p className="text-sm text-[#915EFF]">{info.profession}</p>}
            {contact && <p className="text-muted-foreground mt-1 text-[13px]">{contact}</p>}
          </div>
        ) : (
          <Empty>Imię, nazwisko, stanowisko i dane kontaktowe - pojawią się w nagłówku CV.</Empty>
        )}
      </SectionCard>

      <SectionCard
        id="links"
        title="Linki i portfolio"
        icon={<Link2 className="h-5 w-5" />}
        filled={info.socialLinks.length > 0}
        highlighted={highlightedSection === 'links'}
        onAdd={() => show({ kind: 'link' })}
      >
        <EntryRows
          empty="LinkedIn, GitHub, portfolio - pojawią się w nagłówku CV."
          items={info.socialLinks.map((l) => ({
            id: l.id,
            title: l.label || 'Link',
            subtitle: l.url,
          }))}
          onOpen={(id) => show({ kind: 'link', id })}
        />
      </SectionCard>

      {sectionOrder.map((id) => (cards[id] ? <div key={id}>{cards[id]}</div> : null))}

      {sheet && (
        <ActiveSheet
          key={opening}
          sheet={sheet}
          open={open}
          onOpenChange={onOpenChange}
          close={close}
          data={data}
          setters={setters}
          privacyTemplate={privacyTemplate}
        />
      )}
    </div>
  );
}

// ── Sheets ───────────────────────────────────────────────────────────────

interface SheetProps {
  sheet: SheetState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  close: () => void;
  data: MobileCvData;
  setters: MobileCvSetters;
  privacyTemplate: string;
}

function ActiveSheet(props: SheetProps) {
  switch (props.sheet.kind) {
    case 'basics':
      return <BasicsSheet {...props} />;
    case 'summary':
      return <SummarySheet {...props} />;
    case 'experience':
      return <ExperienceSheet {...props} id={props.sheet.id} />;
    case 'project':
      return <ProjectSheet {...props} id={props.sheet.id} />;
    case 'education':
      return <EducationSheet {...props} id={props.sheet.id} />;
    case 'certificate':
      return <CertificateSheet {...props} id={props.sheet.id} />;
    case 'language':
      return <LanguageSheet {...props} id={props.sheet.id} />;
    case 'link':
      return <LinkSheet {...props} id={props.sheet.id} />;
    case 'skills':
      return <TagsSheet {...props} target="skills" />;
    case 'hobbies':
      return <TagsSheet {...props} target="hobbies" />;
    case 'privacy':
      return <PrivacySheet {...props} />;
  }
}

function BasicsSheet({ open, onOpenChange, close, data, setters }: SheetProps) {
  const [draft, setDraft] = useState(data.personalInfo);
  const set = (key: keyof PersonalInfo) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Dane osobowe"
      footer={
        <EntryFooter
          onSave={() => {
            setters.setPersonalInfo((p) => ({
              ...p,
              firstName: draft.firstName,
              lastName: draft.lastName,
              profession: draft.profession,
              email: draft.email,
              phone: draft.phone,
              address: draft.address,
              country: draft.country,
            }));
            close();
          }}
        />
      }
    >
      <Field label="Imię">
        <TextField value={draft.firstName} onChange={set('firstName')} autoComplete="given-name" />
      </Field>
      <Field label="Nazwisko">
        <TextField value={draft.lastName} onChange={set('lastName')} autoComplete="family-name" />
      </Field>
      <Field label="Stanowisko docelowe" hint="Pod imieniem i nazwiskiem w CV.">
        <TextField
          value={draft.profession}
          onChange={set('profession')}
          placeholder="np. Junior Data Analyst"
        />
      </Field>
      <Field label="E-mail">
        <TextField
          value={draft.email}
          onChange={set('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
        />
      </Field>
      <Field label="Telefon">
        <TextField
          value={draft.phone}
          onChange={set('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>
      <Field label="Miasto / adres">
        <TextField value={draft.address} onChange={set('address')} autoComplete="address-level2" />
      </Field>
      <Field label="Kraj">
        <TextField value={draft.country} onChange={set('country')} autoComplete="country-name" />
      </Field>
    </MobileSheet>
  );
}

function SummarySheet({ open, onOpenChange, close, data, setters }: SheetProps) {
  const [draft, setDraft] = useState(data.personalInfo.summary);
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Profil osobisty"
      footer={
        <EntryFooter
          onSave={() => {
            setters.setPersonalInfo((p) => ({ ...p, summary: draft }));
            close();
          }}
        />
      }
    >
      <Field label="O mnie" hint="Pogrubienie: **tekst**, kursywa: _tekst_.">
        <AreaField
          value={draft}
          onChange={setDraft}
          rows={8}
          placeholder="Kim jesteś zawodowo, w czym jesteś mocny i czego szukasz."
        />
      </Field>
    </MobileSheet>
  );
}

function ExperienceSheet({
  id,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { id?: string }) {
  const existing = data.experiences.find((e) => e.id === id);
  const [draft, setDraft] = useState<Experience>(
    existing ?? {
      id: makeClientId(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      responsibilities: [],
      isCurrent: false,
      useBulletList: true,
    }
  );
  const [duties, setDuties] = useState(draft.responsibilities.join('\n'));
  const valid = !!(draft.position.trim() && draft.company.trim());

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Doświadczenie' : 'Nowe doświadczenie'}
      footer={
        <EntryFooter
          canSave={valid}
          onSave={() => {
            const responsibilities = duties
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean);
            setters.setExperiences((list) => upsert(list, { ...draft, responsibilities }));
            close();
          }}
          {...reorder(data.experiences, existing?.id, setters.setExperiences, close)}
        />
      }
    >
      <Field label="Stanowisko" required>
        <TextField
          value={draft.position}
          onChange={(position) => setDraft((d) => ({ ...d, position }))}
        />
      </Field>
      <Field label="Firma" required>
        <TextField
          value={draft.company}
          onChange={(company) => setDraft((d) => ({ ...d, company }))}
        />
      </Field>
      <DateFields draft={draft} setDraft={setDraft} />
      <Field label="Obowiązki i osiągnięcia" hint="Jeden punkt w linii. Pogrubienie: **tekst**.">
        <AreaField value={duties} onChange={setDuties} rows={6} />
      </Field>
      <SwitchRow
        label="Lista punktowana"
        checked={draft.useBulletList}
        onCheckedChange={(useBulletList) => setDraft((d) => ({ ...d, useBulletList }))}
      />
    </MobileSheet>
  );
}

/** "Od" / "Do" with a visible "Obecnie" switch, shared by experience and education. */
function DateFields<T extends { startDate: string; endDate: string; isCurrent: boolean }>({
  draft,
  setDraft,
  allowFutureDates,
}: {
  draft: T;
  setDraft: Dispatch<SetStateAction<T>>;
  allowFutureDates?: boolean;
}) {
  return (
    <>
      <Field label="Od">
        <MonthField
          value={draft.startDate}
          onChange={(startDate) => setDraft((d) => ({ ...d, startDate }))}
          max={allowFutureDates ? undefined : thisMonth()}
        />
      </Field>
      {!draft.isCurrent && (
        <Field label="Do">
          <MonthField
            value={draft.endDate}
            onChange={(endDate) => setDraft((d) => ({ ...d, endDate }))}
            max={allowFutureDates ? undefined : thisMonth()}
          />
        </Field>
      )}
      <SwitchRow
        label="Obecnie"
        checked={draft.isCurrent}
        onCheckedChange={(isCurrent) =>
          setDraft((d) => ({ ...d, isCurrent, endDate: isCurrent ? '' : d.endDate }))
        }
      />
    </>
  );
}

function ProjectSheet({
  id,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { id?: string }) {
  const existing = data.projects.find((p) => p.id === id);
  const [draft, setDraft] = useState<Project>(
    existing ?? { id: makeClientId(), title: '', url: '', description: '' }
  );
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Projekt' : 'Nowy projekt'}
      footer={
        <EntryFooter
          canSave={!!draft.title.trim()}
          onSave={() => {
            setters.setProjects((list) => upsert(list, draft));
            close();
          }}
          {...reorder(data.projects, existing?.id, setters.setProjects, close)}
        />
      }
    >
      <Field label="Nazwa projektu" required>
        <TextField value={draft.title} onChange={(title) => setDraft((d) => ({ ...d, title }))} />
      </Field>
      <Field label="Link">
        <TextField
          value={draft.url}
          onChange={(url) => setDraft((d) => ({ ...d, url }))}
          type="url"
          inputMode="url"
          placeholder="https://github.com/…"
        />
      </Field>
      <Field label="Opis" hint="Co zrobiłeś i jakim efektem.">
        <AreaField
          value={draft.description}
          onChange={(description) => setDraft((d) => ({ ...d, description }))}
        />
      </Field>
    </MobileSheet>
  );
}

const DEGREE_OPTIONS = Object.entries(educationDegreeLabels).map(([value, label]) => ({
  value,
  label,
}));

function EducationSheet({
  id,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { id?: string }) {
  const existing = data.education.find((e) => e.id === id);
  const [draft, setDraft] = useState<Education>(
    existing ?? {
      id: makeClientId(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    }
  );
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Edukacja' : 'Nowa szkoła lub uczelnia'}
      footer={
        <EntryFooter
          canSave={!!draft.school.trim()}
          onSave={() => {
            setters.setEducation((list) => upsert(list, draft));
            close();
          }}
          {...reorder(data.education, existing?.id, setters.setEducation, close)}
        />
      }
    >
      <Field label="Uczelnia / szkoła" required>
        <TextField
          value={draft.school}
          onChange={(school) => setDraft((d) => ({ ...d, school }))}
        />
      </Field>
      <Field label="Kierunek">
        <TextField value={draft.field} onChange={(field) => setDraft((d) => ({ ...d, field }))} />
      </Field>
      <Field label="Stopień">
        <SelectField
          value={draft.degree}
          onChange={(degree) => setDraft((d) => ({ ...d, degree }))}
          options={DEGREE_OPTIONS}
          placeholder="Wybierz stopień"
        />
      </Field>
      <DateFields draft={draft} setDraft={setDraft} allowFutureDates />
      <Field label="Opis">
        <AreaField
          value={draft.description}
          onChange={(description) => setDraft((d) => ({ ...d, description }))}
          rows={4}
        />
      </Field>
    </MobileSheet>
  );
}

function CertificateSheet({
  id,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { id?: string }) {
  const existing = data.certificates.find((c) => c.id === id);
  const [draft, setDraft] = useState<Certificate>(
    existing ?? { id: makeClientId(), name: '', date: '', hasDate: false }
  );
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Certyfikat' : 'Nowy certyfikat'}
      footer={
        <EntryFooter
          canSave={!!draft.name.trim()}
          onSave={() => {
            setters.setCertificates((list) =>
              upsert(list, { ...draft, hasDate: draft.hasDate && !!draft.date })
            );
            close();
          }}
          {...reorder(data.certificates, existing?.id, setters.setCertificates, close)}
        />
      }
    >
      <Field label="Nazwa certyfikatu" required>
        <TextField value={draft.name} onChange={(name) => setDraft((d) => ({ ...d, name }))} />
      </Field>
      <SwitchRow
        label="Data uzyskania"
        checked={draft.hasDate}
        onCheckedChange={(hasDate) =>
          setDraft((d) => ({ ...d, hasDate, date: hasDate ? d.date : '' }))
        }
      />
      {draft.hasDate && (
        <Field label="Data">
          <MonthField
            value={draft.date}
            onChange={(date) => setDraft((d) => ({ ...d, date }))}
            max={thisMonth()}
          />
        </Field>
      )}
    </MobileSheet>
  );
}

const FLUENCY_SELECT = FLUENCY_OPTIONS.map((value) => ({
  value,
  label: getFluencyLabel(value, 'pl'),
}));

function LanguageSheet({
  id,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { id?: string }) {
  const existing = data.languages.find((l) => l.id === id);
  const [draft, setDraft] = useState<Language>(
    existing ?? { id: makeClientId(), name: '', level: '' }
  );
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Język' : 'Nowy język'}
      footer={
        <EntryFooter
          canSave={!!draft.name.trim()}
          onSave={() => {
            setters.setLanguages((list) => upsert(list, draft));
            close();
          }}
          {...reorder(data.languages, existing?.id, setters.setLanguages, close)}
        />
      }
    >
      <Field label="Język" required>
        <TextField
          value={draft.name}
          onChange={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="np. Angielski"
        />
      </Field>
      <Field label="Poziom">
        <SelectField
          value={draft.level}
          onChange={(level) => setDraft((d) => ({ ...d, level }))}
          options={FLUENCY_SELECT}
          placeholder="Wybierz poziom"
        />
      </Field>
    </MobileSheet>
  );
}

function LinkSheet({ id, open, onOpenChange, close, data, setters }: SheetProps & { id?: string }) {
  const links = data.personalInfo.socialLinks;
  const existing = links.find((l) => l.id === id);
  const [draft, setDraft] = useState<SocialLink>(
    existing ?? { id: makeClientId(), label: '', url: '' }
  );
  const setLinks: Dispatch<SetStateAction<SocialLink[]>> = (update) =>
    setters.setPersonalInfo((p) => ({
      ...p,
      socialLinks: typeof update === 'function' ? update(p.socialLinks) : update,
    }));
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? 'Link' : 'Nowy link'}
      footer={
        <EntryFooter
          canSave={!!draft.url.trim()}
          onSave={() => {
            setLinks((list) => upsert(list, { ...draft, label: draft.label.trim() || 'Link' }));
            close();
          }}
          {...reorder(links, existing?.id, setLinks, close)}
        />
      }
    >
      <Field label="Nazwa">
        <TextField
          value={draft.label}
          onChange={(label) => setDraft((d) => ({ ...d, label }))}
          placeholder="np. LinkedIn"
        />
      </Field>
      <div className="-mt-2 mb-4 flex flex-wrap gap-2 px-1">
        {SOCIAL_LINK_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, label: suggestion }))}
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 text-[13px] transition',
              draft.label === suggestion
                ? 'border-[#915EFF] bg-[#915EFF]/10 text-[#915EFF]'
                : 'border-border text-muted-foreground'
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <Field label="Adres" required>
        <TextField
          value={draft.url}
          onChange={(url) => setDraft((d) => ({ ...d, url }))}
          type="url"
          inputMode="url"
          placeholder="https://"
        />
      </Field>
    </MobileSheet>
  );
}

function TagsSheet({
  target,
  open,
  onOpenChange,
  close,
  data,
  setters,
}: SheetProps & { target: 'skills' | 'hobbies' }) {
  const isSkills = target === 'skills';
  const [tags, setTags] = useState<{ id: string; name: string }[]>(
    isSkills ? data.skills : data.hobbies
  );
  const [input, setInput] = useState('');

  const add = () => {
    const names = input
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .filter((n) => !tags.some((t) => t.name.toLowerCase() === n.toLowerCase()));
    if (names.length)
      setTags((t) => [...t, ...names.map((name) => ({ id: makeClientId(), name }))]);
    setInput('');
  };

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isSkills ? 'Umiejętności' : 'Zainteresowania'}
      description="Możesz wpisać kilka naraz, oddzielając je przecinkami."
      footer={
        <EntryFooter
          onSave={() => {
            const pending = input.trim()
              ? input
                  .split(',')
                  .map((n) => n.trim())
                  .filter(Boolean)
                  .map((name) => ({ id: makeClientId(), name }))
              : [];
            const next = [...tags, ...pending];
            if (isSkills) setters.setSkills(next);
            else setters.setHobbies(next);
            close();
          }}
        />
      }
    >
      <div className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          enterKeyHint="done"
          placeholder={isSkills ? 'np. SQL, Python' : 'np. Bieganie'}
          className={cn(fieldClass, 'h-12 flex-1')}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Dodaj"
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#915EFF] text-white active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {tags.length === 0 ? (
        <Empty>Jeszcze nic nie dodano.</Empty>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="bg-muted text-foreground flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => setTags((t) => t.filter((x) => x.id !== tag.id))}
                aria-label={`Usuń ${tag.name}`}
                className="text-muted-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-full active:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </MobileSheet>
  );
}

function PrivacySheet({ open, onOpenChange, close, data, setters, privacyTemplate }: SheetProps) {
  const [draft, setDraft] = useState(data.privacyStatement.content);
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Klauzula RODO"
      footer={
        <EntryFooter
          onSave={() => {
            setters.setPrivacyStatement((p) => ({ ...p, content: draft }));
            close();
          }}
        />
      }
    >
      <Field label="Treść klauzuli">
        <AreaField value={draft} onChange={setDraft} rows={9} />
      </Field>
      {draft.trim() !== privacyTemplate && (
        <PrimaryButton onClick={() => setDraft(privacyTemplate)}>Użyj gotowej zgody</PrimaryButton>
      )}
    </MobileSheet>
  );
}
