import React, { useEffect, useState } from 'react'
import { useAuthStore } from './auth.store.ts'
import { useNavigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuthStatus, user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // If we already have user data and are authenticated, skip API call
        if (isAuthenticated && user) {
          setLoading(false)
          return
        }

        // Only check auth status if we don't have user data
        const isValid = await checkAuthStatus()
        if (!isValid) {
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [checkAuthStatus, navigate, isAuthenticated, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-white">Verifying authentication...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}

export default ProtectedRoute
