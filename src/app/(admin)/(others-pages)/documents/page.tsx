import Breadcrumbs from '@/components/common/BreadcrumbItem'
import Documentsdata from '@/components/Documentsdata/Documentsdata'
import React from 'react'

const page = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Documents', href: '/documents' },

  ];
  return (
    <div>
      <Breadcrumbs
        title="Documents"
        breadcrumbs={breadcrumbItems}
      />
      <Documentsdata />
    </div>
  )
}

export default page
