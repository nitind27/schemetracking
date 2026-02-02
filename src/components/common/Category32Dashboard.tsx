"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";

interface Proposal {
  proposal_id?: number;
  proposal_category_id?: number;
  work_status?: string;
  forward_to?: string;
  user_category_id?: number;
  user_name?: string;
  taluka_name?: string;
  gp_name?: string;
  village_name?: string;
  beneficiaries?: string;
  number_of_tree?: number;
  land_details?: string;
  remarks?: string;
  pdf?: string;
  created_at?: string;
  updated_at?: string;
}

interface DashboardStats {
  totalApplications: number;
  pending: number;
  nocProcessing: number;
  completed: number;
  jaminApplications: number;
  kulkaydaApplications: number;
  gavthanApplications: number;
  clerkLevel: number;
  tahsildar: number;
  nocDepts: number;
  sdmLevel: number;
}

interface RecentApplication {
  id: number;
  appId: string;
  applicant: string;
  type: string;
  status: string;
  level: string;
  daysPending: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      duration: 0.3,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

export default function Category32Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pending: 0,
    nocProcessing: 0,
    completed: 0,
    jaminApplications: 0,
    kulkaydaApplications: 0,
    gavthanApplications: 0,
    clerkLevel: 0,
    tahsildar: 0,
    nocDepts: 0,
    sdmLevel: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<RecentApplication | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchProposals();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/proposals");
      if (response.ok) {
        const data = await response.json();
        calculateStats(data);
        generateRecentApplications(data);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (proposals: Proposal[]) => {
    const total = proposals.length;
    const pending = proposals.filter(
      (p) =>
        !p.work_status ||
        p.work_status === "" ||
        p.work_status === "Not started Yet" ||
        p.work_status === "Pending" ||
        p.work_status === "Under Review"
    ).length;
    
    const nocProcessing = proposals.filter(
      (p) =>
        p.work_status === "NOC Pending" ||
        p.work_status === "Under Review" ||
        p.forward_to?.toLowerCase().includes("noc")
    ).length;
    
    const completed = proposals.filter(
      (p) =>
        p.work_status === "Completed" ||
        p.work_status === "Accepted" ||
        p.work_status === "pending at DLC"
    ).length;

    const jaminApplications = proposals.filter(
      (p) => p.proposal_category_id === 1 || p.land_details?.toLowerCase().includes("jamin")
    ).length;
    
    const kulkaydaApplications = proposals.filter(
      (p) => p.proposal_category_id === 2 || p.land_details?.toLowerCase().includes("kulkayda")
    ).length;
    
    const gavthanApplications = proposals.filter(
      (p) => p.proposal_category_id === 3 || p.land_details?.toLowerCase().includes("gavthan")
    ).length;

    const clerkLevel = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("clerk") || (!p.forward_to && !p.work_status)
    ).length;
    
    const tahsildar = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("tahsildar") || p.work_status === "Pending"
    ).length;
    
    const nocDepts = proposals.filter(
      (p) => p.work_status === "NOC Pending" || p.forward_to?.toLowerCase().includes("noc")
    ).length;
    
