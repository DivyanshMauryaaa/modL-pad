'use client'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useCallback, useMemo, useState } from 'react'
import { CheckoutButton } from '@/components/checkoutbutton'

export default function PricingPage() {
  const checkoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
  const [loading, setLoading] = useState(false)

  const beginCheckout = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to create checkout')
      const data = await res.json()
      const url = data?.url || checkoutUrl
      if (url) window.location.href = url
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [email, checkoutUrl, loading])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Pricing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-2">Free</h2>
          <p className="text-gray-600 mb-4">Get started at no cost.</p>
          <ul className="space-y-2 text-sm mb-6">
            <li>• Basic features</li>
            <li>• Limited daily usage</li>
            <li>• Community support</li>
          </ul>
          <Link href="/" className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm">Start free</Link>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-2">Pro</h2>
          <p className="text-gray-600 mb-1">Everything in Free, plus:</p>
          <ul className="space-y-2 text-sm mb-6">
            <li>• Higher limits</li>
            <li>• Premium features</li>
            <li>• Priority support</li>
          </ul>
          {checkoutUrl ? (
            <CheckoutButton productId="acb750be-9698-4f05-9e15-6fbe9ba08ad2">Upgrade</CheckoutButton>
          ) : (
            <p className="text-sm text-red-600">Set NEXT_PUBLIC_POLAR_CHECKOUT_URL to enable checkout</p>
          )}
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/checkout" className="underline">Go to checkout</Link>
      </div>
    </div>
  )
}