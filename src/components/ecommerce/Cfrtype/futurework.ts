export interface Futureworktype {
    future_work_id : number;
    work_name: string;
    total_area: string;
    estimated_amount: string;
    department_name: string;
    implementing_method: string;
    work_status: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;

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
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;

}
export interface basicdetailsofvillagetype {
    village_detail_id   : number;
    taluka_id: string;
    gp_id: string;
    village_id: string;
    total_cfr_area: string;
    room_number: string;
    certificate_no: string;
    date: string;
    cfrmc_details: string;
    bank_details: string;
    cfr_boundary_map: string;
    cfr_work_info: string;
    status: string;
    created_at: string;
    updated_at: string;

}
