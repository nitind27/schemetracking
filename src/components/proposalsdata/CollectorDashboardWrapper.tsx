"use client";

import { useEffect, useState } from "react";
import { CollectorDashboard } from "./CollectorDashboard";
import { Proposal } from "./proposals";
import Loader from "@/common/Loader";

export default function CollectorDashboardWrapper() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return <CollectorDashboard proposals={proposals} />;
}

