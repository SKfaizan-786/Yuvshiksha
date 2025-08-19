import API_CONFIG from '../config/api';

export const fetchTeacherById = async (teacherId) => {
  const token = localStorage.getItem('token');
  const API_BASE_URL = API_CONFIG.BASE_URL;
  const url = `${API_BASE_URL}/api/teachers/${teacherId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch teacher');
  return res.json();
};
