"use client";

import { useEffect, useState } from "react";
import { Section32Dashboard } from "./Section32Dashboard";
import { Proposal } from "./proposals";
import Loader from "@/common/Loader";

export default function Section32DashboardWrapper() {
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

  return <Section32Dashboard proposals={proposals} />;
}

