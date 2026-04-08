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

  sendOtp: (data) =>
    fetchAPI("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyOtp: (data) =>
    fetchAPI("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendOtp: (email) =>
    fetchAPI("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  phoneSetupSend: (phone) =>
    fetchAPI("/api/auth/phone-setup/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  phoneSetupVerify: (phone, code) =>
    fetchAPI("/api/auth/phone-setup/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),
}

// Stats API
export const statsAPI = {
  getStats: (period = "week") => fetchAPI(`/api/stats?period=${period}`),
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
  delete: (id) =>
    fetchAPI(`/api/customers/${id}`, { method: "DELETE" }),
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

// Appointments APIs
export const appointmentsAPI = {
  getAll: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/appointments${query ? `?${query}` : ""}`)
  },
  getById: (id) => fetchAPI(`/api/appointments/${id}`),
  create: (data) =>
    fetchAPI("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchAPI(`/api/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    fetchAPI(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  // ✅ تحديث الحالة مع إرسال رسالة AI تلقائية
  updateStatusWithMessage: (id, status, sendMessage = true) =>
    fetchAPI(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, sendMessage }),
    }),
  delete: (id) =>
    fetchAPI(`/api/appointments/${id}`, {
      method: "DELETE",
    }),
  // ✅ إرسال رسالة تأكيد أو تذكير
  sendMessage: (appointmentId, type) =>
    fetchAPI("/api/appointments/send-message", {
      method: "POST",
      body: JSON.stringify({ appointmentId, type }),
    }),
}

// Orders APIs
export const ordersAPI = {
  getAll: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    )
    const query = new URLSearchParams(cleanParams).toString()
    return fetchAPI(`/api/orders${query ? `?${query}` : ""}`)
  },
  getById: (id) => fetchAPI(`/api/orders/${id}`),
  create: (data) =>
    fetchAPI("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchAPI(`/api/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id, status, extra = {}) =>
    fetchAPI(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...extra }),
    }),
  delete: (id) =>
    fetchAPI(`/api/orders/${id}`, { method: "DELETE" }),
}

// Invoices API (client view)
export const invoicesAPI = {
  getAll: () => fetchAPI("/api/invoices"),
}

// Admin APIs
export const adminAPI = {
  getUsers: () => fetchAPI("/api/admin/users"),
  deleteUser: (id) => fetchAPI(`/api/admin/users?id=${id}`, { method: "DELETE" }),
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v))
    ).toString()
    return fetchAPI(`/api/admin/invoices${query ? `?${query}` : ""}`)
  },
  createInvoice: (data) =>
    fetchAPI("/api/admin/invoices", { method: "POST", body: JSON.stringify(data) }),
  updateInvoice: (id, data) =>
    fetchAPI(`/api/admin/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteInvoice: (id) =>
    fetchAPI(`/api/admin/invoices/${id}`, { method: "DELETE" }),
  sendInvoice: (id, locale = "fr") =>
    fetchAPI(`/api/admin/invoices/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ locale }),
    }),
}

export default fetchAPI
