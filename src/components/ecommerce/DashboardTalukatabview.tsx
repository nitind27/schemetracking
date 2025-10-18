"use client";

import React from 'react';
// import TabView from '@/components/common/TabView';
// import Talukawiseserve from '@/components/svg/Talukawiseserve';
import AadhaarStatusChart from './AadhaarStatusChart';
import DocumentAvailabilityChart from './DocumentAvailabilityChart';
import SchemesBarChart from './SchemesBarChart';
import Showschemstable from './Showschemstable';
import DistrictMap from './DistrictMap';

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
    // Calculate talukaCounts from farmers data
 
    const tabs = [
        {
            id: "taluka-survey",
            label: "Taluka Wise Survey",
            content:

                <DistrictMap
                    data={farmersData.farmers}
                    datavillage={farmersData.villages}
                    datataluka={farmersData.taluka}
                    dataschems={farmersData.schemes}
                    documents={farmersData.documents}
                />



        },
        {
            id: "aadhaar-status",
            label: "Aadhaar Status",
            content:
                <AadhaarStatusChart farmersData={farmersData} />

        },
        {
            id: "document-availability",
            label: "Availability of documents",
            content:

                <DocumentAvailabilityChart farmersData={farmersData} />

        },
        {
            id: "scheme-wise",
            label: "Scheme wise IFR holders",
            content:

                <SchemesBarChart farmersData={farmersData} />

        },
        {
            id: "general-table",
            label: "General Information",
            content:

                <Showschemstable farmersData={farmersData} />
        }
    ];

    return (
        <div className="w-full">
            <Tabviewflex tabs={tabs} defaultTab="taluka-survey" />
        </div>
    );
};

export default DashboardTalukatabview;
