import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const PageTransition = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const variants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 15 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 18,
      }
    },
    exit: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : -15,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      className="flex-1 w-full"
    >
      {children}
    </motion.div>
  );
};
