import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { MobileCvSections } from '../components/mobile/MobileCvSections';
import type { Experience, PersonalInfo, PrivacyStatement } from '../components/resumeEditorTypes';

const makeExperience = (id: string, position: string, company: string): Experience => ({
  id,
  company,
  position,
  startDate: '2024-01',
  endDate: '',
  responsibilities: [],
  isCurrent: true,
  useBulletList: false,
});

const personalInfo: PersonalInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  country: '',
  socialLinks: [],
  profession: '',
  summary: '',
};

function Harness() {
  const [experiences, setExperiences] = useState([
    makeExperience('experience-first', 'Junior Specialist', 'ERLI.pl'),
    makeExperience('experience-second', 'Specialist', 'Bully Agency'),
  ]);
  const [privacyStatement, setPrivacyStatement] = useState<PrivacyStatement>({
    id: 'privacy',
    content: '',
  });
  const noop = () => {};

  return (
    <MobileCvSections
      data={{
        personalInfo,
        experiences,
        education: [],
        projects: [],
        certificates: [],
        skills: [],
        languages: [],
        hobbies: [],
        privacyStatement,
      }}
      setters={{
        setPersonalInfo: noop,
        setExperiences,
        setEducation: noop,
        setProjects: noop,
        setCertificates: noop,
        setSkills: noop,
        setLanguages: noop,
        setHobbies: noop,
        setPrivacyStatement,
      }}
      sectionOrder={['experience']}
      highlightedSection={null}
      privacyTemplate=""
    />
  );
}

const experienceTitles = () =>
  Array.from(
    document.querySelectorAll('[data-cv-form-section="experience"] button .truncate.font-medium')
  ).map((title) => title.textContent);

const openExperience = (position: string) =>
  fireEvent.click(screen.getByText(position).closest('button')!);

afterEach(() => {
  cleanup();
});

describe('MobileCvSections entry reordering', () => {
  it('saves the sheet edits when an entry is moved with the arrows', () => {
    render(<Harness />);

    openExperience('Junior Specialist');
    fireEvent.change(screen.getByDisplayValue('Junior Specialist'), {
      target: { value: 'Senior Specialist' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Przesuń niżej' }));

    expect(experienceTitles()).toEqual(['Specialist', 'Senior Specialist']);
  });

  it('disables the arrows while a required field is empty', () => {
    render(<Harness />);

    openExperience('Junior Specialist');
    fireEvent.change(screen.getByDisplayValue('Junior Specialist'), { target: { value: '' } });

    expect(
      (screen.getByRole('button', { name: 'Przesuń niżej' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
