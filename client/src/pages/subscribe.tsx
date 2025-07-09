import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Crown, Check, X } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = ({ tier }: { tier: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful",
        description: `You are now subscribed to the ${tier} plan!`,
      });
      setLocation("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe}>
        {tier === 'pro' ? 'Subscribe to Pro - $9.99/month' : 'Subscribe to Premium - $19.99/month'}
      </Button>
    </form>
  );
};

const CheckoutWrapper = ({ tier }: { tier: string }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stripePromise) {
      setError("Payment processing is not configured. Please contact support.");
      return;
    }

    apiRequest("POST", "/api/create-subscription", { tier })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || "Failed to setup payment");
        }
      })
      .catch((error) => {
        setError(error.message || "Failed to create subscription");
      });
  }, [tier]);

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">Stripe payment processing needs to be configured by the administrator.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise!} options={{ clientSecret }}>
      <SubscribeForm tier={tier} />
    </Elements>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      tier: "free",
      current: user.subscriptionTier === "free",
      features: [
        "Up to 3 projects/month",
        "Basic material list",
        "Simple cost calculations",
        "Community support"
      ],
      limitations: []
    },
    {
      name: "Pro",
      price: "$9.99",
      tier: "pro",
      current: user.subscriptionTier === "pro",
      popular: true,
      features: [
        "Unlimited projects",
        "Advanced materials database",
        "Basic cost reports",
        "Email support",
        "Project sharing"
      ],
      limitations: []
    },
    {
      name: "Premium",
      price: "$19.99",
      tier: "premium",
      current: user.subscriptionTier === "premium",
      features: [
        "Everything in Pro",
        "PDF/CSV exports",
        "Detailed cost comparisons",
        "Priority support",
        "API access"
      ],
      limitations: []
    }
  ];

  if (selectedTier) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscribe to {selectedTier === 'pro' ? 'Pro' : 'Premium'}
            </h1>
            <p className="text-gray-600">
              Complete your payment to upgrade your account
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Payment Details
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <CheckoutWrapper tier={selectedTier} />
              
              <div className="mt-6 text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedTier(null)}
                >
                  ← Back to plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Unlock the full potential of BuildCost Sketch</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.tier}
              className={`relative ${plan.popular ? 'border-2 border-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {plan.current ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.tier === "free" ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation("/")}
                  >
                    Continue with Free
                  </Button>
                ) : (
                  <Button 
                    variant={plan.popular ? "default" : "outline"}
                    className={`w-full ${plan.popular ? 'bg-primary hover:bg-blue-700' : ''}`}
                    onClick={() => setSelectedTier(plan.tier)}
                  >
                    {plan.tier === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Premium'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Feature Comparison</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Feature</th>
                      <th className="text-center py-2">Free</th>
                      <th className="text-center py-2">Pro</th>
                      <th className="text-center py-2">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="py-2">Projects per month</td>
                      <td className="text-center">3</td>
                      <td className="text-center">Unlimited</td>
                      <td className="text-center">Unlimited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Material database</td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">PDF Export</td>
                      <td className="text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">CSV Export</td>
                      <td className="text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-2">Priority support</td>
                      <td className="text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
