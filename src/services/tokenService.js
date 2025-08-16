

export const validateToken = async (token) => {
  try {
    const response = await fetch('https://ganaapi.alliance.cgiar.org/auth/token/validate', {
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
