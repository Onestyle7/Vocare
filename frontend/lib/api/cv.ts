import { api } from '../api';
import {
  CreateCvDto,
  CvDetailsDto,
  CvListItemDto,
  CvLimits,
  UpdateCvDto,
} from '../types/cv';

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

export const deleteCv = async (id: string): Promise<void> => {
  await api.delete(`/api/cvs/delete/${id}`);
};

export const updateCv = async (
  payload: UpdateCvDto,
): Promise<CvDetailsDto> => {
  const { data } = await api.put(`/api/cvs/update/${payload.id}`, payload);
  return data;
};