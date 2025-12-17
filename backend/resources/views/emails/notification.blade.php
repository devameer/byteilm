<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin: 20px 0;
        }
        .message {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #4f46e5;
            margin: 15px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background-color: #e0e7ff;
            color: #4338ca;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $notification->title }}</h1>
            <span class="type-badge">{{ str_replace('_', ' ', $notification->type) }}</span>
        </div>
        
        <div class="content">
            @if($notification->message)
                <div class="message">
                    <p>{{ $notification->message }}</p>
                </div>
            @endif
        </div>

        <div class="footer">
            <p>This is an automated notification from {{ config('app.name') }}</p>
            <p>Received at {{ $notification->created_at->format('F d, Y h:i A') }}</p>
        </div>
    </div>
</body>
</html>
