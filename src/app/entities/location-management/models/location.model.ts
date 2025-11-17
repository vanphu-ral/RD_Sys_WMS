export interface Location {
  id?: number;
  code: string;
  name: string;
  area_id: number;
  address: string;
  description?: string;
  is_multi_location: boolean;
  number_of_rack?: number;
  number_of_rack_empty?: number;
  parent_location_id?: number;
  prefix_name?: string;
  prefix_separator?: string;
  child_location_row_count?: number;
  child_location_column_count?: number;
  suffix_separator?: string;
  suffix_digit_len?: string;
  humidity?: number;
  temperature?: number;
  barcode: string;
  is_active?: boolean;
  updated_by?: string;
  sub_locations?: {
    subCode: string;
    locationName: string;
    isEditing?: boolean;
  }[];
}
