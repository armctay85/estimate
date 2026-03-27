import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustScoreGaugeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showDetails?: boolean;
  confidenceFactors?: {
    name: string;
    score: number;
    description: string;
  }[];
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 8, fontSize: "1.25rem" },
  md: { width: 120, strokeWidth: 10, fontSize: "1.75rem" },
  lg: { width: 160, strokeWidth: 12, fontSize: "2.25rem" },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return { color: "#10B981", label: "Excellent", icon: ShieldCheck };
  if (score >= 75) return { color: "#3B82F6", label: "Good", icon: Shield };
  if (score >= 60) return { color: "#F59E0B", label: "Fair", icon: Shield };
  if (score >= 40) return { color: "#F97316", label: "Low", icon: ShieldAlert };
  return { color: "#EF4444", label: "Poor", icon: ShieldAlert };
};

export function TrustScoreGauge({
  score,
  size = "md",
  showLabel = true,
  showDetails = false,
  confidenceFactors = [],
}: TrustScoreGaugeProps) {
  const { width, strokeWidth, fontSize } = sizeConfig[size];
  const { color, label, icon: Icon } = getScoreColor(score);
  
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        {/* Background Circle */}
        <svg
          width={width}
          height={width}
          className="transform -rotate-90"
        >
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-700"
          />
          
          {/* Animated Progress Circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="font-bold text-gray-900 dark:text-white number-display"
            style={{ fontSize }}
          >
            {score}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            /100
          </motion.span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 mt-3"
        >
          <Icon 
            className="w-5 h-5" 
            style={{ color }}
          />
          <span 
            className="font-semibold"
            style={{ color }}
          >
            {label} Confidence
          </span>
          
          {confidenceFactors.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-2">Confidence Factors:</p>
                  <ul className="space-y-1 text-sm">
                    {confidenceFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-4">
                        <span>{factor.name}</span>
                        <span className="font-medium">{factor.score}%</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </motion.div>
      )}

      {/* Details Panel */}
      {showDetails && confidenceFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 1 }}
          className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
        >
          <div className="space-y-3">
            {confidenceFactors.map((factor, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + idx * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {factor.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {factor.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ delay: 1.2 + idx * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: factor.score >= 80 ? '#10B981' : 
                                        factor.score >= 60 ? '#3B82F6' : '#F59E0B'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                    {factor.score}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for inline use
export function TrustScoreBadge({ score }: { score: number }) {
  const { color, label } = getScoreColor(score);
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: `${color}15`,
        color: color
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      {score}% {label}
    </div>
  );
}
