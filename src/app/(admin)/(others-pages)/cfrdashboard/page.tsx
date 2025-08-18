import { CFREcommer } from '@/components/ecommerce/CFREcommer';

import React from 'react'

const page = async () => {
    async function fetchMetrics() {

        try {
            const [farmersRes, schemesRes, usersRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`, { cache: 'no-store' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { cache: 'no-store' })
            ]);

            const [farmers, schemes, users] = await Promise.all([
                farmersRes.json(),
                schemesRes.json(),
                usersRes.json()
            ]);

            return {
                farmers,
                schemes,
                users
            };
        } catch (error) {
            console.error('Error fetching metrics:', error);
            return {
                farmers: [],
                schemes: [],
                users: []
            };
        }
    }
    const metrics = await fetchMetrics();
    return (
        <div className="grid grid-cols-6 gap-4 md:gap-6">
            <div className="col-span-12 space-y-6 xl:col-span-7">
                <CFREcommer metrics={metrics} />
            </div>
        </div>
    )
}

export default page
