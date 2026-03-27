import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface TrustScoreDisplayProps {
  score: number;
  verdict: string;
  totalQuote: number;
  marketEstimate: number;
  variance: number;
}

export function TrustScoreDisplay({ 
  score, 
  verdict, 
  totalQuote, 
  marketEstimate, 
  variance 
}: TrustScoreDisplayProps) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-600';
    if (s >= 70) return 'text-amber-500';
    if (s >= 50) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-green-50 border-green-200';
    if (s >= 70) return 'bg-amber-50 border-amber-200';
    if (s >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreIcon = (s: number) => {
    if (s >= 90) return <ShieldCheck className="w-8 h-8 text-green-600" />;
    if (s >= 70) return <AlertTriangle className="w-8 h-8 text-amber-500" />;
    if (s >= 50) return <AlertCircle className="w-8 h-8 text-orange-500" />;
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  const getVerdictDescription = (s: number) => {
    if (s >= 90) return 'This quote appears fair and reasonable. You can proceed with confidence.';
    if (s >= 70) return 'Some items are above market rates. Consider negotiating the highlighted items.';
    if (s >= 50) return 'Significant concerns detected. Get a second quote before proceeding.';
    return 'Major red flags. This quote is likely inflated. Demand a breakdown or seek alternatives.';
  };

  const getScoreRingColor = (s: number) => {
    if (s >= 90) return 'stroke-green-500';
    if (s >= 70) return 'stroke-amber-500';
    if (s >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  // Calculate SVG circle properties for score ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className={cn("border-2", getScoreBg(score))}>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <svg width="160" height="160" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200"
              />
              {/* Score circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn("transition-all duration-1000 ease-out", getScoreRingColor(score))}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-bold", getScoreColor(score))}>
                {score}
              </span>
              <span className="text-xs text-gray-500 mt-1">TRUST SCORE</span>
            </div>
          </div>

          {/* Verdict Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              {getScoreIcon(score)}
              <div>
                <h3 className={cn("text-xl font-bold", getScoreColor(score))}>
                  {verdict}
                </h3>
                <p className="text-sm text-gray-600">
                  {getVerdictDescription(score)}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500 uppercase">Quote Total</p>
                <p className="text-lg font-semibold">
                  ${totalQuote.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Market Estimate</p>
                <p className="text-lg font-semibold">
                  ${marketEstimate.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Variance</p>
                <div className="flex items-center gap-1">
                  {variance > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : variance < 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <p className={cn(
                    "text-lg font-semibold",
                    variance > 5 ? "text-red-600" : variance < -5 ? "text-green-600" : "text-gray-600"
                  )}>
                    {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
