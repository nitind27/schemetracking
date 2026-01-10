// app/(admin)/(others-pages)/talukausers/page.tsx

import Breadcrumbs from '@/components/common/BreadcrumbItem';
import TalukaUsersdatas from '@/components/usersdata/TalukaUsersdatas';
import { UserData } from '@/components/usersdata/Userdata';
import { Taluka } from '@/components/Taluka/Taluka';
import { UserCategory } from '@/components/usercategory/userCategory';
import { Suspense } from 'react';
import Loader from '@/common/Loader';

const getUsers = async (): Promise<UserData[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { cache: 'no-store' });
  return res.json();
};

const getTalukas = async (): Promise<Taluka[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' });
  return res.json();
};

const getUserCategories = async (): Promise<UserCategory[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`, { cache: 'no-store' });
  return res.json();
};

const Page = async () => {
  const [users, talukas, categories] = await Promise.all([
    getUsers(),
    getTalukas(),
    getUserCategories()
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Taluka Users', href: '/talukausers' },
  ];


  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
      <Suspense fallback={<Loader />}>
        <Breadcrumbs title="Taluka Users" breadcrumbs={breadcrumbItems} />
        <TalukaUsersdatas
          users={users}
          datataluka={talukas}
          datausercategorycrud={categories}
        />
      </Suspense>
    </div>
    </div>
  );
};

export default Page;
