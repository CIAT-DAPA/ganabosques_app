
const API_URL = "http://127.0.0.1:8000/";
export const validateToken = async (token) => {
  try {
    const response = await fetch(API_URL + 'auth/token/validate', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false };
  }
};
