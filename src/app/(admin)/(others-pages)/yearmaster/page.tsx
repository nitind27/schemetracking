import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Yearmasterdata from '@/components/Yearmaster/Yearmasterdata'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Years', href: '/yearmaster' },

  ];
  return (
    <div>
      <Breadcrumbs
        title="Years"
        breadcrumbs={breadcrumbItems}
      />
      <Yearmasterdata />
    </div>
  )
}

export default page
