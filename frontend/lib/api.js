import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
})

// User
export const getUser = () => API.get('/user')
export const updateUser = (data) => API.put('/user', data)

// Today dashboard
export const getToday = () => API.get('/today')

// Sessions
export const startSession = (muscle_group) => API.post('/sessions/start', { muscle_group })
export const getSession = (id) => API.get(`/sessions/${id}`)
export const addExercise = (sessionId, data) => API.post(`/sessions/${sessionId}/exercises`, data)
export const updateExercise = (exerciseId, data) => API.put(`/exercises/${exerciseId}`, data)
export const completeSession = (sessionId, duration_seconds) => API.post(`/sessions/${sessionId}/complete`, { duration_seconds })
export const getSessionHistory = () => API.get('/sessions/history')

// Water
export const logWater = (amount_ml) => API.post('/water', { amount_ml })
export const getWaterWeek = () => API.get('/water/week')

// Nutrients
export const getNutrientsToday = () => API.get('/nutrients/today')
export const logNutrient = (data) => API.post('/nutrients', data)
export const deleteNutrient = (id) => API.delete(`/nutrients/${id}`)
export const getNutrientHistory = () => API.get('/nutrients/history')

// Weight
export const logWeight = (weight) => API.post('/weight', { weight })
export const getWeightHistory = () => API.get('/weight/history')

// Analytics
export const getWeeklyAnalytics = () => API.get('/analytics/weekly')
export const getStreakCalendar = () => API.get('/analytics/streak-calendar')

// Study
export const logStudy = (data) => API.post('/study', data)
export const getStudyToday = () => API.get('/study/today')
export const getStudyWeek = () => API.get('/study/week')

export default API

// Exercise
export const deleteExercise = (id) => API.delete(`/exercises/${id}`)
export const getSessionExercises = (sessionId) => API.get(`/sessions/${sessionId}/exercises`)

// Stats
export const getStatsOverview = () => API.get('/stats/overview')
