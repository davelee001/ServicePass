# Frontend Deployment Guide

## Quick Start (Development)

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Access at: http://localhost:3000

## Production Build

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build Locally

```bash
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend API URL

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. Configure environment variables in Netlify dashboard

### Option 3: Traditional Web Server (Nginx/Apache)

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy `dist/` folder to web server

3. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/servicepass/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 4: Docker

1. Create Dockerfile:
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. Build and run:
   ```bash
   docker build -t servicepass-frontend .
   docker run -p 80:80 servicepass-frontend
   ```

## Environment Variables

Required environment variables for production:

```env
VITE_API_URL=https://api.yourbackend.com/api
VITE_SUI_NETWORK=mainnet
```

## Performance Optimization

### Code Splitting
The app uses React Router for automatic code splitting by route.

### Asset Optimization
- Images: Use WebP format where possible
- Icons: React Icons (tree-shakeable)
- Charts: Recharts (loaded only on reports page)

### Caching Strategy
- Static assets: Cache-Control headers set by hosting provider
- API responses: TanStack Query handles caching

## Monitoring

### Add Analytics (Optional)

1. Google Analytics:
   ```javascript
   // Add to index.html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

2. Sentry for Error Tracking:
   ```bash
   npm install @sentry/react
   ```

## CORS Configuration

Ensure your backend allows requests from your frontend domain:

```javascript
// backend/src/server.js
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  credentials: true
}));
```

## Security Checklist

- [ ] Enable HTTPS (SSL certificate)
- [ ] Set secure HTTP headers
- [ ] Configure CORS properly
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting on API
- [ ] Regular dependency updates (`npm audit`)

## Troubleshooting

### Build Fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (requires v16+)

### API Connection Issues
- Verify VITE_API_URL in .env
- Check CORS configuration on backend
- Inspect browser console for errors

### Routing Issues on Production
- Ensure server configured for SPA (Single Page App)
- All routes should serve index.html

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Version Control
Tag releases:
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Backup Strategy

1. **Code**: Git repository (GitHub/GitLab)
2. **Environment Variables**: Secure vault or hosting dashboard
3. **Build Artifacts**: Keep last 3 production builds

## Rollback Procedure

1. Revert to previous Git commit
2. Rebuild: `npm run build`
3. Redeploy to hosting provider

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/yourrepo/issues)
- Review [API Documentation](../docs/API_REFERENCE.md)
- Contact: support@yourproject.com
