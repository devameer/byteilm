<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دعوة للانضمام إلى فريق</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            text-align: center;
        }
        h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin: 20px 0;
        }
        .team-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #4f46e5;
            margin: 15px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #4338ca;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .role-badge {
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
            <h1>دعوة للانضمام إلى فريق</h1>
        </div>
        
        <div class="content">
            <p>مرحباً!</p>
            
            <p>لقد تمت دعوتك للانضمام إلى فريق "{{ $invitation->team->name }}" على منصتنا.</p>
            
            <div class="team-info">
                <h3>تفاصيل الفريق:</h3>
                <p><strong>اسم الفريق:</strong> {{ $invitation->team->name }}</p>
                @if($invitation->team->description)
                    <p><strong>الوصف:</strong> {{ $invitation->team->description }}</p>
                @endif
                <p><strong>الدور المخصص لك:</strong> 
                    <span class="role-badge">
                        @if($invitation->role === 'owner')
                            مالك
                        @elseif($invitation->role === 'member')
                            عضو
                        @else
                            مراقب
                        @endif
                    </span>
                </p>
            </div>
            
            @if($invitation->isValid())
                <p>لقبول الدعوة، يرجى النقر على الزر أدناه:</p>
                <a href="{{ url('/accept-invitation/' . $invitation->token) }}" class="cta-button">قبول الدعوة</a>
                
                <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
                <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
                    {{ url('/accept-invitation/' . $invitation->token) }}
                </p>
            @else
                <p class="error" style="color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 4px;">
                    عذراً، هذه الدعوة منتهية الصلاحية أو غير صالحة.
                </p>
            @endif
            
            <p>إذا لم تكن ترغب في الانضمام إلى هذا الفريق، يمكنك تجاهل هذا البريد الإلكتروني.</p>
        </div>

        <div class="footer">
            <p>هذه رسالة تلقائية من {{ config('app.name') }}</p>
            <p>تم إرسالها في {{ now()->format('Y-m-d H:i') }}</p>
        </div>
    </div>
</body>
</html>
