import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FeatureSteps - An auto-playing feature showcase with step indicators
 * and animated image transitions
 */
export function FeatureSteps({
  features,
  className = "",
  title = "How to get Started",
  autoPlayInterval = 3000,
  imageHeight = "h-[400px]",
  isDarkMode = false,
}) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress, features.length, autoPlayInterval]);

  const cn = (...classes) => classes.filter(Boolean).join(' ');

  return (
    <div className={cn("p-6 md:p-8", className)}>
      <div className="max-w-6xl mx-auto w-full">
        <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-center transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="order-2 md:order-1 space-y-4 lg:space-y-5">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 md:gap-4 cursor-pointer"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
                onClick={() => {
                  setCurrentFeature(index);
                  setProgress(0);
                }}
              >
                <motion.div
                  className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 mt-0.5",
                    index === currentFeature
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 text-white scale-110"
                      : isDarkMode 
                        ? "bg-slate-700 border-slate-600 text-slate-400"
                        : "bg-slate-100 border-slate-300 text-slate-500"
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-sm font-bold">✓</span>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-base md:text-lg font-semibold leading-tight transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title || feature.step}
                  </h3>
                  <p className={`text-xs md:text-sm leading-snug mt-0.5 transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            className={cn(
              "order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-2xl",
              isDarkMode ? "bg-gradient-to-br from-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-100 to-slate-200"
            )}
          >
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-2xl overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover transition-transform transform"
                      />
                      <div className={`absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t ${isDarkMode ? 'from-slate-900 via-slate-900/50' : 'from-white via-white/50'} to-transparent`} />
                    </motion.div>
                  )
              )}
            </AnimatePresence>
            
            {/* Progress bar */}
            <div className={`absolute bottom-4 left-4 right-4 h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'}`}>
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureSteps;

