import React from 'react';

const Tabchangepage = () => {
  return (
    <div className="flex flex-col md:flex-row w-full gap-4 p-4">
      <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm md:text-base">
        Aadhaar Status of IFR Beneficiaries Across Talukas
      </button>
      <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm md:text-base">
        Availability of each documents for IFR holders
      </button>
      <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm md:text-base">
        Scheme wise IFR holders
      </button>
      <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm md:text-base">
        Table List
      </button>
    </div>
  );
};

export default Tabchangepage;
