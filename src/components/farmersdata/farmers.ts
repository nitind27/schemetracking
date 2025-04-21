export interface FarmdersType {
    farmer_id  : number;
    name: string;
    adivasi: string;
    village_id: string;
    taluka_id: string;
    gat_no: string;
    vanksetra: string;
    nivas_seti: string;
    aadhaar_no: string;
    contact_no: string;
    email: string;
    kisan_id: string;
    documents: string;
    schemes: string;
    status: string;
    
  }
  
  export interface FarmdersTypess {
    data: FarmdersType[];
  }