// types.ts
export interface Column<T> {
    key: keyof T | string;       // Unique identifier
    label: string;               // Display header
    render?: (data: T) => React.ReactNode; // Custom renderer
    accessor?: keyof T;          // Data property accessor
    searchable?: boolean;         // Enable/disable column search
    sortable?: boolean;           // Enable/disable column sorting
    width?: string;              // Column width
}
  
  export interface FilterOption {
    value: string;
    label: string;
  }
  
