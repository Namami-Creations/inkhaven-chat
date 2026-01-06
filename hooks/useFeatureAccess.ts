import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/auth'
import { canAccessFeature, type Feature } from '@/lib/feature-gate'
import type { User } from '@/types/user'

export function useFeatureAccess(feature: Feature): boolean {
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if ((session?.user as any)?.id) {
      getUserProfile((session?.user as any).id).then(setUser)
    } else {
      setUser(null)
    }
  }, [session])

  return canAccessFeature(user, feature)
}

export function useUser(): User | null {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if ((session?.user as any)?.id) {
      getUserProfile((session?.user as any).id).then(setUser)
    } else {
      setUser(null)
    }
  }, [session, status])

  return user
}