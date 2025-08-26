import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Star,
  Play,
  CheckCircle,
  Clock,
  Award,
  MessageCircle,
  Zap,
  TrendingUp,
  Shield,
  Heart,
  ArrowUp // Added import for the new icon
} from 'lucide-react';
 
// Custom hook for counting animation
const useCountUp = (end, duration = 2000, delay = 0) => {
  const [count, setCount] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);
 
  React.useEffect(() => {
    if (!hasStarted) return;
 
    let startTime;
    let animationFrame;
 
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp + delay;
      if (timestamp < startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
 
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const newCount = Math.floor(easeOutCubic * end);
      setCount(newCount);
 
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end); // Ensure we end exactly at the target
      }
    };
 
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, delay, hasStarted]);
 
  const startCounting = () => setHasStarted(true);
 
  return [count, startCounting, hasStarted];
};
 
// Intersection Observer hook for triggering animations when in view
const useInView = (threshold = 0.1) => {
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef();
 
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );
 
    if (ref.current) {
      observer.observe(ref.current);
    }
 
    return () => observer.disconnect();
  }, [threshold]);
 
  return [ref, inView];
};
 
// Animation variants for sta                Join thousand              Join Yuvshiksha today and connect with expert tutors who will help you achieve your academic goals. of students and teachers who have found success with Yuvshikshagered appearance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
 
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
 
// Hero Stats Component with counting animation
const StatCard = ({ number, label, delay, textColor = "text-slate-800" }) => {
  // Extract numeric value from string (e.g., "15,000+" -> 15000)
  const numericValue = parseInt(number.replace(/[^\d]/g, ''));
  const [count, startCounting, hasStarted] = useCountUp(numericValue, 2000, delay * 200);
  const [ref, inView] = useInView(0.8);
  
  React.useEffect(() => {
    if (inView && !hasStarted) {
      // Add a small delay for each stat to create a staggered effect
      setTimeout(() => startCounting(), delay * 150);
    }
  }, [inView, hasStarted, startCounting, delay]);
  
  // Format the count back to display format
  const formatCount = (value) => {
    if (number.includes('+')) {
      if (value >= 1000) {
        const thousands = Math.floor(value / 1000);
        const remainder = value % 1000;
        if (remainder === 0) {
          return `${thousands}k+`;
        } else {
          return `${thousands}.${Math.floor(remainder / 100)}k+`;
        }
      }
      return `${value}+`;
    }
    return value.toLocaleString();
  };
 
  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.5, duration: 0.6 }}
    >
      <div className={`text-2xl sm:text-3xl font-bold ${textColor} mb-1 tabular-nums`}>
        {formatCount(count)}
      </div>
      <div className={`text-xs sm:text-sm ${textColor === "text-white" ? "text-white/80" : "text-slate-600"} font-medium`}>
        {label}
      </div>
    </motion.div>
  );
};
 
// Feature Card Component
const FeatureCard = ({ icon, title, description, delay, className = "" }) => (
  <motion.div
    className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
  >
    <div className="mb-4">
      {React.cloneElement(icon, { className: "w-6 h-6 text-blue-600" })}
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </motion.div>
);
 
// Testimonial Component
const TestimonialCard = ({ name, role, content, avatar, delay }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/60 hover:bg-white/90 transition-all duration-300"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
  >
    <div className="flex items-center mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-slate-600 text-sm mb-4 leading-relaxed">"{content}"</p>
    <div className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {name.charAt(0)}
      </div>
      <div className="ml-3">
        <div className="font-medium text-slate-800 text-sm">{name}</div>
        <div className="text-xs text-slate-500">{role}</div>
      </div>
    </div>
  </motion.div>
);
 
