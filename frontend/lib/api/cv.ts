import { api } from '../api';
import { CreateCvDto, CvDetailsDto, CvListItemDto, CvLimits, UpdateCvDto } from '../types/cv';

type ReqOpts = { signal?: AbortSignal };

// Tworzenie CV
export const createCv = async (payload: CreateCvDto, opts?: ReqOpts): Promise<CvDetailsDto> => {
  const { data } = await api.post('/api/cvs/create', payload, { signal: opts?.signal });
  return data;
};

// Szczegóły CV
export const getCvDetails = async (id: string, opts?: ReqOpts): Promise<CvDetailsDto> => {
  const { data } = await api.get(`/api/cvs/details/${id}`, { signal: opts?.signal });
  return data;
};

// Lista CV użytkownika
export const getUserCvs = async (opts?: ReqOpts): Promise<CvListItemDto[]> => {
  const { data } = await api.get('/api/cvs/my-cvs', { signal: opts?.signal });
  return data;
};

// Limity planu
export const getCvLimits = async (opts?: ReqOpts): Promise<CvLimits> => {
  const { data } = await api.get('/api/cvs/limits', { signal: opts?.signal });
  return data;
};

// Usuwanie CV
export const deleteCv = async (id: string, opts?: ReqOpts): Promise<void> => {
  await api.delete(`/api/cvs/delete/${id}`, { signal: opts?.signal });
};

export const updateCv = async (
  payload: UpdateCvDto,
  opts?: { signal?: AbortSignal }
): Promise<CvDetailsDto> => {
  const { data } = await api.put(`/api/cvs/update/${payload.id}`, payload, {
    signal: opts?.signal,
  });
  return data;
};
