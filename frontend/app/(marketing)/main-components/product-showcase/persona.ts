import type { CvAnalysisResult, CvBasicsDto, CvWorkEntryDto } from '@/lib/types/cv';
import type { EntryDifficultyDto, SalaryProgressionDto } from '@/lib/types/marketAnalysis';
import type { AiCareerResponse, CareerPath } from '@/lib/types/recommendation';
import type { RoadmapPhaseDto, RoadmapStepDto } from '@/lib/types/roadmap';

// Marta is a made-up user. Each preview shows her data in the shape its real screen receives,
// so the tour reads as one story: the advisor's path is analysed, planned and ends in her CV.
export const persona = {
  firstName: 'Marta',
  // Polish accusative, as in "Poznaj Martę".
  firstNameAccusative: 'Martę',
  lastName: 'Wiśniewska',
  initials: 'MW',
  city: 'Kraków',
};

const targetRole = 'Customer Success Manager';

export const recommendation: Pick<
  AiCareerResponse['recommendation'],
  'primaryPath' | 'justification' | 'nextSteps'
> = {
  primaryPath: targetRole,
  justification:
    '4 lata pracy z klientami e-commerce i codzienna praca w CRM to mocna baza pod opiekę nad klientami biznesowymi.',
  nextSteps: [
    'Poznaj cykl życia klienta SaaS',
    'Naucz się pracy w HubSpot CRM',
    'Przygotuj case study z obecnej pracy',
  ],
};

export const alternativePaths: Pick<CareerPath, 'careerName' | 'probability'>[] = [
  { careerName: 'Account Manager', probability: 74 },
  { careerName: 'Specjalistka ds. onboardingu', probability: 68 },
];

export const market: {
  careerName: string;
  employmentRate: number;
  salaryProgression: Pick<
    SalaryProgressionDto,
    'careerLevel' | 'minSalary' | 'averageSalary' | 'maxSalary'
  >[];
  entryDifficulty: Pick<
    EntryDifficultyDto,
    'difficultyScore' | 'missingSkills' | 'estimatedTimeToReady'
  >;
} = {
  careerName: targetRole,
  employmentRate: 91,
  salaryProgression: [
    { careerLevel: 'Junior', minSalary: 6500, averageSalary: 7500, maxSalary: 8500 },
    { careerLevel: 'Mid', minSalary: 9000, averageSalary: 10500, maxSalary: 12000 },
    { careerLevel: 'Senior', minSalary: 12500, averageSalary: 14000, maxSalary: 16000 },
    { careerLevel: 'Lead', minSalary: 15000, averageSalary: 17500, maxSalary: 20000 },
  ],
  // The skills the roadmap below teaches and the CV finally lists.
  entryDifficulty: {
    difficultyScore: 38,
    missingSkills: ['HubSpot CRM', 'Onboarding B2B', 'Metryki churn i NRR'],
    estimatedTimeToReady: '3–4 mies.',
  },
};

type PreviewPhase = Pick<RoadmapPhaseDto, 'title' | 'startMonth' | 'endMonth'> & {
  steps: Pick<RoadmapStepDto, 'title' | 'status' | 'stepType'>[];
};

export const roadmap: {
  careerPathName: string;
  timeHorizonMonths: number;
  phases: PreviewPhase[];
} = {
  careerPathName: targetRole,
  // The roadmap creator offers 3, 6, 9, 12, 18 or 24 months.
  timeHorizonMonths: 3,
  phases: [
    {
      title: 'Fundamenty Customer Success',
      startMonth: 1,
      endMonth: 1,
      steps: [
        { title: 'Cykl życia klienta SaaS', status: 'Completed', stepType: 'Required' },
        { title: 'Metryki churn i NRR', status: 'Completed', stepType: 'Required' },
      ],
    },
    {
      title: 'Narzędzia i praktyka',
      startMonth: 2,
      endMonth: 2,
      steps: [
        // Completed on screen in the roadmap video, which ends on this state.
        { title: 'Kurs HubSpot CRM', status: 'Completed', stepType: 'Required' },
        { title: 'Scenariusz onboardingu B2B', status: 'NotStarted', stepType: 'Required' },
        { title: 'Case study z obecnej pracy', status: 'NotStarted', stepType: 'Optional' },
      ],
    },
    {
      title: 'Rekrutacja',
      startMonth: 3,
      endMonth: 3,
      steps: [
        { title: 'CV pod konkretną ofertę', status: 'NotStarted', stepType: 'Required' },
        { title: 'Próbna rozmowa', status: 'NotStarted', stepType: 'Optional' },
      ],
    },
  ],
};

export const cv: {
  basics: Pick<CvBasicsDto, 'firstName' | 'lastName' | 'email' | 'summary'>;
  targetPosition: string;
  offer: string;
  work: Required<Pick<CvWorkEntryDto, 'position' | 'company' | 'startDate'>>;
  skills: string[];
  analysis: Pick<CvAnalysisResult, 'overallScore' | 'targetPositionScore'>;
} = {
  basics: {
    firstName: persona.firstName,
    lastName: persona.lastName,
    email: 'marta.w@example.com',
    summary:
      'Specjalistka obsługi klienta z 4-letnim doświadczeniem w e-commerce. Rozwijam się w Customer Success: onboarding B2B i praca w HubSpot CRM.',
  },
  targetPosition: targetRole,
  offer: 'Nordly · SaaS',
  work: {
    position: 'Specjalistka ds. obsługi klienta',
    company: 'Lumo Home · e-commerce',
    startDate: '03.2021',
  },
  // What she was missing on the market, learned on the roadmap, now on her CV.
  skills: [...market.entryDifficulty.missingSkills, 'Zendesk'],
  analysis: { overallScore: 86, targetPositionScore: 82 },
};
