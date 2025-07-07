import { api } from '../api';
import { CreateCvDto, CvDetailsDto, CvListItemDto, CvLimits } from '../types/cv';

export const createCv = async (payload: CreateCvDto): Promise<CvDetailsDto> => {
  const { data } = await api.post('/api/cvs/create', payload);
  return data;
};

export const getCvDetails = async (id: string): Promise<CvDetailsDto> => {
  const { data } = await api.get(`/api/cvs/details/${id}`);
  return data;
};

export const getUserCvs = async (): Promise<CvListItemDto[]> => {
  const { data } = await api.get('/api/cvs/my-cvs');
  return data;
};

export const getCvLimits = async (): Promise<CvLimits> => {
  const { data } = await api.get('/api/cvs/limits');
  return data;
};
