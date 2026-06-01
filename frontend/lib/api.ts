import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

export const api = axios.create({ baseURL: API_URL })

// Injetar token automaticamente
api.interceptors.request.use(cfg => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Tipos
export interface Lead {
  id:                 string
  name:               string | null
  username:           string | null
  channel:            'Instagram' | 'WhatsApp'
  status:             string
  qualificationScore: number
  firstContactAt:     string
  lastActivityAt:     string
  profilePicUrl:      string | null
  campaign:           { id: string; name: string } | null
}

export interface Conversation {
  id:           string
  status:       string
  aiEnabled:    boolean
  channel:      string
  lastMessageAt:string
  totalMessages:number
  lastIntent:   string
  lead: {
    id: string; name: string | null
    username: string | null; qualificationScore: number
  }
  campaign: { id: string; name: string } | null
}

export interface Message {
  id:            string
  direction:     'Inbound' | 'Outbound'
  type:          string
  content:       string
  sentByAi:      boolean
  detectedIntent:string | null
  sentAt:        string
  delivered:     boolean
  read:          boolean
}

export interface Campaign {
  id:                 string
  name:               string
  active:             boolean
  isDefault:          boolean
  personaName:        string
  productName:        string
  productPrice:       number | null
  paymentUrl:         string | null
  triggerKeyword:     string | null
  totalLeads:         number
  totalSales:         number
  totalRevenue:       number
}

// API calls
export const leadsApi = {
  list: (params?: Record<string, unknown>) => api.get<{ total: number; items: Lead[] }>('/leads', { params }),
  get:  (id: string)                        => api.get<Lead>(`/leads/${id}`),
  stats:()                                  => api.get('/leads/stats'),
  updateStatus: (id: string, status: string) => api.patch(`/leads/${id}/status`, { status }),
}

export const conversationsApi = {
  list:         (params?: Record<string, unknown>) => api.get<{ total: number; items: Conversation[] }>('/conversations', { params }),
  messages:     (id: string, page = 1)             => api.get<Message[]>(`/conversations/${id}/messages`, { params: { page } }),
  toggleAi:     (id: string, enabled: boolean)     => api.patch(`/conversations/${id}/ai`, { enabled }),
  sendMessage:  (id: string, text: string)         => api.post(`/conversations/${id}/messages`, { text }),
}

export const campaignsApi = {
  list:   ()                         => api.get<Campaign[]>('/campaigns'),
  get:    (id: string)               => api.get<Campaign>(`/campaigns/${id}`),
  create: (data: Partial<Campaign>)  => api.post('/campaigns', data),
  update: (id: string, data: Partial<Campaign>) => api.put(`/campaigns/${id}`, data),
  delete: (id: string)               => api.delete(`/campaigns/${id}`),
}

export const authApi = {
  login:    (email: string, password: string)        => api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }),
  me:       ()                                        => api.get('/auth/me'),
}
