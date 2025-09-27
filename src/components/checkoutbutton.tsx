// components/CheckoutButton.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from './ui/button'

interface CheckoutButtonProps {
  productId: string
  children: React.ReactNode
}

export function CheckoutButton({ productId, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useUser()
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  
  const handleCheckout = async () => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = '/sign-in'
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, email }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading}
    >
      {loading ? 'Processing...' : children}
    </Button>
  )
}