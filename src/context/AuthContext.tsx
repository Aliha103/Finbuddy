import React, { createContext, useState, useContext, ReactNode } from 'react'
import type { User, AuthContextType } from '../types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | undefined>(undefined)

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    // Store auth token if provided
    if ('token' in userData) {
      localStorage.setItem('authToken', (userData as any).token)
    }
  }

  const logout = () => {
    setUser(undefined)
    setIsAuthenticated(false)
    localStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
