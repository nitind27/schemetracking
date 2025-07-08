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
import Documentstabview from './Documentstabview';




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
    const [activeTab, setActiveTab] = useState('documents')

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8 mt-5">
                <div>
                    <button
                        className={`w-full py-3 px-2 sm:py-4 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'documents'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                        onClick={() => setActiveTab('documents')}
                    >
                        Document Status
                    </button>
                </div>
                <div>
                    <button
                        className={`w-full py-3 px-2 sm:py-4 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'farmers'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                        onClick={() => setActiveTab('farmers')}
                    >
                        IFR Holders by Scheme
                    </button>
                </div>
                <div>
                    <button
                        className={`w-full py-3 px-2 sm:py-4 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'schemes'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                        onClick={() => setActiveTab('schemes')}
                    >
                        Schemes by IFR Holders
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 md:gap-2 ">
                {activeTab === 'documents' && (

                    <div className='w-full'>

                        <Documentstabview farmersData={farmersData} />
                    </div>
                )}
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
