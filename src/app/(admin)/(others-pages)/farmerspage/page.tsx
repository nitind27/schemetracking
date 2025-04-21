import Farmersdata from '@/components/farmersdata/Farmersdata';

// This is a server component by default in Next.js app directory
// const page = async ({
//   searchParams
// }: {
//   searchParams: { page?: string; limit?: string }
// }) => {
//   // Get pagination parameters from URL
//   const page = parseInt(searchParams.page || '1');
//   const limit = parseInt(searchParams.limit || '5');

const page = async () => {
    // Get pagination parameters from URL


    // Fetch paginated data from API
    const res = await fetch(
        `http://localhost:3000/api/farmers?page=${page}&limit=${5}`,
        { cache: 'no-store' }
    );

    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }

    const result = await res.json();

    return (
        <div>
            <Farmersdata
                initialData={result.data}
                total={result.total}
                currentPage={1}
                totalPages={result.totalPages}
                limit={5}
            />
        </div>
    );
};

export default page;
