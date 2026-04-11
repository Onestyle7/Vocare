'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateProfileFormType, UpdateProfileFormType } from '@/lib/schemas/profileSchema';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TagInput } from '@/components/ProfileFormComponents/TagInput';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const getRangeEndLabel = (endDate?: string, current?: boolean) => {
  if (current || !endDate) {
    return 'Obecnie';
  }

  return endDate;
};

// Typy dla poszczególnych popoverów

type Language = {
  language: string;
  level?: string;
};

interface LanguagePopoverProps {
  value: Language[];
  onChange: (value: Language[]) => void;
}

type WorkExperience = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
};

interface WorkExperiencePopoverProps {
  value: WorkExperience[];
  onChange: (value: WorkExperience[]) => void;
}

type Education = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current?: boolean;
};

interface EducationPopoverProps {
  value: Education[];
  onChange: (value: Education[]) => void;
}

type Certificate = {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  noExpiry: boolean;
};

interface CertificatePopoverProps {
  value: Certificate[];
  onChange: (value: Certificate[]) => void;
}

interface StepThreeProps {
  form: UseFormReturn<CreateProfileFormType | UpdateProfileFormType>;
  onNext: () => void;
  onBack: () => void;
}

// Komponent LanguagePopover
const LanguagePopover = ({ value = [], onChange }: LanguagePopoverProps) => {
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');

  const handleAddLanguage = () => {
    if (language && level) {
      onChange([...value, { language, level }]);
      setLanguage('');
      setLevel('');
    }
  };

  const handleRemove = (index: number) => {
    const newLanguages = [...value];
    newLanguages.splice(index, 1);
    onChange(newLanguages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge
            key={index}
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
            onClick={() => handleRemove(index)}
          >
            {item.language} ({item.level})<span className="ml-1 cursor-pointer">×</span>
          </Badge>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} /> Dodaj język
          </Button>
        </PopoverTrigger>
        <PopoverContent className="font-poppins w-84 translate-x-[8.5%] p-4 xl:w-96">
          <div className="space-y-4">
            <h4 className="font-medium">Dodaj język</h4>

            <div className="space-y-2">
              <FormLabel>Język</FormLabel>
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="np. Angielski"
                className="input-profile"
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Poziom</FormLabel>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Native">Ojczysty</SelectItem>
                  <SelectItem value="Fluent">Biegły</SelectItem>
                  <SelectItem value="Advanced">Zaawansowany</SelectItem>
                  <SelectItem value="Intermediate">Średniozaawansowany</SelectItem>
                  <SelectItem value="Basic">Podstawowy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddLanguage} className="profile-button">
              Dodaj
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Komponent WorkExperiencePopover
const WorkExperiencePopover = ({ value = [], onChange }: WorkExperiencePopoverProps) => {
  const [workExp, setWorkExp] = useState<WorkExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    current: false,
  });

  const handleAddWorkExperience = () => {
    if (workExp.company && workExp.position && workExp.startDate) {
      onChange([...value, workExp]);
      setWorkExp({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        current: false,
      });
    }
  };

  const handleRemove = (index: number) => {
    const newWorkExp = [...value];
    newWorkExp.splice(index, 1);
    onChange(newWorkExp);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border">
        {value.map((item, index) => (
          <Card key={index} className="p-2">
            <CardContent className="p-2">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{item.position}</h4>
                  <p className="text-sm text-gray-500">{item.company}</p>
                  <p className="text-xs">
                    {item.startDate} - {getRangeEndLabel(item.endDate, item.current)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} /> Dodaj doświadczenie zawodowe
          </Button>
        </PopoverTrigger>
        <PopoverContent className="font-poppins w-84 translate-x-[8.5%] p-4 xl:w-96">
          <div className="space-y-4">
            <h4 className="font-medium">Dodaj doświadczenie zawodowe</h4>

            <div className="space-y-2">
              <FormLabel>Firma</FormLabel>
              <Input
                value={workExp.company}
                onChange={(e) => setWorkExp({ ...workExp, company: e.target.value })}
                placeholder="Nazwa firmy"
                className="input-profile"
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Stanowisko</FormLabel>
              <Input
                value={workExp.position}
                onChange={(e) => setWorkExp({ ...workExp, position: e.target.value })}
                placeholder="Nazwa stanowiska"
                className="input-profile"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <FormLabel>Data rozpoczęcia</FormLabel>
                <Input
                  type="date"
                  value={workExp.startDate}
                  onChange={(e) => setWorkExp({ ...workExp, startDate: e.target.value })}
                  className="input-profile w-32.5!"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Data zakończenia</FormLabel>
                <Input
                  type="date"
                  value={workExp.endDate}
                  onChange={(e) => setWorkExp({ ...workExp, endDate: e.target.value })}
                  disabled={workExp.current}
                  className="input-profile w-32.5!"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="currentJob"
                checked={workExp.current}
                onChange={(e) => setWorkExp({ ...workExp, current: e.target.checked })}
              />
              <label htmlFor="currentJob">Obecnie tu pracuję</label>
            </div>

            <div className="space-y-2">
              <FormLabel>Opis</FormLabel>
              <textarea
                className="min-h-[100px] w-full rounded-md border p-2"
                value={workExp.description}
                onChange={(e) => setWorkExp({ ...workExp, description: e.target.value })}
                placeholder="Opisz swoje stanowisko i obowiązki"
              />
            </div>

            <Button onClick={handleAddWorkExperience} className="profile-button">
              Dodaj
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Komponent EducationPopover
const EducationPopover = ({ value = [], onChange }: EducationPopoverProps) => {
  const [education, setEducation] = useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
  });

  const handleAddEducation = () => {
    if (education.institution && education.degree && education.field) {
      onChange([...value, education]);
      setEducation({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        current: false,
      });
    }
  };

  const handleRemove = (index: number) => {
    const newEducation = [...value];
    newEducation.splice(index, 1);
    onChange(newEducation);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border">
        {value.map((item, index) => (
          <Card key={index} className="p-2">
            <CardContent className="p-2">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">
                    {item.degree} in {item.field}
                  </h4>
                  <p className="text-sm text-gray-500">{item.institution}</p>
                  <p className="text-xs">
                    {item.startDate} - {getRangeEndLabel(item.endDate, item.current)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} /> Dodaj edukację
          </Button>
        </PopoverTrigger>
        <PopoverContent className="font-poppins w-84 translate-x-[8.5%] p-4 xl:w-96">
          <div className="space-y-4">
            <h4 className="font-medium">Dodaj edukację</h4>

            <div className="space-y-2">
              <FormLabel>Instytut</FormLabel>
              <Input
                value={education.institution}
                onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                placeholder="Nazwa szkoły lub uczelni"
                className="input-profile"
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Wykształcenie</FormLabel>
              <Select
                value={education.degree}
                onValueChange={(value) => setEducation({ ...education, degree: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wykształcenie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachelor">Inżynier/Licencjat</SelectItem>
                  <SelectItem value="Master">Magister</SelectItem>
                  <SelectItem value="PhD">Doktor</SelectItem>
                  <SelectItem value="Associate">Podyplomowe</SelectItem>
                  <SelectItem value="High School">Średnie</SelectItem>
                  <SelectItem value="Other">Podstawowe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Kierunek</FormLabel>
              <Input
                value={education.field}
                onChange={(e) => setEducation({ ...education, field: e.target.value })}
                placeholder="np. Informatyka Stosowana"
                className="input-profile"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <FormLabel>Data rozpoczęcia</FormLabel>
                <Input
                  type="date"
                  value={education.startDate}
                  onChange={(e) => setEducation({ ...education, startDate: e.target.value })}
                  className="input-profile w-32.5!"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Data zakończenia</FormLabel>
                <Input
                  type="date"
                  value={education.endDate}
                  onChange={(e) => setEducation({ ...education, endDate: e.target.value })}
                  disabled={education.current}
                  className="input-profile w-32.5!"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="currentEducation"
                checked={education.current}
                onChange={(e) => setEducation({ ...education, current: e.target.checked })}
              />
              <label htmlFor="currentEducation">Obecnie tu studiuję</label>
            </div>

            <Button onClick={handleAddEducation} className="profile-button">
              Dodaj
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Komponent CertificatePopover
const CertificatePopover = ({ value = [], onChange }: CertificatePopoverProps) => {
  const [certificate, setCertificate] = useState<Certificate>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    noExpiry: false,
  });

  const handleAddCertificate = () => {
    if (certificate.name && certificate.issuer) {
      onChange([...value, certificate]);
      setCertificate({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        noExpiry: false,
      });
    }
  };

  const handleRemove = (index: number) => {
    const newCertificates = [...value];
    newCertificates.splice(index, 1);
    onChange(newCertificates);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border">
        {value.map((item, index) => (
          <Card key={index} className="p-2">
            <CardContent className="p-2">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.issuer}</p>
                  <p className="text-xs">
                    Issued: {item.issueDate}
                    {item.noExpiry
                      ? ' (No Expiry)'
                      : item.expiryDate
                        ? ` - Expires: ${item.expiryDate}`
                        : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} /> Dodaj certyfikat
          </Button>
        </PopoverTrigger>
        <PopoverContent className="font-poppins w-84 translate-x-[8.5%] p-4 xl:w-96">
          <div className="space-y-4">
            <h4 className="font-medium">Dodaj certyfikat</h4>

            <div className="space-y-2">
              <FormLabel>Nazwa certyfikatu</FormLabel>
              <Input
                value={certificate.name}
                onChange={(e) => setCertificate({ ...certificate, name: e.target.value })}
                placeholder="np. AWS Certified Solutions Architect"
                className="input-profile"
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Organ wydający</FormLabel>
              <Input
                value={certificate.issuer}
                onChange={(e) => setCertificate({ ...certificate, issuer: e.target.value })}
                placeholder="np. Amazon Web Services"
                className="input-profile"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <FormLabel>Data wydania</FormLabel>
                <Input
                  type="date"
                  value={certificate.issueDate}
                  onChange={(e) => setCertificate({ ...certificate, issueDate: e.target.value })}
                  className="input-profile w-32.5!"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Data wyagśnięcia</FormLabel>
                <Input
                  type="date"
                  value={certificate.expiryDate}
                  onChange={(e) => setCertificate({ ...certificate, expiryDate: e.target.value })}
                  disabled={certificate.noExpiry}
                  className="input-profile w-32.5!"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="noExpiry"
                checked={certificate.noExpiry}
                onChange={(e) => setCertificate({ ...certificate, noExpiry: e.target.checked })}
              />
              <label htmlFor="noExpiry">Certyfikat bez daty waności</label>
            </div>

            <Button onClick={handleAddCertificate} className="profile-button">
              Dodaj
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Komponent główny StepThree
export default function StepThree({ form, onNext, onBack }: StepThreeProps) {
  const validateStep = async () => {
    const result = await form.trigger([
      'education',
      'workExperience',
      'skills',
      'softSkills',
      'languages',
      'certificates',
    ]);
    if (result) onNext();
  };

  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Doświadczenie zawodowe</h2>

      {/* Skills */}
      <FormField
        control={form.control}
        name="skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Umiejętności</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Dodaj umiejętność (np. JavaScript)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Soft Skills */}
      <FormField
        control={form.control}
        name="softSkills"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Umiejętności miękkie</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Dodaj umiejętność miękką (np. Praca zespołowa)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Languages */}
      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Języki</FormLabel>
            <FormControl>
              <LanguagePopover value={field.value || []} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Work Experience */}
      <FormField
        control={form.control}
        name="workExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Doświadczenie zawodowe</FormLabel>
            <FormControl>
              <WorkExperiencePopover
                value={(field.value || []).map((item) => ({
                  ...item,
                  startDate: item.startDate ?? '',
                  endDate: item.endDate ?? '',
                }))}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Education */}
      <FormField
        control={form.control}
        name="education"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Edukacja</FormLabel>
            <FormControl>
              <EducationPopover
                value={(field.value || []).map((item) => ({
                  ...item,
                  degree: item.degree ?? '',
                  field: item.field ?? '',
                  startDate: item.startDate ?? '',
                  endDate: item.endDate ?? '',
                }))}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Certificates */}
      <FormField
        control={form.control}
        name="certificates"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certyfiakty</FormLabel>
            <FormControl>
              <CertificatePopover
                value={(field.value || []).map((c) => ({
                  name: c.name ?? '',
                  issuer: c.issuer ?? '',
                  issueDate: c.issueDate ?? '',
                  expiryDate: c.expiryDate ?? '',
                  noExpiry: c.noExpiry ?? false,
                }))}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between space-x-2 pt-6">
        <Button
          type="button"
          onClick={onBack}
          className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            <ArrowLeft className="mr-2 transition-transform duration-300 group-hover:-translate-x-2" />
            Powrót
          </span>
        </Button>
        <Button
          type="button"
          onClick={validateStep}
          className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            Dalej
            <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
          </span>
        </Button>
      </div>
    </div>
  );
}
