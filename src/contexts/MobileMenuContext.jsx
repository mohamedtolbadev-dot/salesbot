"use client"

import { createContext, useContext, useState } from "react"

const MobileMenuContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function MobileMenuProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MobileMenuContext.Provider value={{
      isOpen,
      open:  () => setIsOpen(true),
      close: () => setIsOpen(false),
    }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export const useMobileMenu = () => useContext(MobileMenuContext)