'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateResume } from '@/lib/resume';
import { CvDto } from '@/lib/types/resume';

interface Props {
  onGenerated: (cv: CvDto) => void;
}

export function ResumeFormModal({ onGenerated }: Props) {
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Nie jesteś zalogowany. Zaloguj się, aby wygenerować CV.');
      return;
    }

    try {
      setLoading(true);
      const cv = await generateResume(position, token);
      onGenerated(cv);
    } catch (err) {
      alert('Błąd generowania CV');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins flex items-center gap-2">
      <Input
        placeholder="Na jakie stanowisko?"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="input-form"
      />
      <Button onClick={handleGenerate} disabled={loading || !position}>
        {loading ? 'Generuję...' : 'Generuj CV'}
      </Button>
    </div>
  );
}
