import Loader from '@/common/Loader';
import Basicvillageofabout from '@/components/Cfr/Basicvillageofabout';
import Breadcrumbs from '@/components/common/BreadcrumbItem';

import React, { Suspense } from 'react'

const page = async () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/cfrdashboard' },
        { label: 'Basic Details Of Village', href: '/cfr/basicvillageofabout' },

    ];
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/basicdetailsofvillage`, {
        cache: 'no-store' // So data is always fresh
    });

    const data = await res.json();
    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">

                <Suspense fallback={<Loader />}>
                    <Breadcrumbs
                        title="Basic Details Of Village"
                        breadcrumbs={breadcrumbItems}
                    />
                    <Basicvillageofabout serverData={data} />
                </Suspense>
            </div>
        </div>
    )
}

export default page
