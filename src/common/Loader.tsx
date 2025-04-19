// components/Loader.js
"use client"
import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 backdrop-blur-[5px]">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loader;
