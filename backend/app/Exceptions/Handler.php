<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $e)
    {
        // Handle API requests with standardized JSON responses
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions with standardized response format.
     */
    protected function handleApiException($request, Throwable $e): JsonResponse
    {
        $exception = $this->prepareException($e);

        if ($exception instanceof ValidationException) {
            return $this->handleValidationException($exception);
        }

        if ($exception instanceof AuthenticationException) {
            return $this->handleAuthenticationException();
        }

        if ($exception instanceof ModelNotFoundException) {
            return $this->handleModelNotFoundException();
        }

        if ($exception instanceof NotFoundHttpException) {
            return $this->handleNotFoundHttpException();
        }

        if ($exception instanceof MethodNotAllowedHttpException) {
            return $this->handleMethodNotAllowedException();
        }

        if ($exception instanceof HttpException) {
            return $this->handleHttpException($exception);
        }

        // Handle generic exceptions
        return $this->handleGenericException($e);
    }

    /**
     * Handle validation exceptions.
     */
    protected function handleValidationException(ValidationException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'خطأ في التحقق من البيانات',
            'errors' => $e->errors(),
        ], 422);
    }

    /**
     * Handle authentication exceptions.
     */
    protected function handleAuthenticationException(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'غير مصرح لك بالوصول',
            'error' => 'Unauthenticated',
        ], 401);
    }

    /**
     * Handle model not found exceptions.
     */
    protected function handleModelNotFoundException(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'المورد المطلوب غير موجود',
            'error' => 'Resource not found',
        ], 404);
    }

    /**
     * Handle not found HTTP exceptions.
     */
    protected function handleNotFoundHttpException(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'الصفحة المطلوبة غير موجودة',
            'error' => 'Not found',
        ], 404);
    }

    /**
     * Handle method not allowed exceptions.
     */
    protected function handleMethodNotAllowedException(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'طريقة الطلب غير مسموحة',
            'error' => 'Method not allowed',
        ], 405);
    }

    /**
     * Handle HTTP exceptions.
     */
    protected function handleHttpException(HttpException $e): JsonResponse
    {
        $statusCode = $e->getStatusCode();
        $message = $e->getMessage() ?: $this->getDefaultMessage($statusCode);

        return response()->json([
            'success' => false,
            'message' => $message,
            'error' => class_basename($e),
        ], $statusCode);
    }

    /**
     * Handle generic exceptions.
     */
    protected function handleGenericException(Throwable $e): JsonResponse
    {
        $statusCode = 500;
        $message = 'حدث خطأ غير متوقع';

        // Log the exception
        \Log::error('Unhandled exception: ' . $e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString(),
        ]);

        // In production, don't expose exception details
        if (config('app.debug')) {
            $message = $e->getMessage();
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'error' => class_basename($e),
        ], $statusCode);
    }

    /**
     * Get default message for HTTP status code.
     */
    protected function getDefaultMessage(int $statusCode): string
    {
        $messages = [
            400 => 'طلب غير صحيح',
            401 => 'غير مصرح لك بالوصول',
            403 => 'غير مسموح لك بالوصول',
            404 => 'المورد المطلوب غير موجود',
            405 => 'طريقة الطلب غير مسموحة',
            422 => 'خطأ في التحقق من البيانات',
            429 => 'تم تجاوز الحد المسموح من الطلبات',
            500 => 'حدث خطأ في الخادم',
            503 => 'الخدمة غير متاحة حالياً',
        ];

        return $messages[$statusCode] ?? 'حدث خطأ غير متوقع';
    }
}

