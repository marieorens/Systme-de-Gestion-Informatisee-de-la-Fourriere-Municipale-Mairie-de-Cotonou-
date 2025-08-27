<?php

namespace App\Http\Controllers;

use App\Http\Requests\Owner\StoreOwnerRequest;
use App\Http\Requests\Owner\UpdateOwnerRequest;
use App\Http\Resources\OwnerResource;
use App\Http\Resources\VehicleResource;
use App\Models\Owner;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class OwnerController extends Controller
{
    /**
     * @OA\Get(
     *      path="/owners",
     *      operationId="getOwnersList",
     *      tags={"Owners"},
     *      summary="Get list of owners",
     *      description="Returns list of owners",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="search", in="query", description="Search term", required=false, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/OwnerResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function index(Request $request)
    {
        $query = Owner::query();
        
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('id_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Get all owners with pagination
        $perPage = $request->input('per_page', 15);
        $owners = $query->latest()->paginate($perPage);
        
        return OwnerResource::collection($owners);
    }

    /**
     * @OA\Post(
     *      path="/owners",
     *      operationId="storeOwner",
     *      tags={"Owners"},
     *      summary="Store new owner",
     *      description="Returns owner data",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/StoreOwnerRequest")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/OwnerResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function store(StoreOwnerRequest $request)
    {
        $owner = Owner::create($request->validated());
        
        return new OwnerResource($owner);
    }

    /**
     * @OA\Get(
     *      path="/owners/{id}",
     *      operationId="getOwnerById",
     *      tags={"Owners"},
     *      summary="Get owner information",
     *      description="Returns owner data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of owner", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/OwnerResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function show(Owner $owner)
    {
        return new OwnerResource($owner);
    }

    /**
     * @OA\Put(
     *      path="/owners/{id}",
     *      operationId="updateOwner",
     *      tags={"Owners"},
     *      summary="Update existing owner",
     *      description="Returns updated owner data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of owner", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/UpdateOwnerRequest")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/OwnerResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function update(UpdateOwnerRequest $request, Owner $owner)
    {
        $owner->update($request->validated());
        
        return new OwnerResource($owner);
    }

    /**
     * @OA\Delete(
     *      path="/owners/{id}",
     *      operationId="deleteOwner",
     *      tags={"Owners"},
     *      summary="Delete existing owner",
     *      description="Deletes a record and returns no content",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of owner", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=204, description="Successful operation"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function destroy(Owner $owner)
    {
        // Check if the owner has any vehicles
        if ($owner->vehicles()->exists()) {
            return response()->json([
                'message' => 'Cet propriétaire ne peut pas être supprimé car il a des véhicules associés.'
            ], 422);
        }
        
        $owner->delete();
        
        return response()->noContent();
    }
    
    /**
     * @OA\Get(
     *      path="/owners/{id}/vehicles",
     *      operationId="getOwnerVehicles",
     *      tags={"Owners"},
     *      summary="Get vehicles belonging to an owner",
     *      description="Returns a list of vehicles associated with the specified owner",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of owner", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/VehicleResource"))
     *       ),
     *      @OA\Response(response=404, description="Owner not found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function getVehicles($id)
    {
        $owner = Owner::findOrFail($id);
        
        $vehicles = $owner->vehicles()->with('payments')->latest()->get();
        
        return VehicleResource::collection($vehicles);
    }
}
