# ServicePass Frontend - Feature Documentation

## Table of Contents
1. [User Features](#user-features)
2. [Merchant Features](#merchant-features)
3. [Technical Features](#technical-features)
4. [UI/UX Features](#uiux-features)

---

## User Features

### 1. User Dashboard

**Purpose**: Centralized overview of user's voucher portfolio and activity

**Features**:
- **Total Balance Display**: Aggregate balance across all vouchers
- **Voucher Statistics**:
  - Active vouchers count
  - Expired vouchers count
  - Total redemptions
- **Vouchers by Type**: Visual breakdown showing:
  - Count per voucher type (Education, Healthcare, Transport, Agriculture)
  - Total balance per type
  - Color-coded type indicators with icons
- **Recent Activity**: Last 5 redemptions with:
  - Voucher type
  - Merchant information
  - Amount redeemed
  - Date of redemption

**Navigation**: Auto-loads when user connects wallet

---

### 2. My Vouchers

**Purpose**: Browse and manage all owned vouchers

**Features**:
- **Filter Options**:
  - All vouchers
  - Active vouchers only
  - Expired vouchers only
  - Real-time count updates per filter
  
- **Voucher Cards Display**:
  - Voucher type with icon and color coding
  - Current balance
  - Expiry date with status indicator
  - Merchant ID (if applicable)
  - Shortened object ID for reference
  
- **Visual Indicators**:
  - Color-coded borders by voucher type
  - Expired badge for past-expiry vouchers
  - Grayscale effect on expired vouchers
  
- **Actions** (on active vouchers):
  - Use Voucher button
  - View Details button

**Responsive Design**: Grid layout adapts to screen size

---

### 3. Redemption History

**Purpose**: Complete transaction history and audit trail

**Features**:
- **Summary Statistics**:
  - Total redemptions count
  - Total amount redeemed
  
- **Sorting Options**:
  - By date (latest first)
  - By amount (highest first)
  - By voucher type
  
- **Transaction Table**:
  | Column | Description |
  |--------|-------------|
  | Date & Time | Redemption timestamp |
  | Type | Voucher type with icon |
  | Merchant | Merchant ID |
  | Amount | Redeemed value |
  | Transaction | Link to Sui Explorer |
  
- **Blockchain Verification**: Click transaction ID to view on Sui Explorer

**Export**: Future feature - Export history as CSV/PDF

---

## Merchant Features

### 1. Merchant Dashboard

**Purpose**: Business intelligence and performance overview

**Features**:
- **Key Metrics**:
  - Total revenue (all-time)
  - Total redemptions count
  - Today's revenue
  - Today's redemptions
  
- **Merchant Information Panel**:
  - Merchant ID
  - Business name
  - Wallet address
  - Registration date
  - Active status indicator
  
- **Redemptions by Type**:
  - Visual breakdown per voucher type
  - Count and total amount per type
  - Color-coded categories
  
- **Recent Activity Feed**:
  - Last 5 redemptions
  - Quick overview with amounts and dates

**Auto-refresh**: Data updates on page load

---

### 2. Accept Redemptions

**Purpose**: View and manage voucher redemptions

**Features**:
- **Date Range Filtering**:
  - Start date picker
  - End date picker
  - Clear filters button
  - Real-time data update on filter change
  
- **Summary Panel**:
  - Total redemptions in date range
  - Total value of redemptions
  
- **Redemptions Table**:
  | Column | Information |
  |--------|-------------|
  | Date & Time | When redeemed |
  | Voucher Type | Type badge with icon |
  | Amount | Value redeemed |
  | Redeemed By | User wallet (shortened) |
  | Transaction ID | Blockchain link |
  | Actions | View details button |
  
- **Transaction Verification**: Links to Sui blockchain explorer

**Pagination**: Future feature for large datasets

---

### 3. Reports & Analytics

**Purpose**: Business intelligence with visual analytics

**Features**:

#### Date Range Selection
- Custom start and end date
- Real-time chart updates

#### Export Functionality
- JSON report export
- Includes:
  - Merchant details
  - Date range
  - Total statistics
  - Detailed redemption data

#### Visual Analytics

**1. Revenue Trend Chart (Line Chart)**
- X-axis: Date
- Y-axis: Revenue amount and redemption count
- Shows daily trends over selected period

**2. Redemptions by Type (Pie Chart)**
- Distribution of voucher types
- Percentage breakdown
- Color-coded segments
- Interactive tooltips

**3. Revenue by Voucher Type (Bar Chart)**
- Grouped bars showing:
  - Number of redemptions
  - Total amount per type
- Comparative analysis

#### Detailed Breakdown Table

| Voucher Type | Redemptions | Total Amount | Average | Percentage |
|--------------|-------------|--------------|---------|------------|
| Each type... | Count | Sum | Average | % of total |

**Business Insights**:
- Identify most popular voucher types
- Track revenue trends
- Analyze customer redemption patterns
- Make data-driven business decisions

---

## Technical Features

### 1. State Management
- **React Query (TanStack Query)**:
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Error handling

### 2. API Integration
- **Axios HTTP Client**:
  - Centralized API configuration
  - Request/response interceptors
  - Error handling
  - Automatic retries

### 3. Routing
- **React Router v6**:
  - Client-side routing
  - Nested routes
  - Route protection (future)
  - Deep linking support

### 4. Data Visualization
- **Recharts**:
  - Responsive charts
  - Interactive tooltips
  - Multiple chart types
  - Customizable themes

### 5. Performance Optimizations
- Code splitting by route
- Lazy loading of components
- Memoization where needed
- Optimized re-renders

---

## UI/UX Features

### 1. Responsive Design
- **Mobile-First Approach**:
  - Works on phones (320px+)
  - Tablets (768px+)
  - Desktops (1024px+)
  - Large screens (1440px+)

### 2. Visual Design
- **Color System**:
  - Primary: Blue (#2196F3)
  - Secondary: Green (#4CAF50)
  - Warning: Orange (#FF9800)
  - Danger: Red (#f44336)
  
- **Voucher Type Colors**:
  - Education: Green (#4CAF50)
  - Healthcare: Blue (#2196F3)
  - Transport: Orange (#FF9800)
  - Agriculture: Light Green (#8BC34A)

### 3. User Feedback
- **Loading States**: Spinner and messages
- **Empty States**: Helpful prompts
- **Error States**: Clear error messages
- **Success States**: Confirmation messages (future)

### 4. Accessibility
- Semantic HTML
- ARIA labels (future enhancement)
- Keyboard navigation support
- Color contrast compliance

### 5. Animations
- Smooth page transitions
- Hover effects on interactive elements
- Card elevation on hover
- Fade-in animations

---

## Navigation System

### User Mode Navigation
- Dashboard → Overview
- My Vouchers → Voucher list
- Redemption History → Transaction history

### Merchant Mode Navigation
- Dashboard → Business overview
- Redemptions → Transaction management
- Reports → Analytics and insights

### Toggle Switch
- Easy switch between User and Merchant modes
- Persists active mode
- Different navigation items per mode

---

## Wallet Integration

### Current Implementation
- Simplified mock wallet connection
- Display shortened wallet address
- Merchant ID display for merchants

### Future Enhancements
- Sui Wallet integration (@mysten/dapp-kit)
- Multiple wallet support
- Wallet state persistence
- Transaction signing from UI

---

## Error Handling

### Network Errors
- Retry mechanism via React Query
- User-friendly error messages
- Fallback UI states

### Data Errors
- Validation on forms (future)
- Empty state handling
- Graceful degradation

---

## Future Enhancements

### Planned Features
1. **Real Sui Wallet Integration**
   - Connect to actual Sui wallets
   - Sign transactions from UI
   - Multiple wallet support

2. **QR Code Support**
   - Generate QR codes for vouchers
   - Scan QR codes for redemption

3. **Push Notifications**
   - Redemption alerts
   - Expiry reminders
   - New voucher notifications

4. **Advanced Filtering**
   - Multi-criteria filters
   - Saved filter presets
   - Search functionality

5. **Batch Operations**
   - Bulk voucher management
   - Multiple redemption handling

6. **User Profiles**
   - Save preferences
   - Custom themes
   - Notification settings

7. **Enhanced Reports**
   - PDF export
   - CSV export
   - Scheduled reports
   - Email delivery

8. **Real-time Updates**
   - WebSocket integration
   - Live transaction feed
   - Instant balance updates

---

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Metrics

**Target Metrics**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

**Optimization Techniques**:
- Code splitting
- Lazy loading
- Image optimization
- Efficient re-renders
- Cached API responses

---

## Security Features

1. **Environment Variables**: Sensitive config in .env
2. **API Security**: CORS-protected endpoints
3. **No Private Keys**: Never store private keys in frontend
4. **HTTPS Only**: Production uses encrypted connections
5. **Input Validation**: Sanitize user inputs (future)

---

This documentation serves as a comprehensive guide to all features available in the ServicePass frontend application. For technical implementation details, refer to the code documentation and README files.
