# Admin Usage Statistics Panel - Documentation

## Overview

The Admin Usage Statistics Panel provides comprehensive monitoring and insights into platform-wide resource usage, AI operations, and subscription metrics.

## Access

- **URL**: `/admin/usage`
- **Authentication**: Requires admin role
- **Navigation**: Available in the admin sidebar as "إحصائيات الاستخدام" (Usage Statistics)

## Features

### 1. Platform-Wide Statistics Dashboard (`/admin/usage`)

#### Overall Statistics Cards
- **Total AI Requests** (this month): Aggregate count across all users
- **Quiz Generations** (this month): Total AI-generated quizzes
- **Video Transcriptions** (this month): Total video-to-text conversions
- **Gemini API Calls** (this month): Total Gemini API usage

#### Top AI Users
- Lists top 10 users by AI request count (this month)
- Shows user name, email, and total AI requests
- Clickable links to individual user usage details
- Visual ranking with numbered badges

#### Usage by Plan
- Breakdown of usage metrics by subscription plan
- Shows active user count per plan
- Displays total AI requests, quiz generations, video transcriptions, and translations per plan
- Helps identify which plans consume the most resources

#### Users Approaching Limits
- Identifies users who have reached ≥80% of their AI request limits
- Color-coded progress bars:
  - **Orange** (80-89%): Approaching limit
  - **Amber** (90-94%): Near limit
  - **Red** (≥95%): Critical
- Table view with:
  - User information
  - Plan name
  - Current usage / Limit
  - Percentage with visual progress bar
  - Quick link to detailed view

#### External API Statistics
- **Gemini API**: Total monthly calls across all users
- **AssemblyAI**: Total monthly requests across all users
- Helps monitor external API costs

### 2. Individual User Usage Details (`/admin/usage/{user}`)

#### User Information Card
- User avatar initial
- Full name and email
- User ID
- Registration date

#### Subscription Details
- Current plan name and price
- Subscription status (active/inactive)
- Billing period
- Start and end dates
- Last usage reset date

#### AI Operations Usage (This Month)
8 detailed metrics with progress bars:
1. **Total AI Requests**: All AI operations combined
2. **Quiz Generations**: AI-generated quizzes
3. **Video Transcriptions**: Video-to-text conversions
4. **Video Analyses**: AI video analysis operations
5. **AI Chat Messages**: AI chatbot interactions
6. **Text Translations**: AI translation requests
7. **Text Summarizations**: AI text summaries
8. **Videos Uploaded**: Video upload count

Each metric shows:
- Current usage / Limit
- Progress bar with color coding
- Percentage used
- "Unlimited" badge for unlimited plans

#### Basic Resources
3 resource metrics:
1. **Projects**: Current project count vs limit
2. **Courses**: Current course count vs limit
3. **Storage (MB)**: Storage used vs limit

#### External API Usage (This Month)
- **Gemini API Calls**: Count with visual card
- **AssemblyAI Requests**: Count with availability indicator
  - Shows if feature is enabled for the user's plan

#### All-Time Totals
Lifetime statistics since user registration:
- Total AI Requests
- Total Quiz Generations
- Total Video Transcriptions
- Total Videos Uploaded

## Controller Methods

### `UsageStatisticsController::index()`

**Purpose**: Display platform-wide usage statistics

**Returns**:
- `$topAiUsers`: Top 10 users by AI usage
- `$totalStats`: Aggregate monthly statistics
- `$usageByPlan`: Usage breakdown by subscription plan
- `$usersNearLimit`: Users at ≥80% of their limits

**Query Optimization**:
- Uses `with()` for eager loading relationships
- Uses `withCount()` for efficient counting
- Filters active subscriptions only

### `UsageStatisticsController::show(User $user)`

**Purpose**: Display detailed usage for a specific user

**Parameters**:
- `$user`: User model (route model binding)

**Returns**:
- `$user`: User instance
- `$usage`: UserUsage model with all metrics
- `$subscription`: Active subscription with plan
- `$limits`: Plan limits array

**Features**:
- Automatically creates usage record if missing
- Resets monthly counters if needed
- Handles users without active subscriptions gracefully

## Routes

```php
// In routes/web.php
Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Usage statistics routes
        Route::get('/usage', [UsageStatisticsController::class, 'index'])
            ->name('usage.index');
        Route::get('/usage/{user}', [UsageStatisticsController::class, 'show'])
            ->name('usage.show');
    });
```

## Blade Templates

### Layout Structure
Both views extend `admin.layout` which provides:
- RTL (right-to-left) support for Arabic
- Tajawal font family
- Font Awesome icons
- Responsive sidebar navigation
- Header with user info
- Flash message handling

### Styling
- **Color Palette**:
  - Indigo: Primary AI/general metrics
  - Emerald: Success/quiz metrics
  - Purple: Video metrics
  - Amber: Gemini API
  - Blue: AssemblyAI
  - Rose: Danger/critical limits
  - Orange: Warning/approaching limits

- **Components**:
  - Rounded cards with subtle shadows
  - Color-coded progress bars
  - Icon badges with background colors
  - Responsive grid layouts
  - Hover effects on interactive elements

## Usage Examples

