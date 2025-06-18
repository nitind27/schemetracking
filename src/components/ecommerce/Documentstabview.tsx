"use client";
import React, { useEffect, useState } from 'react';
import { Column } from '../tables/tabletype';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import { FarmdersType } from '../farmersdata/farmers';
import { Documents } from '../Documentsdata/documents';

interface AllFarmersData {
    farmers: FarmdersType[];
    documents: Documents[];
}

interface DocumentUsage {
    document: Documents;
    countHas: number;
    countNotHas: number;
}

const Documentstabview = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [datafarmers, setDatafarmers] = useState<FarmdersType[]>([]);
    const [documents, setDocuments] = useState<Documents[]>([]);
    const [documentUsageList, setDocumentUsageList] = useState<DocumentUsage[]>([]);

    useEffect(() => {
        if (farmersData) {
            setDatafarmers(farmersData.farmers);
            setDocuments(farmersData.documents);
        }
    }, [farmersData]);

    useEffect(() => {
        if (datafarmers.length === 0 || documents.length === 0) {
            setDocumentUsageList([]);
            return;
        }

        // Compute usage for each document
        const usageList: DocumentUsage[] = documents.map(doc => {
            let countHas = 0;

            datafarmers.forEach(farmer => {
                if (typeof farmer.documents === 'string' && farmer.documents.trim() !== '') {
                    const segments = farmer.documents.split('|');
                    const docIds = segments.map(seg => seg.split('--')[0]).filter(Boolean);
                    if (docIds.includes(String(doc.id))) {
                        countHas++;
                    }
                }
            });

            const countNotHas = datafarmers.length - countHas;

            return { document: doc, countHas, countNotHas };
        });

        setDocumentUsageList(usageList);
    }, [datafarmers, documents]);

    const columns: Column<DocumentUsage>[] = [
        {
            key: 'documentName',
            label: 'Document Name',
            accessor: 'document',
            render: (usage) => <span>{usage.document.document_name}</span>
        },
        {
            key: 'available',
            label: 'Available',
            accessor: 'countHas',
            render: (usage) => <span>{usage.countHas}</span>
        },
        {
            key: 'notavailable',
            label: 'Not Available',
            accessor: 'countNotHas',
            render: (usage) => <span>{usage.countNotHas}</span>
        },
        {
            key: 'updated',
            label: 'Updation needed',
            accessor: 'countNotHas',
            render: (usage) => <span>{usage.countNotHas}</span>
        }
    ];

    return (
        <div className='bg-white'>
            <Simpletableshowdata
                data={documentUsageList}
                columns={columns}
                title=""
                filterOptions={[]}
                searchKey="document"
            />
        </div>
    );
};

export default Documentstabview;

