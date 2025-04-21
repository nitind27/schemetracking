import Breadcrumbs from '@/components/common/BreadcrumbItem'
import Farmersdata from '@/components/farmersdata/Farmersdata'
import React from 'react'

const page = () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'IFR holders', href: '/farmerspage' },

    ];
    return (
        <div>
            <Breadcrumbs
                title="IFR holders"
                breadcrumbs={breadcrumbItems}
            />
            <Farmersdata />
        </div>
    )
}

export default page
