import Stripe from 'stripe';
import { Request, Response } from 'express';
import { storage } from './storage';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CreateSubscriptionRequest {
  tier: 'pro' | 'enterprise';
}

interface SubscriptionPrices {
  pro: string;
  enterprise: string;
}

// Real Stripe subscription prices - update with actual Price IDs from Stripe Dashboard
const SUBSCRIPTION_PRICES: SubscriptionPrices = {
  pro: 'price_1QN1234567890abcdef123', // $39.99 AUD/month - Replace with real Price ID
  enterprise: 'price_1QN9876543210fedcba456' // $2,999 AUD/month - Replace with real Price ID
};

// WARNING: These are placeholder Price IDs. 
// Create real prices in Stripe Dashboard:
// 1. Go to https://dashboard.stripe.com/products
// 2. Create Pro tier: $39.99 AUD recurring monthly
// 3. Create Enterprise tier: $2,999 AUD recurring monthly
// 4. Replace the price IDs above with real ones from Stripe

// Create or retrieve Stripe customer
export const getOrCreateCustomer = async (userId: number, email: string, username: string): Promise<string> => {
  const user = await storage.getUser(userId);
  
  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name: username,
      metadata: { userId: userId.toString() }
    });

    await storage.updateUserSubscription(userId, user?.subscriptionTier || 'free', customer.id);
    return customer.id;
  } catch (error: any) {
    console.error('Failed to create Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
};

// Create subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = req.user as any;
    const { tier } = req.body as CreateSubscriptionRequest;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user.id, user.email, user.username);

    // Create subscription with metadata for tracking
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: SUBSCRIPTION_PRICES[tier] }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id.toString(),
        tier: tier,
        created_by: 'EstiMate_Platform',
        created_date: new Date().toISOString()
      }
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Update user subscription in database
    await storage.updateUserSubscription(
      user.id,
      tier,
      customerId,
      subscription.id
    );

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status
    });
  } catch (error: any) {
    console.error('Subscription creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      message: error.message 
    });
  }
};

// Create payment intent for one-time payments
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amount, currency = 'aud' } = req.body;

    if (!amount || amount < 50) { // Minimum 50 cents
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
};

// Handle Stripe webhooks
export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        // Handle successful payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', failedInvoice.id);
        // Handle failed payment
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        
        // Update subscription status in database
        if (subscription.metadata?.userId) {
          const userId = parseInt(subscription.metadata.userId);
          const tier = subscription.status === 'active' ? 
            (subscription.items.data[0].price.id === SUBSCRIPTION_PRICES.enterprise ? 'enterprise' : 'pro') :
            'free';
          
          await storage.updateUserSubscription(
            userId,
            tier,
            subscription.customer as string,
            subscription.id
          );
        }
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', canceledSubscription.id);
        
        // Downgrade to free tier
        if (canceledSubscription.metadata?.userId) {
          const userId = parseInt(canceledSubscription.metadata.userId);
          await storage.updateUserSubscription(
            userId,
            'free',
            canceledSubscription.customer as string
          );
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Get customer billing portal
export const createBillingPortalSession = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = req.user as any;
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.headers.origin}/settings`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Billing portal creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create billing portal session',
      message: error.message 
    });
  }
};