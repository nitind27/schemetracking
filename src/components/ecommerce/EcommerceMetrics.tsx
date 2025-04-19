"use client";
import React, { useEffect, useState } from "react";

import { BoxIconLine, GroupIcon } from "@/icons";
import { UserData } from "../usersdata/Userdata";

export const EcommerceMetrics = () => {
 const [data, setData] = useState<UserData[]>([]);
 const [dataschems, setDataschems] = useState<UserData[]>([]);
 const [datauser, setDatausers] = useState<UserData[]>([]);

  console.log("countind",data.length)
    const fetchData = async () => {
      try {
        const response = await fetch('/api/farmers');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    const fetchDataschems = async () => {
      try {
        const response = await fetch('/api/schemescrud');
        const result = await response.json();
        setDataschems(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    const fetchDatauser = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        setDatausers(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    useEffect(() => {
      fetchData();
      fetchDataschems();
      fetchDatauser();
    }, []);
  
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3  md:gap-10">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Farmers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
             {data.length}
            </h4>
          </div>
        
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Schemes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dataschems.length}
            </h4>
          </div>

         
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              System Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {datauser.length}
            </h4>
          </div>

         
        </div>
      </div>
     
    </div>
  );
};
