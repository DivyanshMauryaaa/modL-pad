import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Debug endpoint to check user's current metadata
// This helps troubleshoot subscription status issues

export async function POST(req: NextRequest) {
  try {
    const authContext = await auth();
    const userId = authContext?.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user metadata from session claims
    const publicMetadata = authContext?.sessionClaims?.publicMetadata as any;
    const privateMetadata = authContext?.sessionClaims?.privateMetadata as any;
    
    console.log(`Debug metadata for user ${userId}:`, {
      publicMetadata,
      privateMetadata,
      userId
    });

    return NextResponse.json({ 
      userId,
      publicMetadata,
      privateMetadata,
      isPremium: Boolean(publicMetadata?.isPremium),
      userPlan: publicMetadata?.user_plan || 'free',
      subscriptionStatus: publicMetadata?.subscription_status,
      currentPeriodEnd: publicMetadata?.current_period_end,
      lastUpdated: publicMetadata?.last_updated
    });
  } catch (error) {
    console.error('Debug metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to get user metadata' },
      { status: 500 }
    );
  }
}
