const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  signup: async (name, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (name, email) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
  }
};

// Itinerary API functions
export const itineraryAPI = {
  generate: async (formData) => {
    return apiRequest('/itinerary/generate', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  },

  getUserItineraries: async () => {
    return apiRequest('/itinerary/user');
  },

  getItinerary: async (id) => {
    return apiRequest(`/itinerary/${id}`);
  },

  getRecommendations: async (preferences) => {
    return apiRequest('/itinerary/recommendations', {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
  },

  deleteItinerary: async (id) => {
    return apiRequest(`/itinerary/${id}`, {
      method: 'DELETE'
    });
  }
};

// Profile API functions
export const profileAPI = {
  getProfile: async () => {
    return apiRequest('/profile');
  },

  updateProfile: async (name, email) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
  },

  getActivity: async () => {
    return apiRequest('/profile/activity');
  }
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};
