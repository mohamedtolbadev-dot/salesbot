import { create } from "zustand"

export const useConversationsStore = create((set) => ({
  // State
  conversations: [],
  selectedId: null,
  filter: "all",
  searchQuery: "",

  // Actions
  setConversations: (data) => set({ conversations: data }),
  
  selectConversation: (id) => set({ selectedId: id }),
  
  setFilter: (filter) => set({ filter }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  markAsRead: (id) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, isRead: true } : conv
      ),
    })),
  
  clearSelection: () => set({ selectedId: null }),
}))
