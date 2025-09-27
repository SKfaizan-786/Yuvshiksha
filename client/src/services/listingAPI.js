import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL + '/api';

export const listingAPI = {
  updateListingStatus: async (isListed) => {
    const response = await fetch(`${API_BASE_URL}/profile/teacher/listing`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isListed }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update listing status');
    }
    return data;
  },
};