'use client';
import { useRouter } from 'next/navigation';
import { Simpletableshowdatafilter } from '../tables/Simpletableshowdatafilter';

interface Farmer {
  id: string;
  name: string;
  // Add other actual fields from your data here
  // Example:
  // scheme_name: string;
  // created_at: Date;
  // updated_at: Date;
}

interface FarmersdataProps {
  initialData: Farmer[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

const Farmersdata = ({
  initialData,
  total,
  currentPage,
  totalPages,
  limit
}: FarmersdataProps) => {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    router.push(`/farmers?page=${newPage}&limit=${limit}`);
  };

  return (
    <div>
      <Simpletableshowdatafilter
        data={initialData}
        columns={[
          {
            key: 'scheme_name',
            label: 'Category Name',
            accessor: 'name',
            render: (data: Farmer) => <span>{data.name}</span>
          }
        ]}
        title="User Category"
        searchKey="name"
        rowsPerPage={limit}
        serverSidePagination={{
          total,
          currentPage,
          totalPages,
          onPageChange: handlePageChange
        }}
      />
    </div>
  );
};

export default Farmersdata;
