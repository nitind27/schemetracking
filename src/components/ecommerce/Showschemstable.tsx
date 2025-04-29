'use client'
import React, { useState } from 'react'
import SchemesDashboardcounting from './SchemesDashboardcounting'

import { UserCategory } from '../usercategory/userCategory';
import { Schemesdatas } from '../schemesdata/schemes';
import { FarmdersType } from '../farmersdata/farmers';
import FarmersDashboard from './FarmersDashboard';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import { Scheme_year } from '../Yearmaster/yearmaster';
import { Documents } from '../Documentsdata/documents';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';




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

const Showschemstable = ({ farmersData }: { farmersData: AllFarmersData }) => {

    // State management for active tab
    const [activeTab, setActiveTab] = useState('farmers')

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-2 mb-8">
                <div>
                    <button
                        className={`p-5 w-full  ${activeTab === 'farmers' ? 'bg-blue-500' : 'bg-blue-300'
                            } text-white`}
                        onClick={() => setActiveTab('farmers')}
                    >
                        IFR holders wise schemes
                    </button>
                </div>
                <div>
                    <button
                        className={`p-5 w-full  ${activeTab === 'schemes' ? 'bg-blue-500' : 'bg-blue-300'
                            } text-white`}
                        onClick={() => setActiveTab('schemes')}
                    >

                        Scheme wise IFR holders
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 md:gap-2 ">
                {activeTab === 'schemes' && (

                    <div className='w-full'>

                        <SchemesDashboardcounting farmersData={farmersData} />
                    </div>
                )}

                {activeTab === 'farmers' && (
                    <div className='w-full '>

                        <FarmersDashboard farmersData={farmersData} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Showschemstable
