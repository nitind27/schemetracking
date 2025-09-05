"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Column } from "../tables/tabletype";
import React from 'react';
import { basicdetailsofvillagetype } from '../ecommerce/Cfrtype/futurework';
import { Simpletableshowdata } from '../tables/Simpletableshowdata';
import CustomModel from '@/common/CustomModel';

interface Props {
    serverData: basicdetailsofvillagetype[];
}

let leafletLoaded = false;
let omnivoreLoaded = false;

const Basicvillageofabout: React.FC<Props> = ({ serverData }) => {
    const [data] = useState<basicdetailsofvillagetype[]>(serverData || []);
    const [selectedVillage, setSelectedVillage] = useState<basicdetailsofvillagetype | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleVillageClick = (villageData: basicdetailsofvillagetype) => {
        setSelectedVillage(villageData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedVillage(null);
    };
    function formatDate(dateString: string | undefined | null): string {
        if (!dateString) return 'उपलब्ध नाही';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'उपलब्ध नाही';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    const getVillageModalData = (village: basicdetailsofvillagetype) => ([
        { label: 'ग्रामसभा/CFR प्राप्त गाव', value: village.village_name, unit: '' },
        { label: 'ग्रामपंचायत', value: village.gp_name, unit: '' },
        { label: 'तालुका', value: village.taluka_name, unit: '' },
        { label: 'जिल्हा', value: 'নंदुरबार', unit: '' },
        { label: 'ग्रामसभा अमलबाजवणी यंत्रणा घोषित झाले आहे का', value: village.cfr_boundary_map || 'उपलब्ध नाही', unit: '' },
        { label: 'कक्ष क्र', value: '15,54', unit: '' },
        { label: 'एकूण CFR क्षेत्र', value: village.total_cfr_area, unit: 'हेक्टर आर' },
        { label: 'प्रमाणपत्र क्रमांक', value: village.certificate_no || 'उपलब्ध नाही', unit: '' },
        { label: 'सामूहिक वन हक्क मिळाल्याची तारीख', value: formatDate(village.date), unit: '' },
        { label: 'चतु:सिमा', value: "पूर्व - जुने धडगाव सीमा  | पश्चिम  - सोमाने | उत्तर - हरणखुरी गावाचे महसुली क्षेत्र  | दक्षिण - कुसुमवेरी वनक्षेत्र सीमा ", unit: '' },
        { label: 'बँक खाते तपशील', value: village.bank_details || 'उपलब्ध नाही', unit: '' },
        { label: 'खाते नंबर ', value: "5481527135", unit: '' },
        { label: 'IFSC ', value: "CBIN0283044", unit: '' },
        { label: 'सामुहिक वन हक्क संवर्धन व व्यवस्थापन आराखडा पूर्ण आहे का ?', value: "होय", unit: '' },
        { label: 'आराखड्याला ग्रामसभेने मंजुरी दिली आहे का ?', value: "होय", unit: '' },
        { label: 'आराखड्याला तालुका कन्व्हर्जन समितीने मान्यता दिली आहे का ?', value: "होय", unit: '' },
        { label: 'आराखड्याला जिल्हा कन्व्हर्जन समितीने मान्यता दिली आहे का ?', value: "होय", unit: '' },
        { label: 'PAN ', value: "AAAPL1234C", unit: '' },
        { label: 'TAN ', value: "PDES03028F", unit: '' },
        { label: 'GST ', value: "27AAAPA1234A1Z5", unit: '' },
        { label: 'DSC info', value: "Mohan Iyer", unit: '' },
        { label: 'Total no of IFR Approved/ pending in CFR', value: "0", unit: '' },
        { label: 'Total No. IFR Area in CFR', value: "0", unit: '' },
        { label: 'Remaining Area', value: "62 hr", unit: '' },
    ]);

    const sabhasadRows = [
        { no: '१.', name: 'अर्जुन जोरदार पावरा', pad: 'अध्यक्ष' },
        { no: '२.', name: 'राकेश लालसिंग पावरा', pad: 'सचिव' },
        { no: '३.', name: 'अभिष्नी प्रमोद पावरा', pad: 'खजिनदार' },
        { no: '४.', name: 'श्रीमती रचना कळपेश', pad: 'सभासद' },
        { no: '५.', name: 'सुभाष सायसिंग पावरा', pad: 'सभासद' },
        { no: '६.', name: 'रविंद्र इमानवेल पावरा', pad: 'सभासद' },
        { no: '७.', name: 'निता लोटन पावरा', pad: 'सभासद' },
        { no: '८.', name: 'रमेश गुरूज्या पावरा', pad: 'सभासद' },
        { no: '९.', name: 'कळपेश सुकलाल पावरा', pad: 'सभासद' },
        { no: '१०.', name: 'रसिकलाल बोमचा पावरा', pad: 'सभासद' },
        { no: '११.', name: 'संदीप वनकर पावरा', pad: 'सभासद' },
    ];

    const columns: Column<basicdetailsofvillagetype>[] = [
        { key: 'taluka', label: 'Taluka', accessor: 'taluka_name', render: (d) => <span>{d.taluka_name}</span> },
        { key: 'grampanchayat', label: 'Grampanchayat', accessor: 'gp_name', render: (d) => <span>{d.gp_name}</span> },
        {
            key: 'village',
            label: 'Village',
            accessor: 'village_name',
            render: (d) => (
                <button
                    onClick={() => handleVillageClick(d)}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium transition-colors duration-200"
                >
                    {d.village_name}
                </button>
            )
        },
    ];

    // Inline KML map — robust: API first (styled), then public; fetch+parse; small-geometry auto-zoom
    const InlineKMLViewer: React.FC<{ kmlFile: string }> = ({ kmlFile }) => {
        const mapEl = useRef<HTMLDivElement | null>(null);
        const mapRef = useRef<any>(null);
        const [loading, setLoading] = useState(true);
      
        const loadScript = (src: string) =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(s);
          });
      
        const ensureAssets = async () => {
          if (!document.querySelector('link[data-leaflet-css="1"]')) {
            const l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            l.setAttribute("data-leaflet-css", "1");
            document.head.appendChild(l);
          }
          await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
          await loadScript("https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js");
        };
      
        // public folder से सही URL बनाना
        const resolveUrl = (file: string) => {
          let p = file.trim();
          if (!p.startsWith("/")) p = "/" + p;
          return p; // /kml/Harankhuri%20CFR.kml
        };
      
        useEffect(() => {
          let destroyed = false;
      
          const init = async () => {
            if (!mapEl.current) return;
            setLoading(true);
            await ensureAssets();
      
            // @ts-ignore
            const L = (window as any).L;
            // @ts-ignore
            const omnivore = (window as any).omnivore;
      
            const map = L.map(mapEl.current, {
              center: [20.5937, 78.9629],
              zoom: 6,
            });
            mapRef.current = map;
      
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
            }).addTo(map);
      
            const url = resolveUrl(kmlFile);
      
            // ✅ यहाँ सही तरीका
            const layer = omnivore.kml(url).addTo(map);
      
            layer.on("ready", () => {
              if (destroyed) return;
              try {
                map.fitBounds(layer.getBounds());
              } catch {}
              setLoading(false);
              setTimeout(() => {
                try {
                  map.invalidateSize();
                } catch {}
              }, 100);
            });
          };
      
          init();
      
          return () => {
            destroyed = true;
            if (mapRef.current) {
              mapRef.current.remove();
            }
          };
        }, [kmlFile]);
      
        return (
          <div className="relative w-full h-[60vh] rounded-lg overflow-hidden border border-gray-200">
            <div ref={mapEl} className="w-full h-full" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>
        );
      };
      

    return (
        <div className="">
            <Simpletableshowdata
                data={data}
                inputfiled={[]}
                columns={columns}
                title="Year"
                filterOptions={[]}
                searchKey="year"
            />

            {selectedVillage && (
  <CustomModel
    isOpen={isModalOpen}
    onClose={handleCloseModal}
    title={`सामुहीक वनहक्क समिती ${selectedVillage.village_name} क्षेत्रातील नरेगा कामाचा माहिती`}
    isFullScreen={true}
  >
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="space-y-10">
        {/* 3 cards stay unchanged */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800">CFR ফलक फोटो</h3>
            </div>
            <div className="p-4 h-48 flex items-center justify-center">
              <img src="/images/GIS/gismap.jpg" alt="CFR फलक फोटो" className="w-full h-full object-cover rounded" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800">CFR प्रमाणपत्र</h3>
            </div>
            <div className="p-4 h-48 flex items-center justify-center">
              <img src="/images/GIS/certi.jpeg" alt="CFR प्रमाणपत्र" className="h-full object-cover rounded" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800">GIS (CFR सिमांकित नकाशा)</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">KML फ़ाइल सीधे नीचे नक्शे में दिखाई जाएगी.</p>
            </div>
          </div>
        </section>

        {/* Village details */}
        <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b border-gray-300 pb-2">गाव तपशील</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-h-[760px] overflow-y-auto pr-3">
            {getVillageModalData(selectedVillage).map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start">
                <div className="w-full sm:w-1/3 text-gray-700 font-semibold text-base mb-1 sm:mb-0">
                  {item.label}:
                </div>
                <div className="w-full sm:w-2/3 text-gray-900 text-base space-y-1">
                  {item.label === 'चतु:सिमा'
                    ? item.value.split(' | ').map((dir, idx2) => <div key={idx2}>{dir}</div>)
                    : item.value}
                  {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Members table */}
        <section className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-300">
            <h2 className="text-2xl font-semibold text-gray-900">सभासद</h2>
          </div>
          <div className="p-6 overflow-x-auto max-h-[360px]">
            <table className="w-full table-fixed border border-gray-300 text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-16 border border-gray-300 px-3 py-2 text-left">अ.न.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">सभासदाचे नाव</th>
                  <th className="w-40 border border-gray-300 px-3 py-2 text-left">पद</th>
                </tr>
              </thead>
              <tbody>
                {sabhasadRows.map((r, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{r.no}</td>
                    <td className="border border-gray-300 px-3 py-2">{r.name}</td>
                    <td className="border border-gray-300 px-3 py-2">{r.pad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Inline KML Map */}
        <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-800">GIS (CFR सिमांकित नकाशा) — Inline</h3>
       
          </div>
          <InlineKMLViewer kmlFile="/kml/Harankhuri CFR.kml" />

        </section>
      </div>
    </div>
  </CustomModel>
)}

        </div>
    );
};

export default Basicvillageofabout;