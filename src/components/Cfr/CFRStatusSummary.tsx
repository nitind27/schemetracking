// src/components/Cfr/CFRStatusSummary.tsx
"use client";

import React from "react";
import { basicdetailsofvillagetype } from "@/components/ecommerce/Cfrtype/futurework";
import { Village } from "../Village/village";
import CfrModel from "@/common/CfrModel";

type StatusKey =
    | "cfr_boundary_map"
    | "samuhik"
    | "aarakhdaylagramsabhe"
    | "aarakhdyalataluka"
    | "aarakhdayakajilha";

const LABELS: { key: StatusKey; label: string }[] = [
    { key: "cfr_boundary_map", label: "ग्रामसभा अमलबाजवणी यंत्रणा घोषित झाले आहे का ?" },
    { key: "samuhik", label: "सामुहिक वन हक्क संवर्धन व व्यवस्थापन आराखडा पूर्ण आहे का ?" },
    { key: "aarakhdaylagramsabhe", label: "आराखड्याला ग्रामसभेने मंजुरी दिली आहे का ?" },
    { key: "aarakhdyalataluka", label: "आराखड्याला तालुका कन्व्हर्जन समितीने मान्यता दिली आहे का ?" },
    { key: "aarakhdayakajilha", label: "आराखड्याला जिल्हा कन्व्हर्जन समितीने मान्यता दिली आहे का ?" },
];

function norm(v: unknown): string {
    return String(v ?? "").trim();
}

function isYes(v: unknown): boolean {
    const val = norm(v);
    return val === "होय";
}

function isNo(v: unknown): boolean {
    const val = norm(v);
    return val === "नाही";
}

const CFRStatusSummary: React.FC = () => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [basic, setBasic] = React.useState<basicdetailsofvillagetype[]>([]);
    const [villages, setVillages] = React.useState<Village[]>([]);

    const [modalOpen, setModalOpen] = React.useState(false);
    const [activeKey, setActiveKey] = React.useState<StatusKey | null>(null);
    const [modalFilter, setModalFilter] = React.useState<"होय" | "नाही">("होय");

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const base = process.env.NEXT_PUBLIC_API_URL;
                const [bRes, vRes] = await Promise.all([
                    fetch(`${base}/api/basicdetailsofvillage`, { cache: "no-store" }),
                    fetch(`${base}/api/villages`, { cache: "no-store" }),
                ]);
                const [bJson, vJson] = await Promise.all([bRes.json(), vRes.json()]);
                if (!mounted) return;
                setBasic(Array.isArray(bJson) ? bJson : []);
                setVillages(Array.isArray(vJson) ? vJson : []);
            } catch {
                if (!mounted) return;
                setError("Failed to load CFR summary.");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Remove the villageIdSet intersection so all basic rows are counted
    // const villageIdSet = React.useMemo(() => {
    //   const set = new Set<string>();
    //   villages.forEach(v => set.add(String(v.village_id)));
    //   return set;
    // }, [villages]);

    const matchedBasics = React.useMemo(() => {
        return basic; // use all rows (e.g., 330)
    }, [basic]);
    const villageNameById = React.useMemo(() => {
        const m = new Map<string, string>();
        villages.forEach(v => {
            const disp = (v).marathi_name && String((v).marathi_name).trim() !== ''
                ? String((v).marathi_name)
                : (v.name ?? '');
            m.set(String(v.village_id), disp);
        });
        return m;
    }, [villages]);

    const stats = React.useMemo(() => {
        const total = matchedBasics.length || 0;
        return LABELS.map(({ key, label }) => {
            const yesCount = matchedBasics.reduce((acc, row) => (isYes((row)[key]) ? acc + 1 : acc), 0);
            const yesPercent = total ? (yesCount / total) * 100 : 0;
            return { key, label, yesCount, total, yesPercent };
        });
    }, [matchedBasics]);

    const openModalFor = (key: StatusKey) => {
        setActiveKey(key);
        setModalFilter("होय");
        setModalOpen(true);
    };

    const listForModal = React.useMemo(() => {
        if (!activeKey) return [];
        const wantYes = modalFilter === "होय";
        return matchedBasics
            .filter(row => (wantYes ? isYes((row)[activeKey]) : isNo((row)[activeKey])))
            .map(row => {
                const idStr = String(row.village_id);
                const displayName = villageNameById.get(idStr) || '';
                return {
                    id: row.village_id,
                    name: row.village_name ?? displayName,
                    taluka: row.taluka_name ?? "",
                    gp: row.gp_name ?? "",
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name, "mr"));
    }, [activeKey, modalFilter, matchedBasics, villageNameById]);

    if (loading) return <div className="bg-white p-4 rounded border">Loading...</div>;
    if (error) return <div className="bg-white p-4 rounded border text-red-600">{error}</div>;

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">CFRMC Summary</h3>
            </div>

            <div className="p-4 space-y-4">
                {stats.map(s => (
                    <div key={s.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700 font-medium">{s.label}</div>
                            <div className="text-[16px] text-black font-bold">
                                होय: {s.yesCount}/{s.total} ({s.yesPercent.toFixed(1)}%)
                            </div>
                        </div>

                        <div className="flex h-3 rounded overflow-hidden border border-gray-300 bg-gray-100">
                            <div
                                className="bg-green-500 cursor-pointer"
                                style={{ width: `${s.yesPercent}%` }}
                                onClick={() => openModalFor(s.key)}
                                title="होय असलेल्या गावांची यादी पाहण्यासाठी क्लिक करा"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <CfrModel
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    LABELS.find(l => l.key === activeKey)?.label
                        ? `${LABELS.find(l => l.key === activeKey)!.label} - ${modalFilter}`
                        : "Details"
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700">स्थिती</label>
                        <select
                            className="border rounded px-2 py-1 text-sm"
                            value={modalFilter}
                            onChange={(e) => setModalFilter(e.target.value === "नाही" ? "नाही" : "होय")}
                        >
                            <option value="होय">होय</option>
                            <option value="नाही">नाही</option>
                        </select>
                        <div className="text-sm text-gray-600">
                            एकूण गावे: {listForModal.length}
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto border rounded">
                        <table className="min-w-full text-sm border border-gray-300 border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left px-3 py-2 border border-gray-300">अ.क्र</th>
                                    <th className="text-left px-3 py-2 border border-gray-300">গाव</th>
                                    <th className="text-left px-3 py-2 border border-gray-300">ग्रामपंचायत</th>
                                    <th className="text-left px-3 py-2 border border-gray-300">तालुका</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listForModal.map((v, index) => (
                                    <tr key={v.id} className="odd:bg-white even:bg-gray-50">
                                        <td className="px-3 py-2 border border-gray-300">{index + 1}</td>
                                        <td className="px-3 py-2 border border-gray-300">{v.name}</td>
                                        <td className="px-3 py-2 border border-gray-300">{v.gp}</td>
                                        <td className="px-3 py-2 border border-gray-300">{v.taluka}</td>
                                    </tr>
                                ))}
                                {listForModal.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-4 text-gray-500 text-center border border-gray-300" colSpan={4}>
                                            उपलब्ध डेटा नाही
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CfrModel>
        </div>
    );
};

export default CFRStatusSummary;