<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Telegram Bot Token
    |--------------------------------------------------------------------------
    |
    | Your Telegram Bot Token obtained from @BotFather
    |
    */
    'bot_token' => env('TELEGRAM_BOT_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Webhook URL
    |--------------------------------------------------------------------------
    |
    | The URL where Telegram will send updates
    |
    */
    'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),

    /*
    |--------------------------------------------------------------------------
    | Asynchronous Requests
    |--------------------------------------------------------------------------
    |
    | When enabled, all requests to Telegram API will be made asynchronously
    |
    */
    'async_requests' => false,

    /*
    |--------------------------------------------------------------------------
    | HTTP Client Handler
    |--------------------------------------------------------------------------
    |
    | The HTTP Client Handler to use for making requests
    |
    */
    'http_client_handler' => null,

    /*
    |--------------------------------------------------------------------------
    | Resolve Injected Dependencies in Commands
    |--------------------------------------------------------------------------
    |
    | Using Laravel's IoC container, we can easily type hint dependencies in
    | command constructors, methods, and handlers. Setting this to true will
    | enable that functionality.
    |
    */
    'resolve_command_dependencies' => true,

    /*
    |--------------------------------------------------------------------------
    | Commands
    |--------------------------------------------------------------------------
    |
    | Commands to register with the Telegram Bot
    |
    */
    'commands' => [
        // Telegram\Bot\Commands\HelpCommand::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Command Groups
    |--------------------------------------------------------------------------
    |
    | You can organize your commands into groups which can later be enabled and
    | disabled in a particular scenario or at runtime.
    |
    */
    'command_groups' => [],
];
