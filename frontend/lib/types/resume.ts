// Type definitions that match the backend DTOs
export interface CvLocationDto {
  city: string;
  country: string;
}

export interface CvBasicsDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  summary: string;
  location: CvLocationDto;
}

export interface CvWorkEntryDto {
  company?: string;
  position?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD | "Present"
  description?: string;
}

export interface CvEducationEntryDto {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD | "Present"
}

export interface CvCertificateEntryDto {
  name: string;
  date?: string; // Format: YYYY-MM-DD
}

export interface CvLanguageEntryDto {
  language: string;
  fluency: string;
}

export interface CvDto {
  basics?: CvBasicsDto;
  work?: CvWorkEntryDto[];
  education?: CvEducationEntryDto[];
  certificates?: CvCertificateEntryDto[];
  skills?: string[];
  languages?: CvLanguageEntryDto[];
}

import axios from 'axios';

const API_URL = 'https://localhost:5001';

// Example usage for fetching CV data from the API
export async function fetchGeneratedCv(position?: string): Promise<CvDto> {
  try {
    const token = getAuthToken();

    const response = await axios.post(
      `${API_URL}/api/Cv/generate`,
      { position: position || '' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating CV:', error);
    throw error;
  }
}

// Helper function to get the authentication token
function getAuthToken(): string {
  // Get token from localStorage consistent with your login implementation
  return localStorage.getItem('token') || '';
}
