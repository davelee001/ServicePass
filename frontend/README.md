# ServicePass Frontend

A modern, responsive web application for the ServicePass blockchain-based voucher system.

## Features

### User Dashboard
- **View Vouchers**: Browse all your service vouchers with real-time balance updates
- **Check Balance & Expiry**: Monitor voucher balances and expiration dates
- **Redemption History**: Track all your voucher redemptions with detailed transaction information
- **Voucher Analytics**: View statistics grouped by voucher type (Education, Healthcare, Transport, Agriculture)

### Merchant Dashboard
- **Accept Redemptions**: Process voucher redemptions from users
- **Transaction History**: View complete history of all redemptions
- **Generate Reports**: Create detailed analytics reports with charts and export functionality
- **Revenue Analytics**: Track daily, weekly, and monthly revenue with visual charts

## Technology Stack

- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend server running (see `/backend` directory)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   copy .env.example .env
   ```

4. Update `.env` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Navigation.jsx        # Main navigation component
│   ├── pages/
│   │   ├── UserDashboard.jsx     # User dashboard
│   │   ├── VoucherList.jsx       # Voucher list view
│   │   ├── RedemptionHistory.jsx # User redemption history
│   │   ├── MerchantDashboard.jsx # Merchant dashboard
│   │   ├── MerchantRedemptions.jsx # Merchant redemptions view
│   │   └── MerchantReports.jsx   # Merchant reports & analytics
│   ├── services/
│   │   └── api.js                # API service layer
│   ├── utils/
│   │   └── helpers.js            # Utility functions
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # App entry point
│   └── index.css                 # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Key Features Explained

### User Features

#### Dashboard Overview
- Real-time statistics showing total balance, active vouchers, expired vouchers, and redemption count
- Vouchers grouped by type with visual indicators
- Recent redemptions list

#### Voucher Management
- Filter vouchers by status (All, Active, Expired)
- Detailed voucher cards showing balance, expiry, and merchant info
- Visual indicators for voucher types and expiration status

#### Redemption History
- Sortable transaction history
- Export functionality for records
- Links to blockchain explorer for transaction verification

### Merchant Features

#### Dashboard Analytics
- Total revenue and redemption statistics
- Today's performance metrics
- Redemptions breakdown by voucher type
- Recent activity feed

#### Redemption Management
- Date range filtering
- Detailed transaction table
- Blockchain transaction verification links

#### Reports & Analytics
- Interactive charts (Line, Bar, Pie)
- Revenue trend analysis
- Voucher type distribution
- Detailed breakdown tables
- Export reports as JSON

## API Integration

The frontend communicates with the backend through a RESTful API:

- **GET** `/api/vouchers/owner/:address` - Get user's vouchers
- **GET** `/api/redemptions/user/:walletAddress` - Get user's redemption history
- **GET** `/api/merchants/:merchantId` - Get merchant details
- **GET** `/api/redemptions/merchant/:merchantId` - Get merchant's redemptions

## Styling

The application uses CSS variables for theming and responsive design:

- Custom color schemes for different voucher types
- Responsive grid layouts
- Mobile-first design approach
- Smooth transitions and animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Keep components modular and reusable
4. Add proper error handling
5. Write meaningful commit messages

## License

MIT License - See LICENSE file for details
