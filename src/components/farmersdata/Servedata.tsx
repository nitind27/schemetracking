"use client";

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';

import { Column } from "../tables/tabletype";
import { FarmdersType } from './farmers';
import { Village } from '../Village/village';
import { Taluka } from '../Taluka/Taluka';
import { Schemesdatas } from '../schemesdata/schemes';

import Ifrsmaplocations from './Ifrsmaplocations';
import { Documents } from '../Documentsdata/documents';
import { Servefilterdatatable } from '../tables/Servefilterdatatable';

interface FarmersdataProps {
    data: FarmdersType[];
    datavillage: Village[];
    datataluka: Taluka[];
    dataschems: Schemesdatas[];
    documents: Documents[];
}

const Servedata: React.FC<FarmersdataProps> = ({
    data,
    datavillage,
    datataluka,
    dataschems,
    documents,
}) => {
    const [filters, setFilters] = useState({
        talukaId: null as string | null,
        villageId: null as string | null,
        categoryName: null as string | null,
        aadhaarwith: null as string | null
    });

    const [selectedTaluka, setSelectedTaluka] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const talukaId = sessionStorage.getItem('taluka_id');
        const villageId = sessionStorage.getItem('village_id');
        const categoryName = sessionStorage.getItem('category_name');
        const aadhaarwith = sessionStorage.getItem('aadharcount');

        setFilters({
            talukaId,
            villageId,
            categoryName,
            aadhaarwith
        });

        // Also set UI filters
        setSelectedTaluka('');
        setSelectedVillage('');
    }, []);

    const talukaOptions = useMemo(() =>
        datataluka.map((taluka) => ({
            label: taluka.name,
            value: taluka.taluka_id.toString()
        })),
        [datataluka]
    );
    console.log("datadata", data)

    const villageOptions = useMemo(() =>
        selectedTaluka
            ? datavillage
                .filter(village => village.taluka_id == selectedTaluka)
                .map(village => ({
                    label: village.marathi_name,
                    value: village.village_id.toString()
                }))
            : [],
        [datavillage, selectedTaluka]
    );


    const filteredFarmers = useMemo(() => {
        let result = data;

        // Apply date filter if selected
        if (selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            result = result.filter(farmer => {
                if (!farmer.update_record) return false;

                // Split the update_record by pipe and check each segment
                return farmer.update_record.split('|').some(segment => {
                    // Extract the date part from each segment
                    const datePart = segment.split('/')[1];
                    return datePart === dateStr;
                });
            });
        }

        if (
            selectedTaluka === '0' &&
            selectedVillage === '0' &&
            filters.talukaId === '0' &&
            filters.villageId === '0'
        ) {
            return result;
        }

        if (!selectedTaluka && !selectedVillage) {
            return result;
        }


        if (selectedTaluka && filters.aadhaarwith != '1' && filters.aadhaarwith != '0') {
            result = result.filter(
                (f) =>
                    f.taluka_id === selectedTaluka
            );
        }

        if (selectedTaluka && filters.aadhaarwith == '1') {
            result = result.filter(
                (f) =>
                    f.taluka_id === selectedTaluka &&
                    (f.aadhaar_no != '')
            );
        }
        if (selectedVillage) {
            result = result.filter(
                (f) =>
                    f.village_id === selectedVillage &&
                    (filters.aadhaarwith !== '1' || f.aadhaar_no !== '')
            );
        }

        return result;
    }, [data, filters, selectedTaluka, selectedVillage, selectedDate]);

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
    };

    const handleTodayClick = () => {
        const today = new Date();
        setSelectedDate(today);
    };

    const columns: Column<FarmdersType>[] = [
        {
            key: 'name',
            label: 'Name',
            accessor: 'name',
            render: (item) => <span>{item.name}</span>
        },
        {
            key: 'adivasi',
            label: 'Adivasi',
            accessor: 'adivasi',
            render: (item) => <span>{item.adivasi}</span>
        },
        {
            key: 'village_id',
            label: 'Village',
            accessor: 'village_id',
            render: (item) => (
                <span>
                    {datavillage.find(v => v.village_id === Number(item.village_id))?.name}
                </span>
            )
        },
        {
            key: 'taluka_id',
            label: 'Taluka',
            accessor: 'taluka_id',
            render: (item) => (
                <span>
                    {datataluka.find(t => t.taluka_id === Number(item.taluka_id))?.name}
                </span>
            )
        },
        {
            key: 'gat_no',
            label: 'Gat No',
            accessor: 'gat_no',
            render: (item) => <span>{item.gat_no}</span>
        },
        {
            key: 'vanksetra',
            label: 'Vanksetra',
            accessor: 'vanksetra',
            render: (item) => <span>{item.vanksetra}</span>
        },
        {
            key: 'nivas_seti',
            label: 'Nivas Seti',
            accessor: 'nivas_seti',
            render: (item) => <span>{item.nivas_seti}</span>
        },
        {
            key: 'aadhaar_no',
            label: 'Aadhaar No',
            accessor: 'aadhaar_no',
            render: (item) => <span>{item.aadhaar_no}</span>
        },
        {
            key: 'contact_no',
            label: 'Contact No',
            accessor: 'contact_no',
            render: (item) => <span>{item.contact_no}</span>
        },
        {
            key: 'email',
            label: 'Email',
            accessor: 'email',
            render: (item) => <span>{item.email}</span>
        },
        {
            key: 'kisan_id',
            label: 'Kisan Id',
            accessor: 'kisan_id',
            render: (item) => <span>{item.kisan_id}</span>
        },
        {
            key: 'documents',
            label: 'Documents',
            accessor: 'documents',
            render: (item) => {
                const segments = typeof item.documents === "string" ? item.documents.split('|') : [];
                const docIds = segments.map(seg => seg.split('--')[0]).filter(Boolean);
                const docNames = docIds
                    .map(id => {
                        const doc = documents.find(d => String(d.id) === id);
                        return doc ? doc.document_name : null;
                    })
                    .filter(Boolean);
                return <span>{docNames.join(', ')}</span>;
            }
        },
        {
            key: 'schemes',
            label: 'Schemes',
            accessor: 'schemes',
            render: (item) => (
                <span>
                    {dataschems.find(s => s.scheme_id === Number(item.schemes))?.scheme_name}
                </span>
            )
        },
        {
            key: 'location',
            label: 'Location',
            render: (item) => {
                const coordinates = item.gis
                    ?.split('|')
                    .map((entry) => {
                        const parts = entry.split('}');
                        if (parts.length >= 2) {
                            const lat = parseFloat(parts[0]);
                            const lng = parseFloat(parts[1]);
                            if (!isNaN(lat) && !isNaN(lng)) {
                                return { lat, lng };
                            }
                        }
                        return null;
                    })
                    .filter((coord) => coord !== null);

                return (
                    <>
                        {coordinates && coordinates.length > 0 && (
                            <Ifrsmaplocations coordinates={coordinates as { lat: number; lng: number }[]} />
                        )}
                    </>
                );
            }
        }
    ];

    return (
        <div className="">
      
            <Servefilterdatatable
                key={JSON.stringify(filteredFarmers)}
                data={filteredFarmers}
                inputfiled={[]}
                columns={columns}
                title="User Category"
                filterOptions={[
                    {
                        label: "Taluka",
                        options: talukaOptions,
                        value: selectedTaluka,
                        onChange: (value) => {
                            setSelectedTaluka(value);
                            setSelectedVillage('');
                        }
                    },
                    {
                        label: "Village",
                        options: villageOptions,
                        value: selectedVillage,
                        onChange: (value) => setSelectedVillage(value)
                    }
                ]}
                dateFilter={{
                    selectedDate,
                    onDateChange: handleDateChange,
                    onTodayClick: handleTodayClick
                }}
                submitbutton={[]}
            />
        </div>
    );
};

export default Servedata;