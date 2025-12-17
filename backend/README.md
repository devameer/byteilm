# Plan Backend API

Laravel-based backend API for the Plan application.

## Features

- RESTful API with standardized responses
- Authentication using Laravel Sanctum
- Request validation with Form Request classes
- Centralized exception handling
- Database query optimization with indexes
- Security headers and request size limits
- Activity logging
- Usage limits enforcement

## Requirements

- PHP >= 8.2
- Composer
- MySQL/MariaDB
- Redis (optional, for caching)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   composer install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Configure your `.env` file with database credentials
6. Run migrations:
   ```bash
   php artisan migrate
   ```
7. Seed the database (optional):
   ```bash
   php artisan db:seed
   ```

## API Structure

### Base URL
```
/api
```

### Response Format

All API responses follow a standardized format:

**Success Response:**
```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "error": "ERROR_CODE",
  "errors": { ... } // For validation errors
}
```

### Authentication

The API uses Laravel Sanctum for authentication. Include the token in the Authorization header:

```
Authorization: Bearer {token}
```

### Endpoints

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get authenticated user

#### Tasks
- `GET /api/tasks` - List tasks (supports pagination)
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

## Request Validation

All API endpoints use Form Request classes for validation. Validation errors are returned in Arabic.

Example validation error:
```json
{
  "success": false,
  "message": "خطأ في التحقق من البيانات",
  "errors": {
    "title": ["عنوان المهمة مطلوب"]
  }
}
```

## Error Handling

The API uses centralized exception handling. Custom exceptions are available in `App\Exceptions\CustomExceptions`:

- `ResourceNotFoundException` - 404
- `UnauthorizedException` - 401
- `ForbiddenException` - 403
- `ValidationException` - 422
- `BusinessLogicException` - 400
- `RateLimitException` - 429

## Security Features

- CSRF protection for stateful requests
- Rate limiting on authentication endpoints
- Request size limits (10MB default)
- Security headers (CSP, X-Frame-Options, etc.)
- Input sanitization in Form Request classes
- SQL injection prevention via Eloquent ORM

## Performance Optimizations

- Database indexes on frequently queried columns
- Eager loading to prevent N+1 queries
- Pagination support for list endpoints
- Request deduplication (handled on frontend)

## Development

### Running the Server

```bash
php artisan serve
```

### Running Queue Workers

```bash
php artisan queue:work
```

### Code Style

The project uses Laravel Pint for code formatting:

```bash
./vendor/bin/pint
```

## Testing

```bash
php artisan test
```

## License

MIT
