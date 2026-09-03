"use client";

import React, { useState, useEffect, useMemo } from 'react';
// import TabView from '@/components/common/TabView';
// import Talukawiseserve from '@/components/svg/Talukawiseserve';
import AadhaarStatusChart from './AadhaarStatusChart';
import DocumentAvailabilityChart from './DocumentAvailabilityChart';
import SchemesBarChart from './SchemesBarChart';
import Showschemstable from './Showschemstable';
import DistrictMap from './DistrictMap';
import AdvancedAnalytics from './AdvancedAnalytics';
import PerformanceScorecard from './PerformanceScorecard';

// Type definitions
import { FarmdersType } from '../farmersdata/farmers';
import { UserCategory } from '../usercategory/userCategory';
import { Schemesdatas } from '../schemesdata/schemes';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Scheme_year } from '../Yearmaster/yearmaster';
import { Documents } from '../Documentsdata/documents';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import Tabviewflex from '../common/Tabviewflex';

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

interface DashboardTalukatabviewProps {
    farmersData: AllFarmersData;
}

const DashboardTalukatabview: React.FC<DashboardTalukatabviewProps> = ({ farmersData }) => {
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [userTalukaId, setUserTalukaId] = useState<string | null>(null);

    useEffect(() => {
        const category_id = sessionStorage.getItem('category_id');
        const taluka_id = sessionStorage.getItem('taluka_id');
        setCategoryId(category_id);
        setUserTalukaId(taluka_id);
    }, []);

    // Filter data for PESA Coordinator (category_id = 37) - show only user's taluka
    const isPESACoordinator = categoryId === "37";
    
    // Filter data for user_category_id = 4 - show only talukas 1, 2, 3
    const isCategory4 = categoryId === "4";
    const allowedTalukaIdsCategory4 = ["1", "2", "3"];
    
    // Filter data for user_category_id = 8 - show only talukas 4, 5, 7
    const isCategory8 = categoryId === "8";
    const allowedTalukaIdsCategory8 = ["4", "5", "7"];
    
    const filteredFarmersData = useMemo(() => {
        if (isPESACoordinator && userTalukaId) {
            return {
                ...farmersData,
                farmers: farmersData.farmers.filter(
                    f => String(f.taluka_id) === String(userTalukaId)
                ),
                taluka: farmersData.taluka.filter(
                    t => String(t.taluka_id) === String(userTalukaId)
                ),
                villages: farmersData.villages.filter(
                    v => String(v.taluka_id) === String(userTalukaId)
                )
            };
        }
        if (isCategory4) {
            return {
                ...farmersData,
                farmers: farmersData.farmers.filter(
                    f => allowedTalukaIdsCategory4.includes(String(f.taluka_id))
                ),
                taluka: farmersData.taluka.filter(
                    t => allowedTalukaIdsCategory4.includes(String(t.taluka_id))
                ),
                villages: farmersData.villages.filter(
                    v => allowedTalukaIdsCategory4.includes(String(v.taluka_id))
                )
            };
        }
        if (isCategory8) {
            return {
                ...farmersData,
                farmers: farmersData.farmers.filter(
                    f => allowedTalukaIdsCategory8.includes(String(f.taluka_id))
                ),
                taluka: farmersData.taluka.filter(
                    t => allowedTalukaIdsCategory8.includes(String(t.taluka_id))
                ),
                villages: farmersData.villages.filter(
                    v => allowedTalukaIdsCategory8.includes(String(v.taluka_id))
                )
            };
        }
        return farmersData;
    }, [farmersData, isPESACoordinator, userTalukaId, isCategory4, isCategory8]);

    const tabs = useMemo(() => [
        {
            id: "taluka-survey",
            label: "Taluka Wise Survey",
            content: () => (
                <>
                    <DistrictMap
                        data={filteredFarmersData.farmers}
                        datavillage={filteredFarmersData.villages}
                        datataluka={filteredFarmersData.taluka}
                        dataschems={filteredFarmersData.schemes}
                        documents={filteredFarmersData.documents}
                    />
                    <AdvancedAnalytics
                        farmers={filteredFarmersData.farmers}
                        talukas={filteredFarmersData.taluka}
                        schemes={filteredFarmersData.schemes}
                    />
                    <PerformanceScorecard
                        talukas={filteredFarmersData.taluka}
                        farmers={filteredFarmersData.farmers}
                    />
                </>
            )
        },
        {
            id: "aadhaar-status",
            label: "Aadhaar Status",
            content: () => <AadhaarStatusChart farmersData={filteredFarmersData} />
        },
        {
            id: "document-availability",
            label: "Availability of documents",
            content: () => <DocumentAvailabilityChart farmersData={filteredFarmersData} />
        },
        {
            id: "scheme-wise",
            label: "Scheme wise IFR holders",
            content: () => <SchemesBarChart farmersData={filteredFarmersData} />
        },
        {
            id: "general-table",
            label: "General Information",
            content: () => <Showschemstable farmersData={filteredFarmersData} />
        }
    ], [filteredFarmersData]);

    return (
        <div className="w-full">
            <Tabviewflex tabs={tabs} defaultTab="taluka-survey" />
        </div>
    );
};

export default DashboardTalukatabview;
