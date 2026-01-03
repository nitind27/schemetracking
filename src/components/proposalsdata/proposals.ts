export interface Proposal {
  proposal_id?: number;
  proposal_category_id: number;
  pdf?: string;
  land_details?: string;
  number_of_tree?: number;
  beneficiaries?: string;
  supporting_map_doc?: string;
  remarks?: string;
  taluka_id?: number;
  gp_id?: number;
  village_id?: number;
  forward_to?: string;
  work_status?: string;
  work_status_record?: string;
  proposal_document_id?: number;
  user_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  taluka_name?: string;
  gp_name?: string;
  village_name?: string;
  user_name?: string;
}