export default function HomePage() {
  const [showScrollButton, setShowScrollButton] = React.useState(false);
 
  // Function to scroll smoothly to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
 
  // Effect to show/hide the button based on scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      // Show button after a certain scroll position, e.g., 200px
      if (window.scrollY > 200) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
 
    window.addEventListener('scroll', handleScroll);
 
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount
 
  const features = [
    {
      icon: <Users />,
      title: 'Expert Teachers',
      description: 'Learn from verified, experienced educators who are passionate about your success.',
    },
    {
      icon: <Clock />,
      title: 'Flexible Scheduling',
      description: 'Book lessons at your convenience with 24/7 availability across different time zones.',
    },
    {
      icon: <BookOpen />,
      title: 'Personalized Learning',
      description: 'Customized lesson plans tailored to your learning style and academic goals.',
    },
    {
      icon: <Shield />,
      title: 'Safe & Secure',
      description: 'Secure payments, verified profiles, and monitored sessions for your peace of mind.',
    },
    {
      icon: <TrendingUp />,
      title: 'Track Progress',
      description: 'Monitor your improvement with detailed analytics and progress reports.',
    },
    {
      icon: <Heart />,
      title: 'Student Success',
      description: 'Join thousands of students who have achieved their academic goals with us.',
    },
  ];
 
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Math Student",
      content: "The tutoring here is amazing! My grades improved dramatically and I actually enjoy learning now.",
      delay: 0.1
    },
    {
      name: "David Kumar",
      role: "Physics Teacher", 
      content: "As an educator, I love how this platform connects me with motivated students worldwide.",
      delay: 0.2
    },
    {
      name: "Emily Rodriguez",
      role: "Parent",
      content: "My daughter's confidence in science has grown so much. The teachers are patient and skilled.",
      delay: 0.3
    }
  ];
 
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated CSS Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        
        {/* Animated geometric shapes */}
        <div className="absolute inset-0">
          {/* Large rotating circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-blue-400/20 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 border border-purple-400/20 rounded-full animate-spin-reverse"></div>
          
          {/* Floating geometric shapes */}
          <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-lg rotate-45 animate-float"></div>
          <div className="absolute bottom-1/3 left-1/5 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-pink-500/10 rounded-full animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-r from-indigo-400/15 to-cyan-500/15 rounded-xl rotate-12 animate-float-slow"></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Scanning lines effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-32 animate-scan"></div>
        </div>
        
        {/* Main overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/50 to-indigo-900/60"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
 
      {/* Animated gradient orbs for additional effect */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/15 to-pink-600/15 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-20 left-1/4 w-48 h-48 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-gradient-to-tr from-violet-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '2s'}}></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${12 + Math.random() * 8}s`
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-20 pt-16">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium mb-8 border border-white/30 shadow-lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Connecting students with expert teachers worldwide
                </div>
              </motion.div>
 
              <motion.h1
                className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                Learn from the best,{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent" style={{fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: '600'}}>
                  achieve your Goals
                </span>
              </motion.h1>
 
              <motion.p
                className="hero-subtitle text-lg sm:text-xl md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Find qualified tutors for personalized 1-on-1 lessons. Book instantly, 
                learn at your pace, and excel in any subject with Yuvshiksha.
              </motion.p>
 
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Link 
                  to="/signup"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 bg-size-200 hover:bg-pos-100 relative overflow-hidden group"
                  style={{
                    backgroundSize: '200% 200%',
                    backgroundPosition: '0% 50%'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <GraduationCap className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Start Learning</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-10" />
                </Link>
                <Link 
                  to="/login"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/30 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Sign In
                </Link>
              </motion.div>
 
              {/* Stats */}
              <motion.div
                className="grid grid-cols-3 gap-4 sm:gap-8 max-w-sm sm:max-w-lg mx-auto px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <StatCard number="15,000+" label="Students" delay={0.1} textColor="text-white" />
                <StatCard number="800+" label="Expert Teachers" delay={0.2} textColor="text-white" />
                <StatCard number="75+" label="Subjects" delay={0.3} textColor="text-white" />
              </motion.div>
              
              {/* Scroll Indicator */}
              <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="flex flex-col items-center text-white/70">
                  <span className="text-sm mb-2 hidden sm:block">Scroll to explore</span>
                  <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                    <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce mt-2"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
 
        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                Everything you need to succeed
              </motion.h2>
              <motion.p
                className="text-lg text-slate-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Our platform provides all the tools and support you need for effective online learning
              </motion.p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard 
                  key={index} 
                  {...feature} 
                  delay={0.3 + (index * 0.1)} 
                  className="bg-white/80 backdrop-blur-sm border-white/60 hover:bg-white/90"
                />
              ))}
            </div>
          </div>
        </section>
 
        {/* How it Works Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/90 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                How Yuvshiksha works
              </motion.h2>
              <motion.p
                className="text-lg text-slate-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Getting started is simple. Connect with expert tutors in just a few steps.
              </motion.p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Browse Teachers</h3>
                <p className="text-slate-600">Find the perfect tutor based on subject and availability.</p>
              </motion.div>
 
              <motion.div
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Book a Session</h3>
                <p className="text-slate-600">Schedule your lesson at a time that works for you and make secure payment.</p>
              </motion.div>
 
              <motion.div
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Start Learning</h3>
                <p className="text-slate-600">Join your online session and start achieving your academic goals.</p>
              </motion.div>
            </div>
          </div>
        </section>
 
        {/* Testimonials Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                What our community says
              </motion.h2>
              <motion.p
                className="text-lg text-slate-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Join thousands of students and teachers who have found success with Yuvshiksha
              </motion.p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>
 
        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/90 backdrop-blur-sm relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Ready to start your learning journey?
            </motion.h2>
            <motion.p
              className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Join Yuvshiksha today and connect with expert tutors who will help you achieve your academic goals.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link 
                to="/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-300"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </section>
 
        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Scroll to top"
            >
              <ArrowUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>
 
        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/30 bg-white/95 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <GraduationCap className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-slate-900">Yuvsiksha</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-slate-600 text-sm">
                  Contact: <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=yuvsiksha@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-700"
                  >
                    yuvsiksha@gmail.com
                  </a>
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/30 text-center">
              <p className="text-slate-500 text-sm">
                © 2025 Yuvsiksha. All rights reserved. Made with ❤️ for students and teachers worldwide.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}