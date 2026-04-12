import { create } from "zustand"
import { agentAPI } from "@/lib/api"

// Helper to normalize error messages
const normalizeError = (err) => err?.response?.data?.error || err?.message || "Unknown error"

export const useAgentStore = create((set, get) => ({
  // State
  agent: null,
  loading: false,
  saving: false,
  objectionLoading: false,
  error: null,
  // Request counter for race condition prevention
  _fetchRequestId: 0,

  // Fetch agent from API
  fetchAgent: async () => {
    const requestId = ++get()._fetchRequestId
    try {
      set({ loading: true, error: null })
      const response = await agentAPI.get()
      // Only apply if this is still the latest request
      if (get()._fetchRequestId === requestId) {
        set({ agent: response.data, loading: false })
      }
    } catch (err) {
      if (get()._fetchRequestId === requestId) {
        set({ error: normalizeError(err), loading: false })
      }
    }
  },

  // Update agent
  updateAgent: async (data) => {
    try {
      set({ saving: true, error: null })
      const response = await agentAPI.update(data)
      set({ agent: response.data, saving: false })
      return true
    } catch (err) {
      set({ error: normalizeError(err), saving: false })
      return false
    }
  },

  // Toggle active status
  toggleActive: async () => {
    const { agent } = get()
    if (!agent) return false
    
    try {
      set({ saving: true, error: null })
      const response = await agentAPI.update({ isActive: !agent.isActive })
      set({ agent: response.data, saving: false })
      return true
    } catch (err) {
      set({ error: normalizeError(err), saving: false })
      return false
    }
  },

  // Add objection reply
  addObjectionReply: async (reply) => {
    try {
      set({ objectionLoading: true, error: null })
      const response = await agentAPI.addObjection(reply)
      const { agent } = get()
      if (agent) {
        const replies = agent.objectionReplies || []
        set({ 
          agent: { 
            ...agent, 
            objectionReplies: [...replies, response.data] 
          },
          objectionLoading: false
        })
      }
      return true
    } catch (err) {
      set({ error: normalizeError(err), objectionLoading: false })
      return false
    }
  },

  // Remove objection reply
  removeObjectionReply: async (id) => {
    try {
      set({ objectionLoading: true, error: null })
      await agentAPI.deleteObjection(id)
      const { agent } = get()
      if (agent) {
        const replies = agent.objectionReplies || []
        set({
          agent: {
            ...agent,
            objectionReplies: replies.filter((r) => r.id !== id)
          },
          objectionLoading: false
        })
      }
      return true
    } catch (err) {
      set({ error: normalizeError(err), objectionLoading: false })
      return false
    }
  },

  // Update objection reply
  updateObjectionReply: async (id, data) => {
    try {
      set({ objectionLoading: true, error: null })
      const response = await agentAPI.updateObjection(id, data)
      const { agent } = get()
      if (agent) {
        const replies = agent.objectionReplies || []
        set({
          agent: {
            ...agent,
            objectionReplies: replies.map((r) =>
              r.id === id ? response.data : r
            )
          },
          objectionLoading: false
        })
      }
      return true
    } catch (err) {
      set({ error: normalizeError(err), objectionLoading: false })
      return false
    }
  },
}))
