import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export const analyzeRepository = async (repoUrl, apiKey = null) => {
  try {
    const response = await axios.post(`${baseURL}/analyze`, {
      repoUrl,
      apiKey
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Analysis failed';
    throw new Error(message);
  }
};
