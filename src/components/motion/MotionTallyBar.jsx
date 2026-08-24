import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const MotionTallyBar = ({ percentage, colorClass = 'bg-indigo-600' }) => {
  const shouldReduceMotion = useReducedMotion();

  const barVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${percentage}%`,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 12,
      }
    }
  };

  return (
    <div className="relative w-full h-4 bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
      <motion.div
        key={percentage}
        initial="hidden"
        animate="visible"
        variants={barVariants}
        className={`h-full rounded-full ${colorClass}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};
