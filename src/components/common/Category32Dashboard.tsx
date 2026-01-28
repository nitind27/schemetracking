"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";

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
}

interface DepartmentStats {
  department: string;
  requests: number;
  pending: number;
  accept: number;
  rejecte: number;
}

type StatusColumn = "requests" | "pending" | "accept" | "rejecte";

const DEPARTMENTS = [
  { id: "RFO/DFO", categoryIds: [8, 33] },
  { id: "PO", categoryIds: [24] },
  { id: "DLL", categoryIds: [32] },
];

function getProposalsForStatus(
  proposals: Proposal[],
  departmentId: string,
  statusType: StatusColumn
): Proposal[] {
  const dept = DEPARTMENTS.find((d) => d.id === departmentId);
  if (!dept) return [];
  const deptProposals = proposals.filter(
    (p) => p.user_category_id && dept.categoryIds.includes(Number(p.user_category_id))
  );
  switch (statusType) {
    case "requests":
      return deptProposals;
    case "pending":
      return deptProposals.filter(
        (p) =>
          !p.work_status ||
          p.work_status === "" ||
          p.work_status === "Not started Yet" ||
          p.work_status === "Pending" ||
          p.work_status === "Under Review"
      );
    case "accept":
      return deptProposals.filter(
        (p) =>
          p.work_status === "pending at DLC" ||
          p.work_status === "Accepted" ||
          p.work_status === "Completed"
      );
    case "rejecte":
      return deptProposals.filter((p) => p.work_status === "Rejected");
    default:
      return [];
  }
}

const COUNT_COLORS: Record<StatusColumn, string> = {
  requests: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/60",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/60",
  accept: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/60",
  rejecte: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800/60",
};

export default function Category32Dashboard() {
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [proposalsData, setProposalsData] = useState<Proposal[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    department: string;
    statusType: StatusColumn;
    label: string;
  } | null>(null);

  useEffect(() => {
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/proposals");
      if (response.ok) {
        const data = await response.json();
        setProposalsData(data);
        calculateDepartmentStats(data);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartmentStats = (proposalsData: Proposal[]) => {
    const stats: DepartmentStats[] = DEPARTMENTS.map((dept) => {
      const deptProposals = proposalsData.filter(
        (p) => p.user_category_id && dept.categoryIds.includes(Number(p.user_category_id))
      );
      const requests = deptProposals.length;
      const pending = deptProposals.filter(
        (p) =>
          !p.work_status ||
          p.work_status === "" ||
          p.work_status === "Not started Yet" ||
          p.work_status === "Pending" ||
          p.work_status === "Under Review"
      ).length;
      const accept = deptProposals.filter(
        (p) =>
          p.work_status === "pending at DLC" ||
          p.work_status === "Accepted" ||
          p.work_status === "Completed"
      ).length;
      const rejecte = deptProposals.filter((p) => p.work_status === "Rejected").length;
      return { department: dept.id, requests, pending, accept, rejecte };
    });
    setDepartmentStats(stats);
  };

  const openModal = (department: string, statusType: StatusColumn) => {
    const labels: Record<StatusColumn, string> = {
      requests: "Requested",
      pending: "Pending",
      accept: "Accepted",
      rejecte: "Rejected",
    };
    setModal({ open: true, department, statusType, label: labels[statusType] });
  };

  const modalProposals = modal
    ? getProposalsForStatus(proposalsData, modal.department, modal.statusType)
    : [];

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
                Requested
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
                  <td
                    className={`border border-gray-300 dark:border-gray-700 px-4 py-3 font-semibold ${COUNT_COLORS.requests}`}
                    onClick={() => openModal(stat.department, "requests")}
                  >
                    {stat.requests}
                  </td>
                  <td
                    className={`border border-gray-300 dark:border-gray-700 px-4 py-3 font-semibold ${COUNT_COLORS.pending}`}
                    onClick={() => openModal(stat.department, "pending")}
                  >
                    {stat.pending}
                  </td>
                  <td
                    className={`border border-gray-300 dark:border-gray-700 px-4 py-3 font-semibold ${COUNT_COLORS.accept}`}
                    onClick={() => openModal(stat.department, "accept")}
                  >
                    {stat.accept}
                  </td>
                  <td
                    className={`border border-gray-300 dark:border-gray-700 px-4 py-3 font-semibold ${COUNT_COLORS.rejecte}`}
                    onClick={() => openModal(stat.department, "rejecte")}
                  >
                    {stat.rejecte}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!modal?.open}
        onClose={() => setModal(null)}
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 flex flex-col flex-1 min-h-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {modal ? `${modal.department} – ${modal.label}` : ""}
          </h2>
          <div className="max-h-[70vh] overflow-y-auto flex-1">
            {modalProposals.length === 0 ? (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">No proposals found</p>
            ) : (
              <div className="space-y-3">
                {modalProposals.map((p, i) => (
                  <div
                    key={p.proposal_id ?? i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            Proposal #{p.proposal_id}
                          </span>
                          {p.work_status && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {p.work_status}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-1 text-sm text-gray-600 dark:text-gray-400">
                          {p.village_name && <p><span className="font-medium">Village:</span> {p.village_name}</p>}
                          {p.taluka_name && <p><span className="font-medium">Taluka:</span> {p.taluka_name}</p>}
                          {p.gp_name && <p><span className="font-medium">GP:</span> {p.gp_name}</p>}
                          {p.user_name && <p><span className="font-medium">Created by:</span> {p.user_name}</p>}
                          {p.beneficiaries && <p><span className="font-medium">Beneficiaries:</span> {p.beneficiaries}</p>}
                          {p.number_of_tree != null && <p><span className="font-medium">Trees:</span> {p.number_of_tree}</p>}
                        </div>
                      </div>
                      {p.pdf && (
                        <a
                          href={p.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

