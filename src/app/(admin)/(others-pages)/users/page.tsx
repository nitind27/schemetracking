
import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Usersdatas from '@/components/usersdata/Usersdatas'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Users', href: '/users' },

  ];
  return (
    <div>
      <Breadcrumbs
        title="Users"
        breadcrumbs={breadcrumbItems}
      />
      <Usersdatas />
    </div>
  )
}

export default page
