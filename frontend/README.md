# Plan Frontend

React-based frontend application for the Plan project.

## Features

- Modern React 19 with Hooks
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Error boundaries for error handling
- Toast notifications system
- Loading skeletons
- Request deduplication
- Code splitting and lazy loading
- Debounced search inputs

## Requirements

- Node.js >= 18
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API URL in `src/config.js`

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/        # React contexts (Auth, Theme, Toast, etc.)
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── routes/         # Route configuration
├── services/       # API services
├── styles/         # Global styles
└── utils/          # Utility functions
```

## Key Components

### ErrorBoundary
Catches React errors and displays a user-friendly error page.

### ToastContainer
Displays toast notifications for success, error, warning, and info messages.

### LoadingSkeleton
Provides skeleton loaders for better UX during data fetching.

## Hooks

### useDebounce
Debounces a value to limit how often it updates:

```javascript
const debouncedSearch = useDebounce(searchTerm, 500);
```

### useToast
Shows toast notifications:

```javascript
const toast = useToast();
toast.success('تم الحفظ بنجاح');
toast.error('حدث خطأ');
```

## API Integration

The API service (`src/services/api.js`) includes:

- Automatic token injection
- Request deduplication
- Error handling with toast notifications
- CSRF token management

## Performance Optimizations

- **Code Splitting**: Routes are lazy-loaded
- **Request Deduplication**: Prevents duplicate API calls
- **Debouncing**: Search inputs are debounced
- **Memoization**: Components use React.memo where appropriate
- **Loading States**: Skeleton loaders instead of spinners

## Error Handling

- Global error boundary catches React errors
- API errors are handled by interceptors
- Toast notifications for user feedback
- Retry logic for failed requests

## Styling

The project uses Tailwind CSS with custom configuration. See `tailwind.config.js` for theme customization.

## Development

### Running Dev Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## License

MIT
