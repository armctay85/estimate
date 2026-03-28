import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Upload, Calculator, FileText, ArrowRight } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EstiMate',
    description: 'The construction cost platform built on real Australian tender data. Let\'s get you started.',
    icon: <Calculator className="w-8 h-8" />,
  },
  {
    id: 'database',
    title: 'Explore the Cost Database',
    description: 'Access 680+ benchmark rates from real tenders including Kmart Gladstone ($2.05M project).',
    icon: <FileText className="w-8 h-8" />,
  },
  {
    id: 'takeoff',
    title: 'Try PDF Takeoff',
    description: 'Upload architectural drawings and calculate quantities automatically.',
    icon: <Upload className="w-8 h-8" />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set',
    description: 'Start creating estimates or validate your first contractor quote.',
    icon: <CheckCircle className="w-8 h-8" />,
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStep ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                initial={false}
                animate={{
                  backgroundColor: index <= currentStep ? '#F97316' : '#E5E7EB',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative h-64">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 mb-6"
                >
                  {step.icon}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold mb-3"
                >
                  {step.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-400 max-w-sm"
                >
                  {step.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-500"
            >
              Skip
            </Button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
