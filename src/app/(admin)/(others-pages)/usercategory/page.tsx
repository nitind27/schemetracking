
import Breadcrumbs from '@/components/common/BreadcrumbItem';

import UserCategorydata from '@/components/usercategory/UserCategorydata';
import React from 'react';

const Page = async () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Category', href: '/usercategory' },
  ];

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`, {
    cache: 'no-store' // So data is always fresh
  });

  const data = await res.json();

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
\
          <Breadcrumbs
            title="User Category"
            breadcrumbs={breadcrumbItems}
          />
          <UserCategorydata serverData={data} />

      </div>
    </div>
  );
};

export default Page;
