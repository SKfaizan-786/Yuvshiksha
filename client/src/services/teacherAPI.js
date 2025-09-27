import API_CONFIG from '../config/api';

export const fetchTeacherById = async (teacherId) => {
  // Do not try to read the token with Cookies.get().
  // It's likely an HttpOnly cookie and inaccessible to JavaScript.
  
  const API_BASE_URL = API_CONFIG.BASE_URL;
  const url = `${API_BASE_URL}/api/teachers/${teacherId}`;
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
      // Remove the 'Authorization' header.
      // The server will read the token directly from the HttpOnly cookie.
    },
    credentials: 'include' // This is the crucial part that sends the HttpOnly cookie.
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch teacher');
  }
  
  return res.json();
};