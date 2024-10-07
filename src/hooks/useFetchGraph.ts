import axios from 'axios';
import { transformApiResponse } from '../utils/helpers';
import { CleanParams } from '../types';

export const useFetchServiceGraph = async (initialParams: CleanParams) => {
  try {

    console.log('Initial Params:', initialParams);

    const cleanParams: CleanParams = {
      filters: {},
      granularity: initialParams.granularity || '',
      start_time: initialParams.start_time || '',
      end_time: initialParams.end_time || '',
      db: initialParams.db || '',
      table: initialParams.table || ''
    };

    console.log('Clean Params before filters:', cleanParams);

    const filterFields = ['cluster', 'namespace', 'service', 'protocol', 'port', 'endpoint'];

    filterFields.forEach(field => {
      if (initialParams.filters && initialParams.filters[field]) {
        let value = initialParams.filters[field];
        if (value === "'__any'" || value === "__any" || (field === 'port' && (value === "'0'" || value === "0"))) {
          value = '';
        }
        cleanParams.filters[field] = value;
      }
    });

    console.log('Clean Params after filters:', cleanParams);

    const CORS_PROXY = 'http://localhost:8080/';
    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

    const formData = new FormData();

    Object.entries(cleanParams).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    for (let pair of formData.entries()) {
      console.log(`FormData: ${pair[0]}, ${pair[1]}`);
    }

    const response = await axios.post(CORS_PROXY + API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', response.data);

    if (response.status !== 200) {
      throw new Error('Error fetching service graph: HTTP status ' + response.status);
    }

    return transformApiResponse(response.data, cleanParams.granularity);
  } catch (error: any) {
    // Debug: Log the error if there is one
    console.error('Error fetching service graph:', error);
    throw new Error(error.message || 'An error occurred while fetching the service graph');
  }
};
