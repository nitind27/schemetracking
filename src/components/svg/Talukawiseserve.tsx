"use client"
import React, { useState } from 'react';

// Type definitions (adjust if your types are different)
interface Taluka {
    taluka_id: string | number;
    name: string;
}
interface Village {
    village_id: string | number;
    name: string;
    taluka_id: string | number;
}
interface Farmer {
    village_id: string | number;
    taluka_id: string | number;
    update_record?: string;
    // ...other fields
}
type TalukaCount = {
    total: number;
    filledCount: number;
    names: (string | null)[];
    color: 'red' | 'orange' | 'green';
    saturation: number;
};
type TalukaCounts = Record<string, TalukaCount>;

interface TalukawiseserveProps {
    talukaCounts: TalukaCounts;
    datataluka: Taluka[];
    datavillage: Village[];
    farmers: Farmer[];
}

const colorClass: Record<'red' | 'orange' | 'green', string> = {
    red: 'bg-[#FF0000]',
    orange: 'bg-[#FFA500]',
    green: 'bg-[#008000]',
};

const Talukawiseserve: React.FC<TalukawiseserveProps> = ({
    talukaCounts,
    datataluka,
    datavillage,
    farmers,
}) => {
    const [openTaluka, setOpenTaluka] = useState<string | null>(null);

    // Find taluka_id by name
    const getTalukaIdByName = (name: string) => {
        const taluka = datataluka.find((t) => t.name === name);
        return taluka ? taluka.taluka_id : null;
    };

    // Get villages for a taluka_id
    const getVillagesForTaluka = (taluka_id: string | number) => {
        return datavillage.filter((v) => String(v.taluka_id) === String(taluka_id));
    };

    // Compute village progress
    const getVillageProgress = (village_id: string | number) => {
        const villageFarmers = farmers.filter(
            (f) => String(f.village_id) === String(village_id)
        );
        const total = villageFarmers.length;
        const filledCount = villageFarmers.filter(
            (f) => f.update_record && f.update_record.trim() !== ''
        ).length;
        const percent = total > 0 ? Math.round((filledCount / total) * 100) : 0;
        let color: 'red' | 'orange' | 'green' = 'red';
        if (percent >= 80) color = 'green';
        else if (percent >= 50) color = 'orange';
        return { total, filledCount, percent, color };
    };

    return (
        <div className="p-5">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-6">
                Taluka Wise Serve
            </h2>
            <div className="space-y-6">
                {Object.entries(talukaCounts).map(([talukaName, info]) => {
                    const percent =
                        info.total > 0
                            ? Math.round((info.filledCount / info.total) * 100)
                            : 0;
                    return (
                        <>
                        <div className='flex'>
                            <div
                                key={talukaName}
                                className="mb-4 p-2 bg-gray-100 rounded-lg shadow hover:bg-gray-200"
                            >
                                {/* Top Row: Taluka Name (left) and Data + Button (right) */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                    {/* Left: Taluka Name */}
                                    <span
                                        className="font-semibold text-gray-700 cursor-pointer hover:underline"
                                        onClick={() => setOpenTaluka(talukaName)}
                                    >
                                        {talukaName}
                                    </span>

                                    {/* Right: Data and Button */}

                                </div>

                                {/* Progress Bar */}
                                <div className="w-[80%] bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`${colorClass[info.color]} h-2 rounded-full transition-all duration-300`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                {/* Data */}
                                <span className="text-sm font-medium text-gray-600">
                                    {info.filledCount}/{info.total} ({percent}%)
                                </span>
                                {/* Button */}
                                <button type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Green</button>
                            </div>
                            </div>
                        </>

                    );
                })}
            </div>


            {/* Modal */}
            {openTaluka && (
                <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 z-9999 flex items-center justify-center ">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto mt-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {openTaluka} - Village Wise Serve
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                                onClick={() => setOpenTaluka(null)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const taluka_id = getTalukaIdByName(openTaluka);
                                if (!taluka_id) return <div>No villages found.</div>;
                                const villages = getVillagesForTaluka(taluka_id);
                                if (villages.length === 0)
                                    return <div>No villages found.</div>;
                                return villages.map((village) => {
                                    const {
                                        total,
                                        filledCount,
                                        percent,
                                        color,
                                    } = getVillageProgress(village.village_id);
                                    return (
                                        <div key={village.village_id} className="mb-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-gray-700">
                                                    {village.name}
                                                </span>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {filledCount}/{total} ({percent}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div
                                                    className={`${colorClass[color]} h-4 rounded-full`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Talukawiseserve;
