'use client'
import { useUser, useAuth } from '@clerk/nextjs'

export default function DebugAuth() {
  const { user, isLoaded: userLoaded } = useUser()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()

  if (!userLoaded || !authLoaded) {
    return <div>Loading auth state...</div>
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <div>Is Signed In: {isSignedIn ? 'Yes' : 'No'}</div>
      <div>User ID: {user?.id || 'None'}</div>
      <div>User Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</div>
      <div>Environment: {process.env.NODE_ENV}</div>
      <div>Has Clerk Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</div>
    </div>
  )
}
