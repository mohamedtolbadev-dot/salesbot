import { create } from "zustand"
import { agentAPI } from "@/lib/api"

export const useAgentStore = create((set, get) => ({
  // State
  agent: null,
  loading: false,
  error: null,

  // Fetch agent from API
  fetchAgent: async () => {
    try {
      set({ loading: true, error: null })
      const response = await agentAPI.get()
      set({ agent: response.data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Update agent
  updateAgent: async (data) => {
    try {
      const response = await agentAPI.update(data)
      set({ agent: response.data })
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },

  // Toggle active status
  toggleActive: async () => {
    const { agent } = get()
    if (!agent) return
    
    try {
      const response = await agentAPI.update({ isActive: !agent.isActive })
      set({ agent: response.data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Add objection reply
  addObjectionReply: async (reply) => {
    try {
      const response = await agentAPI.addObjection(reply)
      const { agent } = get()
      if (agent) {
        set({ 
          agent: { 
            ...agent, 
            objectionReplies: [...agent.objectionReplies, response.data] 
          } 
        })
      }
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },

  // Remove objection reply
  removeObjectionReply: async (id) => {
    try {
      await agentAPI.deleteObjection(id)
      const { agent } = get()
      if (agent) {
        set({
          agent: {
            ...agent,
            objectionReplies: agent.objectionReplies.filter((r) => r.id !== id)
          }
        })
      }
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },

  // Update objection reply
  updateObjectionReply: async (id, data) => {
    try {
      const response = await agentAPI.updateObjection(id, data)
      const { agent } = get()
      if (agent) {
        set({
          agent: {
            ...agent,
            objectionReplies: agent.objectionReplies.map((r) =>
              r.id === id ? response.data : r
            )
          }
        })
      }
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },
}))
