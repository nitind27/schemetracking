"use client";

import React from "react";
import { motion } from "framer-motion";

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  action?: string;
}

const AlertsSection: React.FC = () => {
  // Mock alerts - in real app, these would come from API
  const alerts: Alert[] = [
    {
      id: "1",
      type: "warning",
      title: "Low Survey Completion",
      message: "3 talukas have survey completion below 50%",
      timestamp: "2 hours ago",
      action: "View Details",
    },
    {
      id: "2",
      type: "error",
      title: "Missing Documents",
      message: "127 IFR holders have incomplete document uploads",
      timestamp: "5 hours ago",
      action: "Review",
    },
    {
      id: "3",
      type: "info",
      title: "New Survey Data",
      message: "45 new surveys completed today",
      timestamp: "1 day ago",
    },
    {
      id: "4",
      type: "warning",
      title: "Aadhaar Verification Pending",
      message: "89 IFR holders need Aadhaar verification",
      timestamp: "2 days ago",
      action: "Verify",
    },
  ];

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          title: "text-red-800",
          message: "text-red-700",
        };
      case "warning":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: "text-orange-600",
          title: "text-orange-800",
          message: "text-orange-700",
        };
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-800",
          message: "text-blue-700",
        };
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "text-green-600",
          title: "text-green-800",
          message: "text-green-700",
        };
    }
  };

  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "info":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "success":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Alerts & Action Required</h3>
            <p className="text-sm text-gray-500">Items requiring immediate attention</p>
          </div>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const styles = getAlertStyles(alert.type);
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={`${styles.bg} border ${styles.border} rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`${styles.icon} mt-0.5`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold ${styles.title} mb-1`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm ${styles.message} mb-2`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{alert.timestamp}</span>
                    {alert.action && (
                      <button className={`text-xs font-medium ${styles.title} hover:underline`}>
                        {alert.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AlertsSection;

