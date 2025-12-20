import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * FeatureSection - A modern bento-grid style feature showcase
 * with hover effects and glassmorphism
 */
const FeatureSection = ({ features, isDarkMode = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isHovered = hoveredIndex === index;
        
        return (
          <motion.div
            key={index}
            className="relative group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Glow effect on hover */}
            <motion.div
              className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${feature.gradientFrom || '#22d3ee'}30, ${feature.gradientTo || '#3b82f6'}30)`,
                filter: 'blur(8px)',
              }}
              animate={{
                scale: isHovered ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Card */}
            <div className={`relative h-full p-6 rounded-2xl backdrop-blur-xl border shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-xl
              ${isDarkMode 
                ? 'bg-slate-800/50 border-slate-700/50 group-hover:bg-slate-800/70 group-hover:border-cyan-700/50' 
                : 'bg-white/80 border-white/60 group-hover:bg-white/90 group-hover:border-cyan-200/50'}`}>
              {/* Animated gradient background */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${feature.gradientFrom || '#22d3ee'}, ${feature.gradientTo || '#3b82f6'})`,
                }}
              />
              
              {/* Glass shimmer */}
              <div className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${isDarkMode ? 'from-slate-700/30' : 'from-white/40'} to-transparent opacity-60 pointer-events-none`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon container with animated gradient border */}
                <motion.div
                  className="relative w-14 h-14 mb-5"
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                    rotate: isHovered ? 5 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Icon background glow */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-40 blur-md"
                    style={{
                      background: `linear-gradient(135deg, ${feature.gradientFrom || '#22d3ee'}, ${feature.gradientTo || '#3b82f6'})`,
                    }}
                  />
                  
                  {/* Icon container */}
                  <div 
                    className="relative w-full h-full rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${feature.gradientFrom || '#22d3ee'}, ${feature.gradientTo || '#3b82f6'})`,
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </motion.div>
                
                {/* Title */}
                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className={`text-sm leading-relaxed transition-colors duration-500 ${isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-700'}`}>
                  {feature.description}
                </p>
                
                {/* Animated line at bottom */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${feature.gradientFrom || '#22d3ee'}, ${feature.gradientTo || '#3b82f6'})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: isHovered ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeatureSection;

