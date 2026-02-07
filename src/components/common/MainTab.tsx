"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface MainTabProps {
  tabs: Tab[];
  defaultTab?: string;
}

const MainTab: React.FC<MainTabProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Navigation Container: Glassmorphism + Neumorphic base */}
      <nav className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2  bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900  text-white  dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
        {tabs.slice(0, 6).map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center justify-center py-3.5 px-4 outline-none group"
            >
              {/* Interaction Layer: Hover Glow & Scale */}
              <motion.div
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`
                  relative z-10 flex items-center justify-center w-full h-full rounded-xl transition-colors duration-300
                  ${isActive 
                    ? "text-blue-600 dark:text-blue-400 font-bold " 
                    : "text-white dark:text-neutral-500 group-hover:text-white dark:group-hover:text-neutral-400"
                  }
                `}
              >
                <span className="text-sm tracking-tight">{tab.label}</span>
                
                {/* Subtle Hover Border Glow */}
                {!isActive && (
                <div
                className="
                  absolute -inset-1.5 rounded-2xl
                  border-2 border-transparent
                  group-hover:border-blue-400/40
                  group-hover:bg-blue-400/10

                  transition-all duration-300
                "
              />
              
                )}
              </motion.div>

              {/* Active Slide Indicator (Underline with Blur) */}
              {isActive && (
                <>
                  {/* The Sliding Pill Underline */}
                  <motion.div
                    layoutId="active-underline"
                    className="absolute bottom-1.5 left-4 right-4 h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full z-20 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                  {/* The Motion Blur "Tail" Effect */}
                  <motion.div
                    layoutId="blur-glow"
                    className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm z-0"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content Area with Shutter/Blur Animation */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10, filter: "blur(12px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -10, filter: "blur(12px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            {tabs.find((t) => t.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainTab;