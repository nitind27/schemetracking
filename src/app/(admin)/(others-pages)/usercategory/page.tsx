import Loader from '@/common/Loader';
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import UserCategorydata from '@/components/usercategory/UserCategorydata';
import React, { Suspense } from 'react';

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
    <div>
      <Suspense fallback={<Loader />}>
        <Breadcrumbs
          title="User Category"
          breadcrumbs={breadcrumbItems}
        />
        <UserCategorydata serverData={data} />
      </Suspense>
    </div>
  );
};

export default Page;
