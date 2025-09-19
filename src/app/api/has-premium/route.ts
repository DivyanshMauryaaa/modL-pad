import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get authentication context (including the has() method for plan/feature checks)
    const { has } = await auth();

    // Check if the current user is subscribed to the desired Clerk Billing plan
    // (change 'premium' to your actual plan slug as configured in Clerk Billing dashboard)
    const isPremium = has({ plan: 'cplan_32gItPyAtBnw5enKsdP6Q745hjy' });

    return NextResponse.json({ isPremium });
  } catch (error) {
    console.error('Error checking premium status:', error);
    return NextResponse.json(
      { error: 'Failed to check premium status' },
      { status: 500 }
    );
  }
}
