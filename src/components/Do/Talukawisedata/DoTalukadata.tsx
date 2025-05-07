"use client"
import PathHandler from '@/components/common/PathHandler';
import { Documents } from '@/components/Documentsdata/documents';
import { FarmdersType } from '@/components/farmersdata/farmers';
import { Schemecategorytype } from '@/components/Schemecategory/Schemecategory';
import { Schemesdatas } from '@/components/schemesdata/schemes';
import { Schemesubcategorytype } from '@/components/Schemesubcategory/Schemesubcategory';
import { Taluka } from '@/components/Taluka/Taluka';
import { UserCategory } from '@/components/usercategory/userCategory';
import { Village } from '@/components/Village/village';
import { Scheme_year } from '@/components/Yearmaster/yearmaster';

import Link from 'next/link';
import React, { useEffect, useState } from 'react'
interface AllFarmersData {
    users: UserCategory[];
    schemes: Schemesdatas[];
    farmers: FarmdersType[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    yearmaster: Scheme_year[];
    documents: Documents[];
    taluka: Taluka[];
    villages: Village[];

}

const DoTalukadata = ({ farmersData }: { farmersData: AllFarmersData }) => {


    return (
        <div className={`grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-7`}>
            {farmersData.taluka.map((metric, index) => (
                <MetricCard
                    key={index}
                    {...metric}
                    farmers={farmersData.farmers} // Pass the farmers data to MetricCard
                />
            ))}
        </div>
    );
}

const MetricCard = ({ taluka_id, name, farmers }: {
    taluka_id: number;
    name: string;

    farmers: FarmdersType[]; // Accept farmers as a prop
}) => {

    const [filters, setFilters] = useState({

        categoryName: null as string | null
    });

    useEffect(() => {
        setFilters({

            categoryName: sessionStorage.getItem('category_id')
        });
    }, []);

    const farmersCount = farmers.filter(farmer => farmer.taluka_id == String(taluka_id)).length; // Count farmers in the village
    const handleclick = (talukaid: number) => {
        sessionStorage.setItem('taluka_id', talukaid.toString());
        sessionStorage.setItem('village_id', "");
    }
    console.log("filters.categoryName",filters.categoryName)
    return (
        <>{ (filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4") && 

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow" onClick={() => handleclick(taluka_id)}>
                <Link href={"/farmerspage"}>
                    <PathHandler>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {name}
                                </span>
                                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    {farmersCount} {/* Display the count of farmers */}
                                </h4>
                            </div>
                        </div>
                    </PathHandler>
                </Link>
            </div >
        }
        </>
    );
};

export default DoTalukadata