    const sdmLevel = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("sdm") || p.work_status === "pending at DLC"
    ).length;

    setStats({
      totalApplications: total,
      pending,
      nocProcessing,
      completed,
      jaminApplications,
      kulkaydaApplications,
      gavthanApplications,
      clerkLevel,
      tahsildar,
      nocDepts,
      sdmLevel,
    });
  };

  const generateRecentApplications = (proposals: Proposal[]) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = proposals
      .filter((p) => {
        if (!p.created_at) return false;
        const createdDate = new Date(p.created_at);
        return createdDate >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 50)
      .map((p, index) => {
        const getApplicationType = () => {
          if (p.proposal_category_id === 1 || p.land_details?.toLowerCase().includes("jamin")) {
            return "जमीन अर्ज (Jamin Application)";
          }
          if (p.proposal_category_id === 2 || p.land_details?.toLowerCase().includes("kulkayda")) {
            return "कुळकायदा अर्ज (Kulkayda Application)";
          }
          if (p.proposal_category_id === 3 || p.land_details?.toLowerCase().includes("gavthan")) {
            return "गावठाण अर्ज (Gavthan Application)";
          }
          return "जमीन अर्ज (Jamin Application)";
        };

        const getStatus = () => {
          if (!p.work_status || p.work_status === "" || p.work_status === "Not started Yet") {
            return "प्रलंबित (Pending)";
          }
          if (p.work_status === "NOC Pending" || p.forward_to?.toLowerCase().includes("noc")) {
            return "NOC प्रलंबित (NOC Pending)";
          }
          if (p.work_status === "Rejected") {
            return "नाकारले (Rejected)";
          }
          if (p.work_status === "Completed" || p.work_status === "Accepted" || p.work_status === "pending at DLC") {
            return "मंजूर (Approved)";
          }
          return "प्रलंबित (Pending)";
        };

        const getLevel = () => {
          if (p.forward_to?.toLowerCase().includes("sdm") || p.work_status === "pending at DLC") {
            return "उपविभागीय अधिकारी (SDM)";
          }
          if (p.forward_to?.toLowerCase().includes("tahsildar")) {
            return "तहसीलदार (Tahsildar)";
          }
          if (p.forward_to?.toLowerCase().includes("revenue") || p.forward_to?.toLowerCase().includes("noc")) {
            return "महसूल विभाग (Revenue Dept)";
          }
          return "लिपिक (Clerk)";
        };

        const getDaysPending = () => {
          if (!p.created_at) return 0;
          const createdDate = new Date(p.created_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        };

        return {
          id: p.proposal_id || index + 1,
          appId: `LA-${String(p.proposal_id || index + 1).padStart(5, "0")}`,
          applicant: p.user_name || p.beneficiaries || "अज्ञात (Unknown)",
          type: getApplicationType(),
          status: getStatus(),
          level: getLevel(),
          daysPending: getDaysPending(),
        };
      });

    setRecentApplications(recent);
  };

  const getStatusColor = (status: string) => {
    if (status.includes("Approved") || status.includes("मंजूर")) {
      return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border border-green-300";
    }
    if (status.includes("Pending") || status.includes("प्रलंबित")) {
      return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-300 border border-yellow-300";
    }
    if (status.includes("NOC")) {
      return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border border-blue-300";
    }
    if (status.includes("Rejected") || status.includes("नाकारले")) {
      return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border border-red-300";
    }
    return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border border-gray-300";
  };

  const getDaysPendingColor = (days: number) => {
    if (days === 0) return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border border-green-300";
    if (days <= 5) return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border border-gray-300";
    if (days <= 10) return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300 border border-orange-300";
    return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border border-red-300";
  };

  const filteredApplications = recentApplications.filter((app) =>
    app.appId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <motion.div
        className="mb-8 relative"
        variants={itemVariants}
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  जिल्हाधिकारी डॅशबोर्ड
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  Collector Dashboard - Land Records Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg"
                variants={pulseVariants}
                animate="pulse"
              >
                <div className="text-sm font-medium">
                  {currentTime.toLocaleTimeString('hi-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
                <div className="text-xs opacity-90">
                  {currentTime.toLocaleDateString('hi-IN', { 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  जि
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-white">जिल्हाधिकारी</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">District Collector</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Enhanced Metric Cards */}
        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {stats.totalApplications.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              एकूण अर्ज (Total Applications)
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
              {stats.pending.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              प्रलंबित (Pending)
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stats.nocProcessing.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              NOC प्रक्रिया (NOC Processing)
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {stats.completed.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              पूर्ण (Completed)
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {((stats.completed / (stats.totalApplications || 1)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm opacity-90">
              यशस्वी दर (Success Rate)
            </div>
          </div>
        </motion.div>
      </div>

      {/* Application Type Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <motion.div
                className="text-right"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="text-sm opacity-80">जमीन</div>
                <div className="text-xs opacity-60">Land</div>
              </motion.div>
            </div>
            <div className="text-5xl font-bold mb-3">{stats.jaminApplications.toLocaleString()}</div>
            <div className="text-xl font-semibold mb-2">जमीन अर्ज (Jamin Applications)</div>
            <div className="text-sm opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {stats.totalApplications > 0
                ? Math.round((stats.jaminApplications / stats.totalApplications) * 100)
                : 0}% एकूण अर्जांपैकी
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <motion.div
                className="text-right"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="text-sm opacity-80">कुळकायदा</div>
                <div className="text-xs opacity-60">Tribal</div>
              </motion.div>
            </div>
            <div className="text-5xl font-bold mb-3">{stats.kulkaydaApplications.toLocaleString()}</div>
            <div className="text-xl font-semibold mb-2">कुळकायदा अर्ज (Kulkayda Applications)</div>
            <div className="text-sm opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {stats.totalApplications > 0
                ? Math.round((stats.kulkaydaApplications / stats.totalApplications) * 100)
                : 0}% एकूण अर्जांपैकी
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <motion.div
                className="text-right"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-sm opacity-80">गावठाण</div>
                <div className="text-xs opacity-60">Village</div>
              </motion.div>
            </div>
            <div className="text-5xl font-bold mb-3">{stats.gavthanApplications.toLocaleString()}</div>
            <div className="text-xl font-semibold mb-2">गावठाण अर्ज (Gavthan Applications)</div>
            <div className="text-sm opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {stats.totalApplications > 0
                ? Math.round((stats.gavthanApplications / stats.totalApplications) * 100)
                : 0}% एकूण अर्जांपैकी
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pendency by Level Section */}
      <motion.div
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 mb-8 relative overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full -mr-20 -mt-20" />
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">स्तरानुसार प्रलंबित</h3>
                <p className="text-gray-600 dark:text-gray-400">Pendency by Administrative Level</p>
              </div>
            </div>
            <motion.button
              onClick={fetchProposals}
              className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center border border-blue-200/50 dark:border-blue-700/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stats.clerkLevel.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                लिपिक स्तर (Clerk Level)
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">3x प्राधान्य</div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-center border border-green-200/50 dark:border-green-700/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.tahsildar.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                तहसीलदार (Tahsildar)
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">2x प्राधान्य</div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 text-center border border-purple-200/50 dark:border-purple-700/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.nocDepts.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                NOC विभाग (NOC Depts)
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">विशेष प्रक्रिया</div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 text-center border border-orange-200/50 dark:border-orange-700/50"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {stats.sdmLevel.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                उपविभागीय अधिकारी (SDM)
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">उच्च स्तर</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Recent Applications Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        variants={itemVariants}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Recent Applications (Last 7 Days)
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value={10}>Show 10 entries</option>
                <option value={25}>Show 25 entries</option>
                <option value={50}>Show 50 entries</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  App ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Days Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app, index) => (
                  <motion.tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                      {app.appId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.applicant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getDaysPendingColor(app.daysPending)}`}
                      >
                        {app.daysPending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {app.status === "Approved" ? (
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Finalize
                        </button>
                      ) : app.status === "Pending" ? (
                        <button
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Review
                        </button>
                      ) : app.status === "NOC Pending" ? (
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Monitor
                        </button>
                      ) : (
                        <button
                          className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Details
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredApplications.length)} of{" "}
            {filteredApplications.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Modal
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          className="max-w-2xl"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Application Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">App ID:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.appId}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Applicant:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.applicant}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Type:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.type}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}
                >
                  {selectedApplication.status}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Level:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.level}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Days Pending:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getDaysPendingColor(selectedApplication.daysPending)}`}
                >
                  {selectedApplication.daysPending}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
