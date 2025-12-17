<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * Base custom exception class
 */
class BaseException extends Exception
{
    protected $statusCode = 500;
    protected $errorCode = 'INTERNAL_ERROR';

    public function __construct(string $message = 'حدث خطأ غير متوقع', int $statusCode = null, string $errorCode = null)
    {
        parent::__construct($message);
        
        if ($statusCode !== null) {
            $this->statusCode = $statusCode;
        }
        
        if ($errorCode !== null) {
            $this->errorCode = $errorCode;
        }
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error' => $this->getErrorCode(),
        ], $this->getStatusCode());
    }
}

/**
 * Resource not found exception
 */
class ResourceNotFoundException extends BaseException
{
    protected $statusCode = 404;
    protected $errorCode = 'RESOURCE_NOT_FOUND';

    public function __construct(string $message = 'المورد المطلوب غير موجود')
    {
        parent::__construct($message);
    }
}

/**
 * Unauthorized access exception
 */
class UnauthorizedException extends BaseException
{
    protected $statusCode = 401;
    protected $errorCode = 'UNAUTHORIZED';

    public function __construct(string $message = 'غير مصرح لك بالوصول')
    {
        parent::__construct($message);
    }
}

/**
 * Forbidden access exception
 */
class ForbiddenException extends BaseException
{
    protected $statusCode = 403;
    protected $errorCode = 'FORBIDDEN';

    public function __construct(string $message = 'غير مسموح لك بالوصول')
    {
        parent::__construct($message);
    }
}

/**
 * Validation exception
 */
class ValidationException extends BaseException
{
    protected $statusCode = 422;
    protected $errorCode = 'VALIDATION_ERROR';
    protected $errors = [];

    public function __construct(string $message = 'خطأ في التحقق من البيانات', array $errors = [])
    {
        parent::__construct($message);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function render(): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $this->getMessage(),
            'error' => $this->getErrorCode(),
        ];

        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }

        return response()->json($response, $this->getStatusCode());
    }
}

/**
 * Business logic exception
 */
class BusinessLogicException extends BaseException
{
    protected $statusCode = 400;
    protected $errorCode = 'BUSINESS_LOGIC_ERROR';

    public function __construct(string $message = 'خطأ في منطق العمل')
    {
        parent::__construct($message);
    }
}

/**
 * Rate limit exception
 */
class RateLimitException extends BaseException
{
    protected $statusCode = 429;
    protected $errorCode = 'RATE_LIMIT_EXCEEDED';

    public function __construct(string $message = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً')
    {
        parent::__construct($message);
    }
}

