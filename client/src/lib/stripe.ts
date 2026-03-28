import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from './queryClient';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus' | 'enterprise';

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    estimatesPerMonth: number;
    projects: number;
    teamMembers: number;
    storageGB: number;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      '3 estimates per month',
      'Basic cost database',
      'PDF takeoffs',
      'Single user',
    ],
    limits: {
      estimatesPerMonth: 3,
      projects: 1,
      teamMembers: 1,
      storageGB: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited estimates',
      'Full cost database (680+ rates)',
      'Quote validator',
      'Tender analyzer',
      'Priority support',
    ],
    limits: {
      estimatesPerMonth: -1,
      projects: 10,
      teamMembers: 1,
      storageGB: 10,
    },
  },
  {
    id: 'pro_plus',
    name: 'Pro+',
    price: 199,
    priceId: import.meta.env.VITE_STRIPE_PRO_PLUS_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'Team collaboration (5 members)',
      'Custom benchmarks',
      'API access',
      'Advanced analytics',
    ],
    limits: {
      estimatesPerMonth: -1,
      projects: -1,
      teamMembers: 5,
      storageGB: 100,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1499,
    priceId: '', // Custom pricing
    features: [
      'Everything in Pro+',
      'Unlimited team members',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: {
      estimatesPerMonth: -1,
      projects: -1,
      teamMembers: -1,
      storageGB: -1,
    },
  },
];

export async function createCheckoutSession(priceId: string, tier: SubscriptionTier) {
  const response = await apiRequest('POST', '/api/payments/checkout', { priceId, tier });
  return response.json();
}

export async function createBillingPortalSession() {
  const response = await apiRequest('POST', '/api/payments/billing-portal', {});
  return response.json();
}

export async function getSubscriptionStatus() {
  const response = await apiRequest('GET', '/api/payments/subscription', undefined);
  return response.json();
}

export function getPlanById(id: SubscriptionTier): PricingPlan {
  return PRICING_PLANS.find(plan => plan.id === id) || PRICING_PLANS[0];
}

export function canCreateEstimate(currentTier: SubscriptionTier, estimateCount: number): boolean {
  const plan = getPlanById(currentTier);
  if (plan.limits.estimatesPerMonth === -1) return true;
  return estimateCount < plan.limits.estimatesPerMonth;
}
