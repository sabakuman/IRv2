
export type MOUStatus = 'active' | 'pending' | 'expired' | 'draft' | 'under_discussion' | 'closed';
export type MOUUpdateType = 'JCM' | 'meeting' | 'technical' | 'renewal' | 'dispute' | 'general' | 'signing';
export type ActionStatus = 'open' | 'closed' | 'pending';

export interface MOU {
  id: string;
  title_ar: string;
  title_en: string;
  country_name_ar: string;
  country_name_en: string;
  organization_name_ar: string;
  organization_name_en: string;
  flag_url: string;
  type: string;
  type_other_text?: string;
  signed_date: string;
  expiry_date: string;
  close_date?: string;
  status: MOUStatus;
  notes: string;
  closure_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MOUAttachment {
  id: string;
  mou_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface MOUUpdate {
  id: string;
  mou_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  update_type: MOUUpdateType;
  date: string;
  created_by: string;
  created_at: string;
}

export interface MOUAction {
  id: string;
  mou_id: string;
  update_id?: string;
  title: string;
  assigned_to: string;
  due_date: string;
  suggested_date?: string;
  status: ActionStatus;
  notes: string;
  points?: string[];
  close_date?: string;
}

export interface MOUAuditLog {
  id: string;
  mou_id: string;
  action_type: string;
  changed_by: string;
  change_details: string;
  timestamp: string;
}
