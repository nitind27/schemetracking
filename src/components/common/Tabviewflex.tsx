"use client";

import React, { useState, useTransition, useCallback } from 'react';

interface TabViewProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode | (() => React.ReactNode);
  }[];
  defaultTab?: string;
}

const Tabviewflex: React.FC<TabViewProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [isPending, startTransition] = useTransition();

  const handleTabChange = useCallback((id: string) => {
    startTransition(() => {
      setActiveTab(id);
    });
  }, []);

  const active = tabs.find((tab) => tab.id === activeTab);
  const content =
    typeof active?.content === 'function' ? active.content() : active?.content;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            style={{ flexBasis: 'calc(20% - 1rem)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`w-full ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        {content}
      </div>
    </div>
  );
};

export default Tabviewflex;
