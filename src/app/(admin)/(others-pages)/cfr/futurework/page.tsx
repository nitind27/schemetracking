import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Futurecommer from '@/components/ecommerce/Futurecommer'
import React, { Suspense } from 'react'

const page = async () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/cfrdashboard' },
        { label: 'Future Work', href: '/cfr/futurework' },

    ];
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/futurework`, {
        cache: 'no-store' // So data is always fresh
    });

    const data = await res.json();
    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">

                <Suspense fallback={<Loader />}>
                    <Breadcrumbs
                        title="Future Work"
                        breadcrumbs={breadcrumbItems}
                    />
                    <Futurecommer serverData={data} />
                </Suspense>
            </div>
        </div>
    )
}

export default page
