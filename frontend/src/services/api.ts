import axios from 'axios';
import { MenuSummary } from '../types/menu';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const summarizeMenu = async (url: string, date?: string): Promise<MenuSummary> => {
  const response = await axios.post(`${API_BASE_URL}/summarize`, {
    url,
    date
  });
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await axios.get(`${API_BASE_URL}/health`);
  return response.data;
};

