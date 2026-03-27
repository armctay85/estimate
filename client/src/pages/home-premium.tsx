import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  PenTool, 
  Building2, 
  Calculator, 
  Camera,
  Upload,
  FileText,
  Shield,
  Zap,
  CheckCircle,
  Play,
  Star,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Box,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BIMUploadModal } from "@/components/BIMUploadModal";

// Animated counter component
function AnimatedCounter({ 
  value, 
  prefix = "", 
  suffix = "", 
  duration = 2 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className="number-display">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  badgeColor,
  index,
  onClick
}: { 
  icon: any; 
  title: string; 
  description: string;
  badge?: string;
  badgeColor?: string;
  index: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group card-premium p-6 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative"
      >
        <div className="flex items-start justify-between mb-4"
        >
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105"
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {badge && (
            <Badge className={badgeColor}>{badge}</Badge>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          {description}
        </p>
        
        <div className="flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1"
        >
          Get started <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

// Stats Section
function StatsSection() {
  const stats = [
    { value: 50000, suffix: "+", label: "Projects Estimated", icon: FileText },
    { value: 2.5, prefix: "$", suffix: "B+", label: "Total Value Managed", icon: TrendingUp },
    { value: 99, suffix: "%", label: "Accuracy Rate", icon: CheckCircle },
    { value: 500, suffix: "+", label: "Enterprise Clients", icon: Users },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="container-premium">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                <AnimatedCounter 
                  value={stat.value} 
                  prefix={stat.prefix} 
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Trust Logos
function TrustLogos() {
  const logos = [
    "BuildCorp", "Multiplex", "Lendlease", "Hutchinson", "Probuild", "Mirvac"
  ];

  return (
    <section className="py-16 border-y border-gray-200 dark:border-gray-800">
      <div className="container-premium">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          Trusted by leading construction companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60"
        >
          {logos.map((logo, index) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-xl font-bold text-gray-400 dark:text-gray-600"
            >
              {logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePremium() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showBIMModal, setShowBIMModal] = useState(false);

  const features = [
    {
      icon: PenTool,
      title: "Floor Plan Sketch",
      description: "Draw rooms and assign materials with our intuitive sketch tool. Get instant measurements and cost estimates.",
      badge: "Free",
      badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      onClick: () => navigate("/sketch")
    },
    {
      icon: Building2,
      title: "BIM Auto-Takeoff",
      description: "Upload CAD and BIM files for automatic quantity extraction. Supports Revit, IFC, and DWG formats.",
      badge: "Enterprise",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      onClick: () => setShowBIMModal(true)
    },
    {
      icon: Calculator,
      title: "AI Cost Predictor",
      description: "Machine learning-powered cost predictions based on 50,000+ historical projects across Australia.",
      badge: "Pro",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      onClick: () => toast({ title: "Coming Soon", description: "AI Cost Predictor launching Q2 2025" })
    },
    {
      icon: Camera,
      title: "Photo Renovation AI",
      description: "Upload photos of existing structures and get instant renovation cost estimates with material recommendations.",
      badge: "Pro",
      badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      onClick: () => toast({ title: "Coming Soon", description: "Photo AI launching Q2 2025" })
    },
  ];

  const highlights = [
    "Australian cost database with 200+ materials",
    "AIQS-compliant quantity surveying standards",
    "Real-time collaboration and sharing",
    "Export to Excel, PDF, and CSV formats",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950"
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800"
      >
        <div className="container-premium"
        >
          <div className="flex items-center justify-between h-16"
          >
            <div className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Estimate</span>
            </div>

            <div className="hidden md:flex items-center gap-1"
            >
              <button onClick={() => navigate("/projects")} className="nav-link">Projects</button>
              <button onClick={() => navigate("/reports")} className="nav-link">Reports</button>
              <button onClick={() => navigate("/settings")} className="nav-link">Settings</button>
            </div>

            <div className="flex items-center gap-3"
            >
              <button 
                onClick={() => navigate("/projects")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign In
              </button>
              <button className="btn-primary text-sm">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero dark:bg-gradient-hero-dark relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-50" />
        
        <div className="container-premium relative"
        >
          <div className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
                Now with AI-powered BIM processing
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              Professional cost estimation{" "}
              <span className="text-gradient">powered by AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              Upload plans, get instant estimates. The complete quantity surveying 
              platform for Australian construction professionals.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <button 
                onClick={() => navigate("/sketch")}
                className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
              >
                Start Free Estimate
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button 
                onClick={() => setShowBIMModal(true)}
                className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400"
            >
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="card-elevated p-2 md:p-4 max-w-5xl mx-auto"
            >
              <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative"
              >
                {/* Mock UI */}
                <div className="absolute inset-0 flex"
                >
                  {/* Sidebar */}
                  <div className="w-16 md:w-64 bg-gray-800 border-r border-gray-700 p-4 hidden sm:block"
                  >
                    <div className="flex items-center gap-3 mb-6"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg" />
                      <span className="font-semibold text-white hidden md:block">Project Alpha</span>
                    </div>
                    <div className="space-y-2"
                    >
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-8 bg-gray-700 rounded-lg" />
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4 md:p-8"
                  >
                    <div className="flex items-center justify-between mb-8"
                    >
                      <div className="h-8 w-48 bg-gray-700 rounded-lg" />
                      <div className="flex gap-2"
                      >
                        <div className="h-8 w-24 bg-blue-600 rounded-lg" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-24 bg-gray-800 rounded-xl p-4"
                        >
                          <div className="h-4 w-16 bg-gray-600 rounded mb-2" />
                          <div className="h-8 w-24 bg-gray-700 rounded" />
                        </div>
                      ))}
                    </div>

                    <div className="h-64 bg-gray-800 rounded-xl" />
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -right-4 top-1/4 card-premium p-4 shadow-2xl hidden lg:block"
                >
                  <div className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimate Complete</p>
                      <p className="text-xs text-gray-500">$1.32M total value</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Trust Logos */}
      <TrustLogos />

      {/* Features Section */}
      <section className="py-24"
      >
        <div className="container-premium"
        >
          <div className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Everything you need to estimate smarter
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              From floor plan sketches to BIM processing, our platform handles 
              the entire estimation workflow.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* BIM Showcase Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50"
      >
        <div className="container-premium"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                Enterprise Feature
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                AI-powered BIM processing
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6"
              >
                Upload your Revit, IFC, or DWG files and let our AI extract quantities 
                automatically. Reduce takeoff time by up to 80%.
              </p>
              <ul className="space-y-3 mb-8"
              >
                {[
                  "Automatic element detection and classification",
                  "Smart quantity extraction with 95%+ accuracy",
                  "Direct integration with Australian cost databases",
                  "Export to Excel, PDF, and proprietary formats"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setShowBIMModal(true)}
                className="btn-primary"
              >
                Try BIM Processing
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="card-elevated p-4"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl relative overflow-hidden"
                >
                  {/* 3D Model Preview */}
                  <div className="absolute inset-0 flex items-center justify-center"
                  >
                    <Box className="w-32 h-32 text-blue-500/30 animate-float" />
                  </div>
                  
                  {/* Floating Stats */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-4 left-4 card-glass p-3"
                  >
                    <p className="text-xs text-gray-500">Elements Detected</p>
                    <p className="text-lg font-bold number-display">2,847</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute bottom-4 right-4 card-glass p-3"
                  >
                    <p className="text-xs text-gray-500">Est. Value</p>
                    <p className="text-lg font-bold number-display text-green-600">$1.32M</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24"
      >
        <div className="container-premium"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-elevated bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-center text-white overflow-hidden relative"
          >
            {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10"
              >
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"
                >
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"
                  >
                    <circle cx="1" cy="1" r="1" fill="currentColor" />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

            <div className="relative"
            >
              <h2 className="text-4xl font-bold mb-4"
              >Ready to transform your estimates?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
              >
                Join thousands of quantity surveyors and construction professionals 
                who trust Estimate for their cost planning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button 
                  onClick={() => navigate("/sketch")}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full sm:w-auto"
                >
                  Start Free Trial
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors w-full sm:w-auto"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800"
      >
        <div className="container-premium"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Estimate</span>
            </div>

            <p className="text-sm text-gray-500"
            >
              © 2025 Estimate Platform. All rights reserved.
            </p>

            <div className="flex items-center gap-6"
            >
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* BIM Upload Modal */}
      <BIMUploadModal
        isOpen={showBIMModal}
        onClose={() => setShowBIMModal(false)}
        onUploadSuccess={(urn) => {
          toast({
            title: "Upload Successful",
            description: "Your BIM file is being processed.",
          });
          setShowBIMModal(false);
          navigate("/projects");
        }}
      />
    </div>
  );
}
