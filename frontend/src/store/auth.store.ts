import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {api} from "../api/api.ts"
interface User {
  id: string
  username: string
  email: string
  created_at: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  setUser: (user: User) => void
  checkAuthStatus: () => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (user) => {
        set({ 
          user, 
          isAuthenticated: true 
        })
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        })
      },
      
      setUser: (user) => {
        set({ user, isAuthenticated: true })
      },
      
      checkAuthStatus: async () => {
        try {
          const { api } = await import('../api/api')
          const response = await api.get('/auth/profile')
          
          if (response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true 
            })
            return true
          }
          return false
        } catch (error: any) {
          if (error.response?.status === 401) {
            console.log('401 Unauthorized - Cookie may not be sent. Trying fallback...');
            // Fallback: If cookie fails, try to get token from localStorage if you have it
            const fallbackToken = localStorage.getItem('fallback_token');
            if (fallbackToken) {
              api.defaults.headers.common['Authorization'] = `Bearer ${fallbackToken}`;
              const fallbackResponse = await api.get('/auth/profile');
              if (fallbackResponse.data) {
                set({ user: fallbackResponse.data, isAuthenticated: true });
                return true;
              }
            }
          } else {
            console.error('Auth check error:', error);
          }
          
          set({ 
            user: null, 
            isAuthenticated: false 
          })
          return false
        }
      },
      
      clearError: () => {
        // Helper function to clear any error states if needed
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)
