import React, { useState, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Users, 
  BookOpen, 
  CheckCircle,
  Clock,
  Award,
  MessageCircle,
  Shield,
  Calendar,
  Search,
  Video,
  TrendingUp,
  Wallet,
  UserCheck,
  BarChart3,
  ArrowUp,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import MountainScene from '../../components/ui/MountainScene';
import FeatureSection from '../../components/ui/FeatureSection';
import { FeatureSteps } from '../../components/ui/FeatureSteps';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Feature Card Component - Frosted Glass
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    className="relative p-6 rounded-2xl transition-all duration-300 group overflow-hidden
               bg-white/70 backdrop-blur-md border border-white/60 shadow-lg shadow-slate-200/50
               hover:bg-white/80 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-200/50"
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
  >
    {/* Glass shimmer effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Benefit Item Component
const BenefitItem = ({ icon: Icon, text }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-emerald-600" />
    </div>
    <span className="text-slate-700">{text}</span>
  </div>
);

// Step Card Component - Frosted Glass
const StepCard = ({ number, title, description, icon: Icon, color, isDarkMode }) => (
  <motion.div
    className={`relative text-center p-6 rounded-2xl transition-all duration-300 group overflow-hidden backdrop-blur-md border shadow-lg
               ${isDarkMode 
                 ? 'bg-slate-800/50 border-slate-700/50 shadow-slate-900/50 hover:bg-slate-800/70' 
                 : 'bg-white/70 border-white/60 shadow-slate-200/50 hover:bg-white/80 hover:shadow-cyan-500/10'}`}
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
  >
    {/* Glass shimmer */}
    <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-slate-700/30' : 'from-white/50'} via-transparent to-transparent opacity-50 pointer-events-none`} />
    
    <div className="relative z-10">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="text-xs font-semibold text-cyan-500 mb-2 tracking-wide">STEP {number}</div>
      <h3 className={`text-lg font-semibold mb-2 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-sm transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </div>
  </motion.div>
);

export default function Landing() {
  const [activeTab, setActiveTab] = useState('student');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Theme toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const valueProps = [
    {
      icon: UserCheck,
      title: 'Verified Educators',
      description: 'Every teacher on our platform is verified for qualifications and teaching experience.',
      gradientFrom: '#22d3ee',
      gradientTo: '#0891b2'
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Book lessons at times that work for you, with easy rescheduling options.',
      gradientFrom: '#3b82f6',
      gradientTo: '#1d4ed8'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Safe payments, verified profiles, and a trusted learning environment.',
      gradientFrom: '#8b5cf6',
      gradientTo: '#6d28d9'
    },
    {
      icon: MessageCircle,
      title: 'Direct Communication',
      description: 'Message teachers directly to discuss your learning goals before booking.',
      gradientFrom: '#06b6d4',
      gradientTo: '#0284c7'
    }
  ];

  const studentFeatures = [
    {
      step: "Step 1",
      title: "Browse Qualified Teachers",
      content: "Search through verified educators by subject, expertise, and ratings to find your perfect match.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
    },
    {
      step: "Step 2",
      title: "Book Personalized Sessions",
      content: "Schedule 1-on-1 lessons at times that work for you with flexible booking options.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop"
    },
    {
      step: "Step 3",
      title: "Learn at Your Pace",
      content: "Enjoy customized learning experiences tailored to your goals and learning style.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop"
    },
    {
      step: "Step 4",
      title: "Track Your Progress",
      content: "Monitor your growth, view upcoming sessions, and celebrate your achievements.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
    },
    {
      step: "Step 5",
      title: "Secure & Easy Payments",
      content: "Pay securely with instant booking confirmation and transparent pricing.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop"
    }
  ];

  const teacherFeatures = [
    {
      step: "Step 1",
      title: "Set Your Own Rates",
      content: "Choose your hourly rates and earn what you deserve for your expertise.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop"
    },
    {
      step: "Step 2",
      title: "Reach Eager Students",
      content: "Connect with students actively looking for your subject expertise.",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
    },
    {
      step: "Step 3",
      title: "Manage Your Schedule",
      content: "Use our intuitive dashboard to manage bookings and availability effortlessly.",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop"
    },
    {
      step: "Step 4",
      title: "Build Your Reputation",
      content: "Grow your teaching profile with reviews and showcase your credentials.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
    },
    {
      step: "Step 5",
      title: "Receive Secure Payments",
      content: "Get paid securely and on time for every session you conduct.",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop"
    }
  ];

  const studentSteps = [
    { number: 1, title: 'Find Your Teacher', description: 'Browse teachers by subject, read profiles, and find the perfect match for your learning needs.', icon: Search, color: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { number: 2, title: 'Book a Session', description: 'Choose an available time slot and complete secure payment to confirm your booking.', icon: Calendar, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { number: 3, title: 'Start Learning', description: 'Join your scheduled session and begin your personalized learning journey.', icon: Video, color: 'bg-gradient-to-br from-indigo-500 to-violet-600' }
  ];

  const teacherSteps = [
    { number: 1, title: 'Create Your Profile', description: 'Sign up and build your teaching profile showcasing your expertise and experience.', icon: UserCheck, color: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { number: 2, title: 'Set Your Schedule', description: 'Define your availability and set your hourly rates for different subjects.', icon: Clock, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { number: 3, title: 'Start Teaching', description: 'Accept bookings from students and conduct engaging 1-on-1 sessions.', icon: Award, color: 'bg-gradient-to-br from-indigo-500 to-violet-600' }
  ];

  // Theme classes
  const theme = {
    // Backgrounds
    pageBg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    sectionBg: isDarkMode ? 'bg-slate-900' : 'bg-slate-50',
    sectionBgAlt: isDarkMode ? 'bg-slate-950' : 'bg-white',
    cardBg: isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/70 border-white/60',
    
    // Text
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    subheading: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    
    // Accents
    badgeBg: isDarkMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-500/10 border-cyan-200/50 text-cyan-700',
    badgeBgAlt: isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-500/10 border-indigo-200/50 text-indigo-700',
    
    // Interactive
    tabBg: isDarkMode ? 'bg-slate-800/60 border-slate-700/40' : 'bg-white/60 border-white/40',
    tabActive: isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-900 border-slate-100',
    tabInactive: isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
    
    // Decorative orbs
    orb1: isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-400/10',
    orb2: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/10',
    orb3: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-400/10',
  };

  return (
    <div className={`min-h-screen ${theme.pageBg} transition-colors duration-500`}>
      {/* Theme Toggle Button */}
      <motion.button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/80 border-slate-700 text-yellow-400 hover:bg-slate-700' 
            : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        aria-label="Toggle theme"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDarkMode ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.div>
      </motion.button>

      {/* Hero Section - Always Dark */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1424] to-[#0f172a]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/30 via-transparent to-indigo-950/20"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-1/3 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Three.js Particle Mountains */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] opacity-50">
          <Suspense fallback={null}>
            <MountainScene color="#22d3ee" secondaryColor="#6366f1" />
          </Suspense>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0a0f1a]/80 to-transparent"></div>

        <div className="relative z-10 w-full pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mb-8">
              <img src="/Yuvsiksha_logo.png" alt="Yuvsiksha" className="w-20 h-20 mx-auto rounded-2xl shadow-2xl shadow-cyan-500/20" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-cyan-100 text-sm font-medium border border-white/10">
                <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                Connecting students with expert educators
              </span>
            </motion.div>

            <motion.h1 className="mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              Learn from the best,{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">achieve your goals</span>
            </motion.h1>

            <motion.p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              Yuvsiksha connects students with qualified tutors for personalized 1-on-1 lessons. Book instantly and learn at your own pace.
            </motion.p>

            <motion.div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Link to="/signup" className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30">
                <BookOpen className="w-5 h-5 mr-2" />
                Find a Tutor
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/signup" className="group inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300">
                <Users className="w-5 h-5 mr-2" />
                Become a Tutor
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div className="mt-16 flex flex-col items-center text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}>
              <span className="text-sm mb-3 hidden sm:block">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-slate-500/50 rounded-full flex justify-center">
                <div className="w-1.5 h-3 bg-cyan-400/70 rounded-full mt-2 animate-bounce"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className={`relative py-20 px-4 sm:px-6 lg:px-8 ${theme.sectionBg} overflow-hidden transition-colors duration-500`}>
        <div className={`absolute top-10 left-10 w-32 h-32 ${theme.orb1} rounded-full blur-2xl`} />
        <div className={`absolute bottom-10 right-10 w-40 h-40 ${theme.orb2} rounded-full blur-2xl`} />
        <div className={`absolute top-1/2 left-1/4 w-24 h-24 ${theme.orb3} rounded-full blur-xl`} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className={`text-3xl md:text-4xl font-bold ${theme.heading} mb-4 transition-colors duration-500`}>Why choose Yuvsiksha?</h2>
            <p className={`text-lg ${theme.subheading} max-w-2xl mx-auto transition-colors duration-500`}>A trusted platform designed for meaningful learning experiences</p>
          </motion.div>
          <FeatureSection features={valueProps} isDarkMode={isDarkMode} />
        </div>
      </section>

      {/* For Students Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 ${theme.sectionBgAlt} overflow-hidden transition-colors duration-500`}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-1.5 ${theme.badgeBg} text-sm font-semibold rounded-full border transition-colors duration-500`}>For Students</span>
          </div>
          <FeatureSteps features={studentFeatures} title="Find the Perfect Tutor for Your Journey" autoPlayInterval={4000} isDarkMode={isDarkMode} />
          <div className="text-center mt-8">
            <Link to="/signup" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5">
              Get Started as Student
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* For Teachers Section */}
      <section className={`relative py-20 px-4 sm:px-6 lg:px-8 ${theme.sectionBg} overflow-hidden transition-colors duration-500`}>
        <div className={`absolute top-20 right-20 w-48 h-48 ${theme.orb3} rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 left-10 w-32 h-32 ${theme.orb3} rounded-full blur-2xl`} />
        
        <motion.div className="relative z-10" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-1.5 ${theme.badgeBgAlt} text-sm font-semibold rounded-full border transition-colors duration-500`}>For Teachers</span>
          </div>
          <FeatureSteps features={teacherFeatures} title="Grow Your Teaching Practice" autoPlayInterval={4000} isDarkMode={isDarkMode} />
          <div className="text-center mt-8">
            <Link to="/signup" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
              Start Teaching Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className={`relative py-20 px-4 sm:px-6 lg:px-8 ${theme.sectionBgAlt} overflow-hidden transition-colors duration-500`}>
        <div className={`absolute top-1/4 right-0 w-64 h-64 ${theme.orb1} rounded-full blur-3xl`} />
        <div className={`absolute bottom-1/4 left-0 w-48 h-48 ${theme.orb2} rounded-full blur-2xl`} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className={`text-3xl md:text-4xl font-bold ${theme.heading} mb-4 transition-colors duration-500`}>How it works</h2>
            <p className={`text-lg ${theme.subheading} max-w-2xl mx-auto mb-8 transition-colors duration-500`}>Get started in just a few simple steps</p>

            <div className={`inline-flex ${theme.tabBg} backdrop-blur-md rounded-xl p-1.5 border shadow-lg transition-colors duration-500`}>
              <button onClick={() => setActiveTab('student')} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'student' ? theme.tabActive : theme.tabInactive}`}>
                For Students
              </button>
              <button onClick={() => setActiveTab('teacher')} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'teacher' ? theme.tabActive : theme.tabInactive}`}>
                For Teachers
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(activeTab === 'student' ? studentSteps : teacherSteps).map((step, index) => (
                <StepCard key={index} {...step} isDarkMode={isDarkMode} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section - Always Dark */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&h=600&fit=crop" alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/50 via-transparent to-slate-900/40" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">Ready to get started?</h2>
              <p className="text-base md:text-lg text-slate-300 leading-relaxed">Join Yuvsiksha today and take the next step in your learning or teaching journey. Connect with qualified educators or share your expertise.</p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-3 md:justify-end" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-all duration-200">
                Find a Tutor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3.5 bg-transparent border border-slate-500 text-white font-semibold rounded-lg hover:bg-white/10 hover:border-slate-400 transition-all duration-200">
                Become a Tutor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Always Dark */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/Yuvsiksha_logo.png" alt="Yuvsiksha" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold text-white">Yuvsiksha</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy-policy" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <a href="mailto:yuvsiksha@gmail.com" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact Us</a>
              <Link to="/login" className="text-slate-400 hover:text-cyan-400 transition-colors">Sign In</Link>
              <Link to="/signup" className="text-slate-400 hover:text-cyan-400 transition-colors">Get Started</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Yuvsiksha. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button onClick={scrollToTop} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} className="fixed bottom-8 right-8 p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2" aria-label="Scroll to top">
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
