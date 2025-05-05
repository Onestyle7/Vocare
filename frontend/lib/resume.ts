import { CvDto } from './types/resume';

export async function generateResume(position: string, token: string): Promise<CvDto> {
  const res = await fetch('https://localhost:5001/api/Cv/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ position }),
  });
  if (!res.ok) throw new Error('Błąd generowania CV');
  return res.json();
}
