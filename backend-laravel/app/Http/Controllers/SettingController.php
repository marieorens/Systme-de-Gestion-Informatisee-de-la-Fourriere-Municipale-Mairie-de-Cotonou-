<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Settings",
 *     description="API Endpoints for System Settings"
 * )
 */
class SettingController extends Controller
{
    /**
     * @OA\Get(
     *     path="/settings",
     *     operationId="getSettings",
     *     tags={"Settings"},
     *     summary="Get system settings",
     *     description="Returns system settings like daily fees, admin fees, etc.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="daily_storage_fee", type="number"),
     *                 @OA\Property(property="admin_fee", type="number"),
     *                 @OA\Property(property="notification_email", type="string"),
     *                 @OA\Property(property="system_name", type="string"),
     *                 @OA\Property(property="contact_phone", type="string"),
     *                 @OA\Property(property="address", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function index()
    {
        // Get settings from cache or use defaults
        $settings = Cache::remember('system_settings', 60 * 24, function () {
            return [
                'daily_storage_fee' => 2000, // Default value
                'admin_fee' => 10000, // Default value
                'notification_email' => 'contact@cotonou-garage.bj',
                'system_name' => 'Système de Gestion de la Fourrière Municipale de Cotonou',
                'contact_phone' => '+229 21 30 30 30',
                'address' => 'Hôtel de ville de Cotonou, Bénin'
            ];
        });
        
        return response()->json(['data' => $settings]);
    }

    /**
     * @OA\Put(
     *     path="/settings",
     *     operationId="updateSettings",
     *     tags={"Settings"},
     *     summary="Update system settings",
     *     description="Updates system settings and returns the updated values",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="daily_storage_fee", type="number"),
     *             @OA\Property(property="admin_fee", type="number"),
     *             @OA\Property(property="notification_email", type="string"),
     *             @OA\Property(property="system_name", type="string"),
     *             @OA\Property(property="contact_phone", type="string"),
     *             @OA\Property(property="address", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="daily_storage_fee", type="number"),
     *                 @OA\Property(property="admin_fee", type="number"),
     *                 @OA\Property(property="notification_email", type="string"),
     *                 @OA\Property(property="system_name", type="string"),
     *                 @OA\Property(property="contact_phone", type="string"),
     *                 @OA\Property(property="address", type="string")
     *             ),
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Bad Request"),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=403, description="Forbidden - User is not an admin")
     * )
     */
    public function update(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'daily_storage_fee' => 'nullable|numeric|min:0',
            'admin_fee' => 'nullable|numeric|min:0',
            'notification_email' => 'nullable|email',
            'system_name' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }
        
        // Check if user is admin
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Seuls les administrateurs peuvent modifier les paramètres du système'], 403);
        }
        
        // Get current settings
        $currentSettings = Cache::get('system_settings', [
            'daily_storage_fee' => 2000,
            'admin_fee' => 10000,
            'notification_email' => 'contact@cotonou-garage.bj',
            'system_name' => 'Système de Gestion de la Fourrière Municipale de Cotonou',
            'contact_phone' => '+229 21 30 30 30',
            'address' => 'Hôtel de ville de Cotonou, Bénin'
        ]);
        
        // Update settings with new values
        $settings = array_merge($currentSettings, array_filter($request->all(), function ($value) {
            return $value !== null;
        }));
        
        // Store in cache
        Cache::put('system_settings', $settings, 60 * 24 * 30); // Cache for 30 days
        
        return response()->json([
            'data' => $settings,
            'message' => 'Paramètres du système mis à jour avec succès'
        ]);
    }
}
