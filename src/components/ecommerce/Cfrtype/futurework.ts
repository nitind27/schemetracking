export interface Futureworktype {
    future_work_id : number;
    work_name: string;
    total_area: string;
    estimated_amount: string;
    department_name: string;
    implementing_method: string;
    username: string;
    work_status: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    type?: string;
    work_photo?: string; // comma-separated image filenames
    // NEW OPTIONAL FIELDS for dropdowns & proper referencing:
    taluka_name?: string;
    gp_name?: string;
    village_name?: string;
    query?: string;
}


export interface presentworktype {
    work_id  : number;
    work_name: string;
    total_area: string;
    estimated_amount: string;
    department_name: string;
    implementing_method: string;
    work_status: string;
    work_photo: string;
    start_date: string;
    end_date: string;
    worker_number: string;
    username: string;
    user_id: string;
    status: string;
    created_at: string;
    unit: string;
    updated_at: string;
    type: string;
    gis_location?: string; // KML file path or URL
    // Add these new fields
    taluka_name?: string;
    village_name?: string;
    gp_name?: string;
    latitude?: string | number; // Latitude coordinate
    longitude?: string | number; // Longitude coordinate
}
export interface basicdetailsofvillagetype {
    village_detail_id   : number;
    taluka_id: string;
    gp_id: string;
    village_id: string;
    total_cfr_area: string;
    room_number: string;
    photo: string;
    tharav: string;
    prociding: string;
    certificate_no: string;
    date: string;
    cfrmc_details: string;
    bank_details: string;
    cfr_boundary_map: string;
    cfr_work_info: string;
    certificate_img: string;
    bankname: string;
    ifsc: string;
    accountno: string;
    grampanchyatambvajliyesno: string;
    gramsabhabankno: string;
    totalifrapp: string;
    totalnoifrarea: string;
    remainingarea: string;
    position: string;
    contact_number: string;
    nameofsabhasad: string;
    sabhasad_array: string;
    samuhik: string;
    aarakhdaylagramsabhe: string;
    aarakhdyalataluka: string;
    aarakhdayakajilha: string;
    pan: string;
    gst: string;
    dsc: string;
    north: string;
    east: string;
    west: string;
    south: string;
    tan: string;
    taluka_name: string;
    village_name: string;
    gp_name: string;
    kmlfile: string;
    gis: string;
    gis_2: string;
    cfrmp_pdf: string;
    status: string;
    created_at: string;
    updated_at: string;

}
