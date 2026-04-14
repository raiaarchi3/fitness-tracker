// import axios from 'axios'

// const API = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
//   timeout: 10000,
// })

// // User
// export const getUser = () => API.get('/user')
// export const updateUser = (data) => API.put('/user', data)

// // Today dashboard
// export const getToday = () => API.get('/today')

// // Sessions
// export const startSession = (muscle_group) => API.post('/sessions/start', { muscle_group })
// export const getSession = (id) => API.get(`/sessions/${id}`)
// export const addExercise = (sessionId, data) => API.post(`/sessions/${sessionId}/exercises`, data)
// export const updateExercise = (exerciseId, data) => API.put(`/exercises/${exerciseId}`, data)
// export const completeSession = (sessionId, duration_seconds) => API.post(`/sessions/${sessionId}/complete`, { duration_seconds })
// export const getSessionHistory = () => API.get('/sessions/history')

// // Water
// export const logWater = (amount_ml) => API.post('/water', { amount_ml })
// export const getWaterWeek = () => API.get('/water/week')

// // Nutrients
// export const getNutrientsToday = () => API.get('/nutrients/today')
// export const logNutrient = (data) => API.post('/nutrients', data)
// export const deleteNutrient = (id) => API.delete(`/nutrients/${id}`)
// export const getNutrientHistory = () => API.get('/nutrients/history')

// // Weight
// export const logWeight = (weight) => API.post('/weight', { weight })
// export const getWeightHistory = () => API.get('/weight/history')

// // Analytics
// export const getWeeklyAnalytics = () => API.get('/analytics/weekly')
// export const getStreakCalendar = () => API.get('/analytics/streak-calendar')

// // Study
// export const logStudy = (data) => API.post('/study', data)
// export const getStudyToday = () => API.get('/study/today')
// export const getStudyWeek = () => API.get('/study/week')

// export default API

// // Exercise
// export const deleteExercise = (id) => API.delete(`/exercises/${id}`)
// export const getSessionExercises = (sessionId) => API.get(`/sessions/${sessionId}/exercises`)

// // Stats
// export const getStatsOverview = () => API.get('/stats/overview')
import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
})

// ── Auto-attach token to every request ──────────────────────────────
API.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('ob_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

// ── Auto-logout on 401 ───────────────────────────────────────────────
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem('ob_token')
        localStorage.removeItem('ob_user')
        window.location.href = '/login'
      } catch {}
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────
export const register     = (email, password) => API.post('/auth/register', { email, password })
export const login        = (email, password) => API.post('/auth/login', { email, password })
export const completeSetup = (data)           => API.post('/auth/setup', data)
export const getMe        = ()                => API.get('/auth/me')

// ── User ─────────────────────────────────────────────────────────────
export const getUser    = ()     => API.get('/user')
export const updateUser = (data) => API.put('/user', data)

// ── Today dashboard ───────────────────────────────────────────────────
export const getToday = () => API.get('/today')

// ── Sessions ─────────────────────────────────────────────────────────
export const startSession      = (muscle_group)             => API.post('/sessions/start', { muscle_group })
export const getSession        = (id)                       => API.get(`/sessions/${id}`)
export const addExercise       = (sessionId, data)          => API.post(`/sessions/${sessionId}/exercises`, data)
export const updateExercise    = (exerciseId, data)         => API.put(`/exercises/${exerciseId}`, data)
export const deleteExercise    = (id)                       => API.delete(`/exercises/${id}`)
export const completeSession   = (sessionId, duration_seconds) => API.post(`/sessions/${sessionId}/complete`, { duration_seconds })
export const getSessionHistory = ()                         => API.get('/sessions/history')

// ── Water ─────────────────────────────────────────────────────────────
export const logWater    = (amount_ml) => API.post('/water', { amount_ml })
export const getWaterWeek = ()         => API.get('/water/week')

// ── Nutrients ─────────────────────────────────────────────────────────
export const getNutrientsToday = ()     => API.get('/nutrients/today')
export const logNutrient       = (data) => API.post('/nutrients', data)
export const deleteNutrient    = (id)   => API.delete(`/nutrients/${id}`)

// ── Weight ────────────────────────────────────────────────────────────
export const logWeight       = (weight) => API.post('/weight', { weight })
export const getWeightHistory = ()      => API.get('/weight/history')

// ── Study ─────────────────────────────────────────────────────────────
export const logStudy    = (data) => API.post('/study', data)
export const getStudyToday = ()   => API.get('/study/today')
export const getStudyWeek  = ()   => API.get('/study/week')

// ── Analytics ─────────────────────────────────────────────────────────
export const getWeeklyAnalytics  = () => API.get('/analytics/weekly')
export const getStreakCalendar   = () => API.get('/analytics/streak-calendar')
export const getStatsOverview    = () => API.get('/stats/overview')

export default API
