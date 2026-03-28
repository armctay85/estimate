import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Calculator, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  type: 'estimates' | 'projects' | 'quotes' | 'takeoff' | 'database';
  onAction?: () => void;
}

const emptyStates = {
  estimates: {
    icon: Calculator,
    title: 'No estimates yet',
    description: 'Create your first construction cost estimate using our elemental database or PDF takeoff tools.',
    actionLabel: 'Create Estimate',
    gradient: 'from-orange-400 to-red-500',
  },
  projects: {
    icon: FileText,
    title: 'No projects yet',
    description: 'Organize your estimates into projects. Track multiple tenders and compare bids easily.',
    actionLabel: 'Create Project',
    gradient: 'from-blue-400 to-indigo-500',
  },
  quotes: {
    icon: Sparkles,
    title: 'No quotes validated yet',
    description: 'Upload contractor quotes and get instant trust scores with benchmark comparisons.',
    actionLabel: 'Validate Quote',
    gradient: 'from-green-400 to-emerald-500',
  },
  takeoff: {
    icon: Upload,
    title: 'Upload your first drawing',
    description: 'Upload architectural PDFs and calculate quantities automatically with our takeoff tools.',
    actionLabel: 'Upload PDF',
    gradient: 'from-purple-400 to-pink-500',
  },
  database: {
    icon: Calculator,
    title: 'Browse the cost database',
    description: 'Access 680+ benchmark rates from real Australian tenders. Filter by region, building type, and quality.',
    actionLabel: 'Explore Database',
    gradient: 'from-cyan-400 to-blue-500',
  },
};

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = emptyStates[type];
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated icon container */}
      <motion.div
        className={`relative w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br ${config.gradient} p-[2px]`}
        animate={{
          scale: isHovered ? 1.05 : 1,
          rotate: isHovered ? 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
          <motion.div
            animate={{
              y: isHovered ? -4 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Icon className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </div>

        {/* Floating particles */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"
          animate={{
            y: [0, -8, 0],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"
          animate={{
            y: [0, 6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Text content */}
      <motion.h3
        className="text-xl font-semibold mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {config.title}
      </motion.h3>

      <motion.p
        className="text-gray-600 dark:text-gray-400 max-w-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {config.description}
      </motion.p>

      {/* Action button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onAction}
          className={`bg-gradient-to-r ${config.gradient} text-white border-0`}
        >
          {config.actionLabel}
        </Button>
      </motion.div>

      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, ${type === 'estimates' ? 'rgba(249, 115, 22, 0.03)' : 'rgba(59, 130, 246, 0.03)'} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
}
