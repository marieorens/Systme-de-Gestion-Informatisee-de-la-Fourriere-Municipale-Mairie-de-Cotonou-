<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * @OA\Tag(
 *     name="Settings",
 *     description="API Endpoints for Settings"
 * )
 */
class SettingsController extends Controller
{
    use AuthorizesRequests;

    /**
     * @OA\Get(
     *      path="/api/settings",
     *      operationId="getSettings",
     *      tags={"Settings"},
     *      summary="Get all application settings",
     *      description="Returns a list of all settings",
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="object",
     *              @OA\Property(
     *                  property="settings",
     *                  type="array",
     *                  @OA\Items(ref="#/components/schemas/Setting")
     *              )
     *          )
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function index()
    {
        // Eager load settings to reduce database queries
        $settings = Setting::all()->keyBy('key');
        return response()->json($settings);
    }

    /**
     * @OA\Post(
     *      path="/settings",
     *      operationId="updateSettings",
     *      tags={"Settings"},
     *      summary="Update application settings",
     *      description="Updates one or more settings. Requires admin privileges.",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"settings"},
     *              @OA\Property(
     *                  property="settings",
     *                  type="array",
     *                  @OA\Items(
     *                      type="object",
     *                      required={"key", "value"},
     *                      @OA\Property(property="key", type="string", example="garage_name"),
     *                      @OA\Property(property="value", type="string", example="Garage Municipal de Cotonou")
     *                  )
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Settings updated successfully.")
     *          )
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     * )
     */
    public function update(Request $request)
    {
        $this->authorize('update-settings');

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'exists:settings,key'],
            'settings.*.value' => ['required'], // Validation depends on the setting type
        ]);

        foreach ($validated['settings'] as $settingData) {
            $setting = Setting::where('key', $settingData['key'])->first();
            if ($setting) {
                // Here you might add more complex logic based on setting type
                // For example, for file uploads, etc.
                $setting->value = $settingData['value'];
                $setting->save();
            }
        }

        // Clear the settings cache
        Cache::forget('app-settings');

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
