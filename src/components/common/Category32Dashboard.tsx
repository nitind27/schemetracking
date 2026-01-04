"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";

interface Proposal {
  proposal_id?: number;
  proposal_category_id?: number;
  work_status?: string;
  forward_to?: string;
  user_category_id?: number;
  user_name?: string;
}

interface DepartmentStats {
  department: string;
  requests: number;
  pending: number;
  accept: number;
  rejecte: number;
}

export default function Category32Dashboard() {
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);

  useEffect(() => {
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        calculateDepartmentStats(data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartmentStats = (proposalsData: Proposal[]) => {
    // Define departments based on user_category_id
    // QFO/DFO (RFO/DFO), PO (Proposal Officer), DLL
    const departments = [
      { id: 'RFO/DFO', categoryIds: [8, 33] }, // RFO/DFO categories (District Collector, DFO)
      { id: 'PO', categoryIds: [24] }, // Proposal Officer
      { id: 'DLL', categoryIds: [32] } // DLL category
    ];

    const stats: DepartmentStats[] = departments.map(dept => {
      // Filter proposals for this department based on user_category_id of the user who created it
      const deptProposals = proposalsData.filter(p => {
        return p.user_category_id && dept.categoryIds.includes(Number(p.user_category_id));
      });

      const requests = deptProposals.length;
      const pending = deptProposals.filter(p => 
        !p.work_status || 
        p.work_status === '' || 
        p.work_status === 'Not started Yet' ||
        p.work_status === 'Pending' ||
        p.work_status === 'Under Review'
      ).length;
      const accept = deptProposals.filter(p => 
        p.work_status === 'pending at DLC' ||
        p.work_status === 'Accepted' ||
        p.work_status === 'Completed'
      ).length;
      const rejecte = deptProposals.filter(p => 
        p.work_status === 'Rejected'
      ).length;

      return {
        department: dept.id,
        requests,
        pending,
        accept,
        rejecte
      };
    });

    setDepartmentStats(stats);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Section 3(2) - Department Wise Statistics
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Sr Nu
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
              Department 
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Requeste
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Pending
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Accepted
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Rejected
              </th>
            </tr>
          </thead>
          <tbody>
            {departmentStats.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              departmentStats.map((stat, index) => (
                <tr key={stat.department} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white font-medium">
                    {stat.department}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    {stat.requests}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    {stat.pending}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    {stat.accept}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    {stat.rejecte}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

