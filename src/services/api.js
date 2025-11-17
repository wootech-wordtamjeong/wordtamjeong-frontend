import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = {
  // Get current quiz status
  async getStatus() {
    const response = await apiClient.get('/api/status')
    return response.data
  },

  // Submit a word guess
  async submitGuess(word) {
    const response = await apiClient.post('/api/guess', { word })
    return response.data
  },

  // Check server health
  async checkHealth() {
    const response = await apiClient.get('/health')
    return response.data
  },
}

export default api
