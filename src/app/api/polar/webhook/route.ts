// app/api/webhooks/polar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// Types for Polar webhook events
interface PolarWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      user_id?: string;
      customer_id?: string;
      subscription_id?: string;
      product_id?: string;
      expires_at?: string;
      cancelled_at?: string;
      current_period_end?: string;
      [key: string]: any;
    };
  };
}

// Polar webhook event types
const POLAR_EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated', 
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_REACTIVATED: 'subscription.reactivated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated'
} as const;

// Plan status mappings
const PLAN_STATUS = {
  FREE: 'free',
  PRO: 'pro', 
  PREMIUM: 'premium',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due'
} as const;

// Verify webhook signature from Polar
function verifyPolarSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Polar typically sends signature as "sha256=<hash>"
    const actualSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Update user's plan in Clerk
async function updateUserPlan(
  userId: string, 
  planStatus: string, 
  subscriptionData?: any
) {
  try {
    const publicMetadata = {
      plan: planStatus,
      subscription: {
        id: subscriptionData?.id,
        status: subscriptionData?.status,
        current_period_end: subscriptionData?.current_period_end,
        cancelled_at: subscriptionData?.cancelled_at,
        expires_at: subscriptionData?.expires_at,
        updated_at: new Date().toISOString()
      }
    };

    await clerk.users.updateUser(userId, {
      publicMetadata
    });

    console.log(`Updated user ${userId} plan to: ${planStatus}`);
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error;
  }
}

// Get user ID from Polar customer data
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    // You might need to store the mapping between Polar customer ID and Clerk user ID
    // This could be in your database or you can use Clerk's external ID feature
    
    // Option 1: If you store Polar customer ID in Clerk's external ID
    const users = await clerk.users.getUserList({
      externalId: [customerId]
    });
    
    if (users.data && users.data.length > 0) {
      return users.data[0].id;
    }

    // Option 2: If you store it in private metadata
    const allUsers = await clerk.users.getUserList();
    const user = allUsers.data?.find(u => 
      u.privateMetadata?.polarCustomerId === customerId
    );
    
    return user?.id || null;
  } catch (error) {
    console.error('Error finding user by customer ID:', error);
    return null;
  }
}

// Determine plan status based on subscription status and product
function determinePlanStatus(subscription: any): string {
  const { status, product_id, cancelled_at, expires_at } = subscription;
  
  // Map your Polar product IDs to plan types
  const productPlanMap: Record<string, string> = {
    'acb750be-9698-4f05-9e15-6fbe9ba08ad2': PLAN_STATUS.PRO,
    'aff12387-edd6-488c-a06b-0f2019ed2618': PLAN_STATUS.PRO,
    'e8140a9f-cae7-406e-8235-1b4a242fc68d': PLAN_STATUS.PREMIUM,
    'ffb6cef3-a490-4a69-88c0-ca3cce07a4da': PLAN_STATUS.PREMIUM,
    // Add your actual Polar product IDs here
  };

  switch (status) {
    case 'active':
      return productPlanMap[product_id] || PLAN_STATUS.PRO;
    case 'cancelled':
      return PLAN_STATUS.CANCELLED;
    case 'expired':
    case 'past_due':
      return PLAN_STATUS.EXPIRED;
    case 'trialing':
      return productPlanMap[product_id] || PLAN_STATUS.PRO;
    default:
      return PLAN_STATUS.FREE;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('x-polar-signature') || 
                     headersList.get('polar-signature') || '';

    // Verify webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!verifyPolarSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: PolarWebhookEvent = JSON.parse(body);
    console.log(`Processing Polar webhook: ${event.type}`);

    const { type, data } = event;
    const subscription = data.object;

    // Find the Clerk user ID
    let userId: string | null = null;
    
    if (subscription.user_id) {
      // If Polar provides user_id directly
      userId = subscription.user_id;
    } else if (subscription.customer_id) {
      // Look up user by customer ID
      userId = await getUserIdFromCustomer(subscription.customer_id);
    }

    if (!userId) {
      console.error('Could not find user ID for subscription:', subscription.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle different webhook events
    switch (type) {
      case POLAR_EVENTS.SUBSCRIPTION_CREATED:
        const createdPlanStatus = determinePlanStatus(subscription);
        await updateUserPlan(userId, createdPlanStatus, subscription);
        break;

      case POLAR_EVENTS.SUBSCRIPTION_UPDATED:
        const updatedPlanStatus = determinePlanStatus(subscription);
        await updateUserPlan(userId, updatedPlanStatus, subscription);
        break;

      case POLAR_EVENTS.SUBSCRIPTION_CANCELLED:
        await updateUserPlan(userId, PLAN_STATUS.CANCELLED, subscription);
        break;

      case POLAR_EVENTS.SUBSCRIPTION_EXPIRED:
        await updateUserPlan(userId, PLAN_STATUS.FREE, subscription);
        break;

      case POLAR_EVENTS.SUBSCRIPTION_RENEWED:
        const renewedPlanStatus = determinePlanStatus(subscription);
        await updateUserPlan(userId, renewedPlanStatus, subscription);
        break;

      case POLAR_EVENTS.SUBSCRIPTION_REACTIVATED:
        const reactivatedPlanStatus = determinePlanStatus(subscription);
        await updateUserPlan(userId, reactivatedPlanStatus, subscription);
        break;

      case POLAR_EVENTS.PAYMENT_FAILED:
        // Handle failed payments - might want to set to past_due
        await updateUserPlan(userId, PLAN_STATUS.PAST_DUE, subscription);
        break;

      case POLAR_EVENTS.PAYMENT_SUCCEEDED:
        // Ensure user is marked as active when payment succeeds
        const activePlanStatus = determinePlanStatus(subscription);
        await updateUserPlan(userId, activePlanStatus, subscription);
        break;

      case POLAR_EVENTS.CUSTOMER_CREATED:
      case POLAR_EVENTS.CUSTOMER_UPDATED:
        // Handle customer events if needed
        console.log(`Customer event: ${type}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// GET method for webhook verification (if Polar requires it)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ message: 'Polar webhook endpoint' });
}