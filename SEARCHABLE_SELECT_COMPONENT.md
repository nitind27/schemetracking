# SearchableSelect Component

## Overview
A reusable, accessible searchable dropdown component built with React and TypeScript. Provides a user-friendly interface for selecting from a list of options with search functionality.

## Features

### ✅ **Core Functionality**
- **Search Filtering**: Real-time search through options by label or subtitle
- **Keyboard Navigation**: Support for Escape, Enter, and Arrow keys
- **Click Outside**: Automatically closes dropdown when clicking outside
- **Clear Option**: Optional clear button to reset selection
- **Disabled State**: Support for disabled state

### ✅ **User Experience**
- **Visual Feedback**: Selected option highlighted with checkmark
- **Smooth Animations**: Dropdown arrow rotation and transitions
- **Dark Mode Support**: Full dark mode compatibility
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA attributes and keyboard support

### ✅ **Customization**
- **Flexible Options**: Support for value, label, and subtitle
- **Custom Styling**: Customizable className prop
- **Placeholder Text**: Configurable placeholder and search text
- **Theme Integration**: Tailwind CSS classes for consistent styling

## Props Interface

```typescript
interface Option {
  value: string | number;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}
```

## Usage Examples

### Basic Usage
```tsx
import SearchableSelect from '@/components/ui/SearchableSelect';

const users = [
  { value: '1', label: 'John Doe', subtitle: 'Administrator' },
  { value: '2', label: 'Jane Smith', subtitle: 'Manager' },
  { value: '3', label: 'Bob Johnson', subtitle: 'User' }
];

function MyComponent() {
  const [selectedUser, setSelectedUser] = useState('');

  return (
    <SearchableSelect
      options={users}
      value={selectedUser}
      onChange={setSelectedUser}
      searchPlaceholder="Search users..."
      clearable={true}
    />
  );
}
```

### Advanced Usage with Custom Styling
```tsx
<SearchableSelect
  options={departments}
  value={selectedDepartment}
  onChange={handleDepartmentChange}
  searchPlaceholder="Search departments..."
  className="w-full max-w-md"
  disabled={isLoading}
  clearable={true}
/>
```

### Integration with Forms
```tsx
function ProposalForm() {
  const [formData, setFormData] = useState({
    assignedTo: '',
    department: '',
    priority: ''
  });

  return (
    <form>
      <div className="space-y-4">
        <SearchableSelect
          options={users}
          value={formData.assignedTo}
          onChange={(value) => setFormData({...formData, assignedTo: value})}
          searchPlaceholder="Assign to user..."
          clearable={true}
        />
        
        <SearchableSelect
          options={departments}
          value={formData.department}
          onChange={(value) => setFormData({...formData, department: value})}
          searchPlaceholder="Select department..."
        />
      </div>
    </form>
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close dropdown |
| `Enter` | Select first filtered option (if only one) |
| `Arrow Down` | Open dropdown |
| `Tab` | Navigate to next element |

## Styling Classes

### Container Classes
- `relative` - Positioning context for dropdown
- `w-full` - Full width by default
- Custom className prop for additional styling

### Input Classes
- `focus:ring-2 focus:ring-blue-500` - Focus ring
- `dark:bg-gray-700 dark:text-white` - Dark mode support
- `disabled:bg-gray-100 disabled:cursor-not-allowed` - Disabled state

### Dropdown Classes
- `absolute z-50` - Positioning and z-index
- `max-h-60 overflow-y-auto` - Scrollable for long lists
- `shadow-lg` - Drop shadow for depth

## Implementation Details

### State Management
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [isOpen, setIsOpen] = useState(false);
const containerRef = useRef<HTMLDivElement>(null);
```

### Search Logic
```typescript
const filteredOptions = options.filter(option =>
  option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
);
```

### Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

## Benefits

### 1. **Reusability**
- Single component for all searchable dropdowns
- Consistent behavior across the application
- Easy to maintain and update

### 2. **User Experience**
- Fast search with real-time filtering
- Keyboard navigation support
- Clear visual feedback
- Mobile-friendly design

### 3. **Developer Experience**
- TypeScript support with full type safety
- Simple API with sensible defaults
- Comprehensive documentation
- Easy integration with existing forms

### 4. **Performance**
- Efficient filtering algorithm
- Minimal re-renders
- Lightweight implementation
- No external dependencies

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Accessibility Features
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management
- High contrast support

## Future Enhancements

### Planned Features
1. **Multi-select Support**: Allow selecting multiple options
2. **Async Loading**: Support for loading options from API
3. **Grouping**: Group options by category
4. **Custom Rendering**: Custom option and selected value rendering
5. **Virtualization**: Handle large datasets efficiently

### API Extensions
```typescript
// Future props
interface SearchableSelectProps {
  // ... existing props
  multiple?: boolean;
  loading?: boolean;
  onSearch?: (term: string) => void;
  groups?: { label: string; options: Option[] }[];
  renderOption?: (option: Option) => React.ReactNode;
  virtualizeThreshold?: number;
}
```

## Migration Guide

### From Standard Select
```tsx
// Before
<select value={value} onChange={(e) => onChange(e.target.value)}>
  <option value="">Select...</option>
  {options.map(opt => (
    <option key={opt.id} value={opt.id}>{opt.name}</option>
  ))}
</select>

// After
<SearchableSelect
  options={options.map(opt => ({ value: opt.id, label: opt.name }))}
  value={value}
  onChange={onChange}
  searchPlaceholder="Select..."
/>
```

### From React-Select
```tsx
// Before
<Select
  options={options}
  value={options.find(opt => opt.value === value)}
  onChange={(selected) => onChange(selected?.value)}
  isSearchable
/>

// After
<SearchableSelect
  options={options}
  value={value}
  onChange={onChange}
  clearable={true}
/>
```

This component provides a robust, accessible, and user-friendly solution for searchable dropdowns in React applications.