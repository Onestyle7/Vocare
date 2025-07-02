'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import CVCreator from '../ResumeComponent';
import { getCvDetails } from '@/lib/api/cv';
import { CvDetailsDto } from '@/lib/types/cv';

const ResumeDetailPage = () => {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [cv, setCv] = useState<CvDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCv = async () => {
      if (!id) return;
      try {
        const data = await getCvDetails(id);
        setCv(data);
      } catch (err) {
        console.error('Failed to load CV details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCv();
  }, [id]);

  return (
    <div className="font-poppins">
      <Header />
      <div className="relative">
        <GridBackgroundDemo />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-6">
          {loading ? <p>Loading...</p> : cv && <CVCreator initialCv={cv} />}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetailPage;
