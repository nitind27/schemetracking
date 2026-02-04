"use client";

import React, { useState } from 'react';
import DCDashboard from '@/components/common/DCDashboard';
import DLCDashboard from '@/components/common/DLCDashboard';

export default function TestDashboards() {
  const [activeTab, setActiveTab] = useState('dc');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard Testing
          </h1>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dc')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dc'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                DC Dashboard (Category 32)
              </button>
              <button
                onClick={() => setActiveTab('dlc')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dlc'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                DLC Dashboard (Category 35)
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'dc' && <DCDashboard />}
          {activeTab === 'dlc' && <DLCDashboard />}
        </div>
      </div>
    </div>
  );
}