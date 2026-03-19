import { create } from "zustand"

export const useProductsStore = create((set) => ({
  // State
  products: [],

  // Actions
  setProducts: (data) => set({ products: data }),
  
  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),
  
  updateProduct: (id, data) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  
  toggleProduct: (id) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    })),
  
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}))
