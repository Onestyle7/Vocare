import { CvDto } from '@/lib/types/cv';
import { normalizeResponsibilitiesForPayload } from '@/lib/utils/workResponsibilities';

export const normalizeCvDto = (raw: Partial<CvDto>): CvDto => ({
  basics: raw.basics,
  work: (raw.work ?? []).map((work) => ({
    ...work,
    responsibilities: normalizeResponsibilitiesForPayload(work.responsibilities),
  })),
  education: raw.education ?? [],
  certificates: raw.certificates ?? [],
  projects: raw.projects ?? [],
  social: raw.social ?? [],
  skills: raw.skills ?? [],
  languages: raw.languages ?? [],
});
