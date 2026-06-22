# Demo Mode - Simple Implementation

## Overview
Demo mode allows users to login as admin without creating a real account. When in demo mode, any attempt to add/edit/delete data will show an alert message.

## Quick Start

### For Users:
1. Click "Try Demo Admin" button on landing page
2. Instantly logged in as demo admin
3. Browse the admin panel freely
4. See "Demo" badge in header and sidebar
5. Try to add/edit/delete → See alert message

### For Developers:

## Using Demo Mode Check

### Method 1: Simple Alert Check
```typescript
import { showDemoAlert } from "@/lib/demo-utils";

function handleAddUser() {
  if (showDemoAlert()) return; // Shows alert and stops execution
  
  // Normal add user logic here
  api.createUser(data);
}
```

### Method 2: Wrapper Function (Recommended)
```typescript
import { withDemoCheck } from "@/components/shared/demo-button-wrapper";

// Wrap any function
const handleDelete = withDemoCheck((id: string) => {
  api.deleteUser(id);
});

// Use in component
<Button onClick={() => handleDelete(userId)}>
  Delete User
</Button>
```

### Method 3: Hook
```typescript
import { useDemoMode } from "@/components/shared/demo-button-wrapper";

function MyComponent() {
  const { isDemo, withDemoCheck } = useDemoMode();
  
  const handleClick = withDemoCheck(() => {
    // Your logic here
  });
  
  return <Button onClick={handleClick}>Click Me</Button>;
}
```

## Example Implementation

### Before (Normal Mode):
```typescript
function handleCreateSupplier(data: SupplierData) {
  api.createSupplier(data).then(() => {
    refresh();
  });
}
```

### After (With Demo Check):
```typescript
import { showDemoAlert } from "@/lib/demo-utils";

function handleCreateSupplier(data: SupplierData) {
  if (showDemoAlert()) return; // Add this line
  
  api.createSupplier(data).then(() => {
    refresh();
  });
}
```

## Alert Message (Vietnamese):
```
⚠️ Chức năng này không khả dụng trong chế độ demo.

Đây là phiên làm việc tạm thời. Các thay đổi sẽ không được lưu vào hệ thống.
```

## Files Created:
- `frontend/src/lib/demo-utils.ts` - Simple demo utilities
- `frontend/src/components/shared/demo-button-wrapper.tsx` - Wrapper functions

## How to Apply to Existing Pages:

### Users Page (`dashboard/users/page.tsx`):
```typescript
// In create/edit/delete handlers:
const handleCreate = withDemoCheck(async (data) => {
  await api.createUser(data);
  refresh();
});
```

### Suppliers Page (`dashboard/suppliers/page.tsx`):
```typescript
const handleCreate = withDemoCheck(async (data) => {
  await api.createSupplier(data);
  refresh();
});
```

### Products Page:
```typescript
const handleUpdate = withDemoCheck(async (id, data) => {
  await api.updateProduct(id, data);
  refresh();
});
```

## Benefits:
1. ✅ Simple implementation
2. ✅ No complex localStorage
3. ✅ No mock API needed
4. ✅ Clear user feedback
5. ✅ Easy to apply to any component
6. ✅ No backend errors

## Testing:
1. Login as demo admin
2. Navigate to any page (Users, Suppliers, Products, etc.)
3. Try to click "Add New" or "Edit" or "Delete"
4. See alert message
5. Click OK to dismiss
6. No data is modified

## Notes:
- Demo mode is detected via `localStorage.getItem("halalchain_demo_admin")`
- Alert is shown using browser's native `alert()` function
- No data is sent to backend in demo mode
- All CRUD operations are blocked with friendly message