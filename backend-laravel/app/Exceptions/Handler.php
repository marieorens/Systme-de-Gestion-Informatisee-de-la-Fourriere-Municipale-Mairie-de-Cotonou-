<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
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
        
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return $this->handleApiException($e);
            }
            return null;
        });
    }
    
    /**
     * Handle API exceptions.
     */
    private function handleApiException(Throwable $exception): JsonResponse
    {
        if ($exception instanceof ModelNotFoundException) {
            return new JsonResponse([
                'message' => 'Resource not found',
            ], 404);
        }
        
        if ($exception instanceof NotFoundHttpException) {
            return new JsonResponse([
                'message' => 'Endpoint not found',
            ], 404);
        }
        
        if ($exception instanceof AuthorizationException) {
            return new JsonResponse([
                'message' => $exception->getMessage() ?: 'Unauthorized',
            ], 403);
        }
        
        if ($exception instanceof ValidationException) {
            return new JsonResponse([
                'message' => 'The given data was invalid.',
                'errors' => $exception->validator->errors()->toArray(),
            ], 422);
        }
        
        if ($exception instanceof HttpException) {
            return new JsonResponse([
                'message' => $exception->getMessage(),
            ], $exception->getStatusCode());
        }
        
        // Default internal error response
        return new JsonResponse([
            'message' => 'Internal Server Error',
            'error' => config('app.debug') ? $exception->getMessage() : null,
        ], 500);
    }
}
