import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import { basicdetailsofvillagetype, presentworktype } from '@/components/ecommerce/Cfrtype/futurework';
// import Futurecommer from '@/components/ecommerce/Futurecommer'
import Presetntwork from '@/components/ecommerce/Presetntwork';
import React, { Suspense } from 'react'


async function getData(): Promise<{
    basicdetailsofvillage: basicdetailsofvillagetype[];
    presentWorkData: presentworktype[];

  }> {
    const [basicdetailsofvillageRes, presentWorkDataRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/basicdetailsofvillage`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/presentwork`, { cache: 'no-store' }), // Fix this endpoint
    ]);
  
    const [basicdetailsofvillage, presentWorkData] = await Promise.all([
      basicdetailsofvillageRes.json(),
      presentWorkDataRes.json(),
    ]);
     
    return { basicdetailsofvillage, presentWorkData };
  }


const page = async () => {
    const breadcrumbItems = [
        { label: 'Home', href: '/cfrdashboard' },
        { label: 'present work', href: '/cfr/presentwork' },
    ];
    
    const { basicdetailsofvillage, presentWorkData } = await getData();
    console.log("basicdetailsofvillage",basicdetailsofvillage);
    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <Suspense fallback={<Loader />}>
                    <Breadcrumbs
                        title="Present Work"
                        breadcrumbs={breadcrumbItems}
                    />
                    <Presetntwork 
                        serverData={presentWorkData} 
                        basicVillageData={basicdetailsofvillage}
                    />
                </Suspense>
            </div>
        </div>
    )
}

export default page
