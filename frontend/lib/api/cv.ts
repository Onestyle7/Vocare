import { api } from '../api';
import { CreateCvDto, CvDetailsDto } from '../types/cv';

export const createCv = async (payload: CreateCvDto): Promise<CvDetailsDto> => {
  const { data } = await api.post('/api/cvs/create', payload);
  return data;
};

export const getCvDetails = async (id: string): Promise<CvDetailsDto> => {
  const { data } = await api.get(`/api/cvs/details/${id}`);
  return data;
};