### Monitoring Platform Health
1. Navigate to `/admin/usage`
2. Check overall statistics cards for anomalies
3. Review "Users Approaching Limits" table
4. Contact users nearing limits to suggest upgrades

### Analyzing User Behavior
1. View "Top AI Users" to identify power users
2. Click on a user to see detailed breakdown
3. Analyze which AI features are most used
4. Identify patterns for feature development

### Cost Management
1. Monitor "External API Statistics" for Gemini and AssemblyAI usage
2. Review "Usage by Plan" to ensure pricing aligns with costs
3. Check if Free plan users are over-consuming resources
4. Adjust plan limits if needed

### User Support
1. When user reports limit issues, navigate to `/admin/usage/{user}`
2. Review their current usage across all metrics
3. Verify subscription status and plan limits
4. Provide upgrade recommendations if appropriate

## Integration with Existing System

### Automatic Usage Tracking
Usage is automatically tracked through:
- `UserUsage::incrementUsage()` method called after successful operations
- Monthly counters auto-reset via `resetIfNeeded()` method
- Controllers: QuizController, LessonSubtitleApiController, LessonVideoApiController

### Middleware Protection
Routes are protected by `EnforceUsageLimits` middleware:
- Checks limits before allowing operations
- Returns 403 with detailed error if limit reached
- Provides upgrade URLs in error responses

### Plan Configuration
Plans are seeded via `PlanSeeder`:
- Free: Very limited (50 AI requests/month)
- Basic: Moderate (300 AI requests/month)
- Pro: High (1,500 AI requests/month)
- Enterprise: Unlimited (-1 values)

## Color Coding Reference

### Progress Bar Colors
- **0-69%**: Plan-specific color (indigo, emerald, purple, etc.)
- **70-89%**: Amber (warning)
- **90-100%**: Rose (critical)

### Status Indicators
- **Active**: Emerald (bg-emerald-50 text-emerald-600)
- **Inactive**: Slate (bg-slate-100 text-slate-500)
- **Available**: Emerald text with checkmark
- **Unavailable**: Slate text with X

## Technical Details

### Database Queries
```php
// Top users query
UserUsage::with('user')
    ->orderByDesc('ai_requests_this_month')
    ->limit(10)
    ->get();

// Usage by plan
Plan::withCount(['subscriptions as active_users'])
    ->with(['subscriptions' => function ($query) {
        $query->where('status', 'active')->with('user.usage');
    }])
    ->get();
```

### Performance Considerations
- Eager loading prevents N+1 queries
- Indexed columns: user_id, ai_requests_this_month, last_reset_at
- Monthly counters reduce data size vs storing all operations
- Aggregate statistics cached at view level (no caching middleware needed)

## Future Enhancements

### Potential Additions
1. **Date Range Filters**: View usage for specific date ranges
2. **Export Functionality**: Export usage data to CSV/Excel
3. **Charts & Graphs**: Visual representation of usage trends over time
4. **Email Alerts**: Notify admins when users reach 90% of limits
5. **Cost Calculator**: Estimate external API costs based on usage
6. **Usage Predictions**: ML-based predictions of when users will hit limits
7. **Bulk Operations**: Upgrade multiple users at once
8. **Custom Reports**: Generate PDF reports for specific users/plans

### Optimization Opportunities
1. **Real-time Updates**: WebSocket for live usage updates
2. **Caching**: Cache aggregate statistics with 5-minute TTL
3. **Background Jobs**: Calculate statistics asynchronously
4. **Pagination**: Add pagination for large user lists
5. **Search**: Search users by name, email, or usage patterns

## Troubleshooting

### Issue: Statistics Not Showing
**Solution**: Ensure migrations have run and UserUsage records exist
```bash
php artisan migrate
php artisan db:seed --class=PlanSeeder
```

### Issue: Limits Not Enforcing
**Solution**: Verify middleware is registered in routes
```bash
php artisan route:list --name=usage.limit
```

### Issue: Progress Bars Not Accurate
**Solution**: Check that monthly counters have been reset
```bash
# In tinker
php artisan tinker
>>> App\Models\UserUsage::all()->each->resetIfNeeded();
```

## Related Files

### Controllers
- `app/Http/Controllers/Admin/UsageStatisticsController.php`
- `app/Http/Controllers/UsageController.php` (API)

### Models
- `app/Models/UserUsage.php`
- `app/Models/Plan.php`
- `app/Models/Subscription.php`

### Middleware
- `app/Http/Middleware/EnforceUsageLimits.php`

### Views
- `resources/views/admin/usage/index.blade.php`
- `resources/views/admin/usage/show.blade.php`
- `resources/views/admin/layout.blade.php`

### Routes
- `routes/web.php` (Admin routes)
- `routes/api.php` (User API routes)

### Migrations
- `database/migrations/2025_12_18_131556_add_detailed_ai_usage_tracking_to_user_usage_table.php`

### Seeders
- `database/seeders/PlanSeeder.php`

## Support

For issues or questions:
1. Check this documentation first
2. Review the USAGE_SYSTEM_DOCUMENTATION.md for API details
3. Check Laravel logs: `storage/logs/laravel.log`
4. Use `php artisan tinker` to inspect data
5. Clear caches: `php artisan cache:clear && php artisan view:clear`
