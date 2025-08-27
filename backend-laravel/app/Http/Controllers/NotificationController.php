<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        // La gestion du middleware est configurée dans les routes plutôt que dans le contrôleur
    }

    /**
     * @OA\Get(
     *      path="/notifications",
     *      operationId="getNotifications",
     *      tags={"Notifications"},
     *      summary="Get user notifications",
     *      description="Returns list of notifications for the authenticated user",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="unread", in="query", description="Filter by unread notifications", required=false, @OA\Schema(type="boolean")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/NotificationResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = Auth::user();
        $query = Notification::where('user_id', $user->id);
        
        if ($request->has('unread') && $request->boolean('unread')) {
            $query->whereNull('read_at');
        }
        
        $query->with(['user', 'owner', 'vehicle']);
        $notifications = $query->latest()->paginate(15);
        
        return NotificationResource::collection($notifications);
    }

    /**
     * @OA\Get(
     *      path="/notifications/{id}",
     *      operationId="getNotificationById",
     *      tags={"Notifications"},
     *      summary="Get notification information",
     *      description="Returns notification data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of notification", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/NotificationResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function show(Notification $notification): NotificationResource
    {
        $this->authorize('view', $notification);
        return new NotificationResource($notification->load(['user', 'owner', 'vehicle']));
    }

    /**
     * @OA\Post(
     *      path="/notifications/{id}/read",
     *      operationId="markNotificationAsRead",
     *      tags={"Notifications"},
     *      summary="Mark a specific notification as read",
     *      description="Marks a single notification as read",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of notification", required=true, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/NotificationResource")
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function markAsRead(Notification $notification): NotificationResource
    {
        $this->authorize('update', $notification);
        $notification = $this->notificationService->markAsRead($notification);
        return new NotificationResource($notification->load(['user', 'owner', 'vehicle']));
    }

    /**
     * @OA\Post(
     *      path="/notifications/mark-all-read",
     *      operationId="markAllNotificationsAsRead",
     *      tags={"Notifications"},
     *      summary="Mark all notifications as read",
     *      description="Marks all unread notifications for the user as read",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="All notifications marked as read.")
     *          )
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * @OA\Get(
     *      path="/notifications/unread-count",
     *      operationId="getUnreadNotificationsCount",
     *      tags={"Notifications"},
     *      summary="Get count of unread notifications for authenticated user",
     *      description="Returns count of unread notifications",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="count", type="integer", example=5)
     *          )
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function getUnreadCount(): JsonResponse
    {
        $user = Auth::user();
        $count = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
            
        return response()->json(['count' => $count]);
    }
}
