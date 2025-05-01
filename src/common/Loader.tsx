// components/Loader.js
"use client";
import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 backdrop-blur-sm">


      <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
    </div>
  );
};

export default Loader;
