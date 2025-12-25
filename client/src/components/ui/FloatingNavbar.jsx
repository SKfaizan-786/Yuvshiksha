import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";

const FloatingNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const checkUser = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        setCurrentUser(storedUser);
      } catch (error) {
        console.error("Failed to parse currentUser:", error);
        setCurrentUser(null);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const userRole = currentUser?.role;
  const isProfileComplete = currentUser?.profileComplete;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // Ignore network errors
    }
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastLoginTime');
    setCurrentUser(null);
    setIsOpen(false);
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!currentUser) return "/login";
    if (userRole === 'student') {
      return isProfileComplete ? "/student/dashboard" : "/student/profile-setup";
    }
    return isProfileComplete ? "/teacher/dashboard" : "/teacher/profile-setup";
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-4 px-4">
        <motion.div 
          className={`flex items-center justify-between px-4 sm:px-6 py-3 rounded-full w-full max-w-3xl relative transition-all duration-300 ${
            scrolled 
              ? 'bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/50' 
              : 'bg-white/80 backdrop-blur-sm shadow-md border border-white/20'
          }`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-9 h-9"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src="/Yuvsiksha_logo.png" 
                alt="Yuvsiksha" 
                className="w-full h-full rounded-lg"
              />
            </motion.div>
            <span className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition-colors hidden sm:block">
              Yuvsiksha
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {currentUser ? (
              // Logged in user navigation
              <>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Link 
                    to={getDashboardLink()}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-cyan-600 hover:bg-slate-50 rounded-full transition-all font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              </>
            ) : (
              // Guest navigation
              <>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Link 
                    to="/login"
                    className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all font-medium"
                  >
                    Log in
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 font-medium"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden flex items-center p-2 rounded-full hover:bg-slate-100 transition-colors" 
            onClick={toggleMenu} 
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-[60] pt-20 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <motion.button
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-slate-700" />
            </motion.button>

            {/* Logo in mobile menu */}
            <motion.div
              className="flex items-center gap-3 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <img 
                src="/Yuvsiksha_logo.png" 
                alt="Yuvsiksha" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-xl font-bold text-slate-900">Yuvsiksha</span>
            </motion.div>

            <div className="flex flex-col space-y-2">
              {currentUser ? (
                // Logged in mobile menu
                <>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link 
                      to={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-3 text-base text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                      onClick={toggleMenu}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-base text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </motion.div>
                </>
              ) : (
                // Guest mobile menu
                <>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link 
                      to="/login"
                      className="block px-4 py-3 text-base text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                      onClick={toggleMenu}
                    >
                      Log in
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="pt-4"
                  >
                    <Link
                      to="/signup"
                      className="flex items-center justify-center w-full px-5 py-3 text-base text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 font-medium"
                      onClick={toggleMenu}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNavbar;

