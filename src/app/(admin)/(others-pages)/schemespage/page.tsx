import Breadcrumbs from '@/components/common/BreadcrumbItem';
import Schemesdata from '@/components/schemesdata/Schemesdata'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Schemes', href: '/schemespage' },

  ];
  return (
    <div>
      <Breadcrumbs
        title="Schemes Master"
        breadcrumbs={breadcrumbItems}
      />
      <Schemesdata />
    </div>
  )
}

export default page
