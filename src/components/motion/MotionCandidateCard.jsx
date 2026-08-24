import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const MotionCandidateCard = ({ children, index = 0, onClick }) => {
  const shouldReduceMotion = useReducedMotion();

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 25 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 14,
        delay: shouldReduceMotion ? 0 : index * 0.06,
      }
    }
  };

  const hoverAnimation = shouldReduceMotion ? {} : {
    y: -6,
    scale: 1.015,
    boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.12), 0 8px 10px -6px rgba(99, 102, 241, 0.12)",
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  };

  const tapAnimation = shouldReduceMotion ? {} : {
    scale: 0.985
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      variants={cardVariants}
      onClick={onClick}
      className="flex flex-col bg-white rounded-xl shadow-md border border-slate-100 dark:bg-slate-900 dark:border-slate-800 cursor-pointer overflow-hidden group"
    >
      {children}
    </motion.div>
  );
};
