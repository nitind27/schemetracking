
import Breadcrumbs from '@/components/common/BreadcrumbItem'
import UserCategorydata from '@/components/usercategory/UserCategorydata'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Category', href: '/usercategory' },

  ];
  return (
    <div>
      <Breadcrumbs 
        title="User Category" 
        breadcrumbs={breadcrumbItems} 
      />
      <UserCategorydata />
      
    </div>
  )
}

export default page
