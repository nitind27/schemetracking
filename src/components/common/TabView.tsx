"use client";

import React, { useState } from 'react';

interface TabViewProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
}

const TabView: React.FC<TabViewProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const colsClass =
    tabs.length === 3
      ? 'grid-cols-3'
      : tabs.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-1';

  return (
    <div className="w-full">
      {/* Tab Buttons */}
      <div className={`grid ${colsClass} gap-4 mb-6`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`col-span-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default TabView;