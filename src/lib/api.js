// API Client - wrapper for fetch with auth

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Get token from localStorage
function getToken() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    return token
  }
  return null
}

// Main fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getToken()

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Always add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const fetchOptions = {
      ...options,
      headers,
      // Ensure credentials are included for same-origin requests
      credentials: "same-origin",
    }

    const response = await fetch(url, fetchOptions)
    
    // Handle non-JSON responses
    let data
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = { error: "Invalid response format" }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || "Request failed")
    }

    return data
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

// Auth APIs
export const authAPI = {
  login: (email, password) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (token) =>
    fetchAPI("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  register: (userData) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  me: () => fetchAPI("/api/auth/me"),
}

// Stats API
export const statsAPI = {
  getStats: () => fetchAPI("/api/stats"),
}

// Products APIs
export const productsAPI = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/products${query ? `?${query}` : ""}`)
  },
  getById: (id) => fetchAPI(`/api/products/${id}`),
  create: (data) =>
    fetchAPI("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchAPI(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    fetchAPI(`/api/products/${id}`, {
      method: "DELETE",
    }),
}

// Services APIs
export const servicesAPI = {
  getAll: () => fetchAPI("/api/services"),
  create: (data) =>
    fetchAPI("/api/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchAPI(`/api/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    fetchAPI(`/api/services/${id}`, {
      method: "DELETE",
    }),
}

// Conversations APIs
export const conversationsAPI = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/conversations${query ? `?${query}` : ""}`)
  },
  getById: (id) => fetchAPI(`/api/conversations/${id}`),
  update: (id, data) =>
    fetchAPI(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    fetchAPI(`/api/conversations/${id}`, {
      method: "DELETE",
    }),
}

// Customers APIs
export const customersAPI = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/customers${query ? `?${query}` : ""}`)
  },
  getById: (id) => fetchAPI(`/api/customers/${id}`),
  update: (id, data) =>
    fetchAPI(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

// Agent APIs
export const agentAPI = {
  get: () => fetchAPI("/api/agent"),
  update: (data) =>
    fetchAPI("/api/agent", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getObjections: () => fetchAPI("/api/agent/objections"),
  addObjection: (data) =>
    fetchAPI("/api/agent/objections", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateObjection: (id, data) =>
    fetchAPI(`/api/agent/objections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteObjection: (id) =>
    fetchAPI(`/api/agent/objections/${id}`, {
      method: "DELETE",
    }),
}

// Notifications APIs
export const notificationsAPI = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/notifications${query ? `?${query}` : ""}`)
  },
  markAsRead: (id) =>
    fetchAPI(`/api/notifications/${id}/read`, {
      method: "PUT",
    }),
  markAllAsRead: () =>
    fetchAPI("/api/notifications/read-all", {
      method: "PUT",
    }),
}

// WhatsApp APIs
export const whatsappAPI = {
  connect: (data) =>
    fetchAPI("/api/whatsapp/connect", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  send: (data) =>
    fetchAPI("/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  test: (data) =>
    fetchAPI("/api/whatsapp/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export default fetchAPI
