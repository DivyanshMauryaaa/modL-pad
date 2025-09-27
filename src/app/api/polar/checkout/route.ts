// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { auth } from '@clerk/nextjs/server'

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: 'sandbox' // Change to 'production' when ready
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, email } = await request.json()

    // Create checkout session
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?checkout_id={CHECKOUT_ID}`,
      externalCustomerId: userId, // Link to Clerk user ID
      customerMetadata: {
        clerkUserId: userId,
      },
      customerEmail: email
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}