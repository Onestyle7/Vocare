'use client';

import { useEffect, useState, useRef } from 'react';
import CVCreator from '../ResumeComponent';
import { createCv } from '@/lib/api/cv';
import { CvDetailsDto } from '@/lib/types/cv';

const CreateResumePage = () => {
  const [cv, setCv] = useState<CvDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const createdRef = useRef(false);

  useEffect(() => {
    const resetLocalStorage = () => {
      const keys = [
        'personalInfo',
        'experiences',
        'education',
        'skills',
        'languages',
        'certificates',
        'hobbies',
        'privacyStatement',
        'sectionOrder',
      ];
      keys.forEach((k) => localStorage.removeItem(k));
    };

    if (createdRef.current) return;
    createdRef.current = true;

    const create = async () => {
      try {
        resetLocalStorage();
        const data = await createCv({ name: 'New Resume', createFromProfile: false });
        setCv(data);
      } catch (err) {
        console.error('Failed to create resume', err);
      } finally {
        setLoading(false);
      }
    };

    create();
  }, []);

  return (
    <div className="font-poppins">
      <div className="relative z-10">
        {loading ? <p>Loading...</p> : cv && <CVCreator initialCv={cv} />}
      </div>
    </div>
  );
};

export default CreateResumePage;