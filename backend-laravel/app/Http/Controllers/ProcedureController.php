<?php

namespace App\Http\Controllers;

use App\Http\Requests\Procedure\StoreProcedureRequest;
use App\Http\Requests\Procedure\UpdateProcedureRequest;
use App\Http\Resources\ProcedureResource;
use App\Http\Resources\ProcedureDocumentResource;
use App\Models\Procedure;
use App\Models\ProcedureDocument;
use App\Services\FileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcedureController extends Controller
{
    protected $fileService;

    public function __construct(FileService $fileService)
    {
        $this->fileService = $fileService;
    }
    
    /**
     * Apply middleware in the routes file instead of the controller constructor.
     */

    /**
     * @OA\Get(
     *      path="/procedures",
     *      operationId="getProceduresList",
     *      tags={"Procedures"},
     *      summary="Get list of procedures",
     *      description="Returns list of procedures",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="search", in="query", description="Search term", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="status", in="query", description="Filter by status", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="procedure_type", in="query", description="Filter by procedure type", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="date_from", in="query", description="Filter by start date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Parameter(name="date_to", in="query", description="Filter by end date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/ProcedureResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Procedure::query()->with(['vehicle', 'createdBy', 'documents']);
        
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('vehicle', function ($q) use ($search) {
                $q->where('license_plate', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }
        
        // Apply status filter
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        
        // Apply procedure type filter
        if ($request->has('procedure_type') && $request->input('procedure_type') !== 'all') {
            $query->where('type', $request->input('procedure_type'));
        }
        
        // Apply date range filter
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $procedures = $query->latest()->paginate($perPage);
        
        return ProcedureResource::collection($procedures);
    }

    /**
     * @OA\Post(
     *      path="/procedures",
     *      operationId="storeProcedure",
     *      tags={"Procedures"},
     *      summary="Store new procedure",
     *      description="Returns procedure data",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/StoreProcedureRequest")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/ProcedureResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function store(StoreProcedureRequest $request): ProcedureResource
    {
        $data = $request->validated();
        $data['created_by'] = Auth::id();
        
        $procedure = Procedure::create($data);
        
        return new ProcedureResource($procedure->load(['vehicle', 'createdBy']));
    }

    /**
     * @OA\Get(
     *      path="/procedures/{id}",
     *      operationId="getProcedureById",
     *      tags={"Procedures"},
     *      summary="Get procedure information",
     *      description="Returns procedure data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/ProcedureResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function show(Procedure $procedure): ProcedureResource
    {
        return new ProcedureResource($procedure->load(['vehicle', 'createdBy', 'documents']));
    }

    /**
     * @OA\Put(
     *      path="/procedures/{id}",
     *      operationId="updateProcedure",
     *      tags={"Procedures"},
     *      summary="Update existing procedure",
     *      description="Returns updated procedure data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/UpdateProcedureRequest")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/ProcedureResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function update(UpdateProcedureRequest $request, Procedure $procedure): ProcedureResource
    {
        $procedure->update($request->validated());
        
        return new ProcedureResource($procedure->fresh(['vehicle', 'createdBy', 'documents']));
    }

    /**
     * @OA\Delete(
     *      path="/procedures/{id}",
     *      operationId="deleteProcedure",
     *      tags={"Procedures"},
     *      summary="Delete existing procedure",
     *      description="Deletes a record and returns no content",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=204, description="Successful operation"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function destroy(Procedure $procedure): JsonResponse
    {
        $this->authorize('delete', $procedure);
        
        // Delete associated documents
        $documents = $procedure->documents;
        foreach ($documents as $document) {
            // Delete files from storage
            $this->fileService->deleteFile($document->url);
            // Delete document record
            $document->delete();
        }
        
        $procedure->delete();
        
        return response()->json(null, 204);
    }

    /**
     * @OA\Get(
     *      path="/procedures/{id}/documents",
     *      operationId="getProcedureDocuments",
     *      tags={"Procedures"},
     *      summary="Get procedure documents",
     *      description="Returns list of procedure documents",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/ProcedureDocumentResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function getDocuments(Procedure $procedure): AnonymousResourceCollection
    {
        $documents = $procedure->documents()->latest()->get();
        return ProcedureDocumentResource::collection($documents);
    }

    /**
     * @OA\Post(
     *      path="/procedures/{id}/documents",
     *      operationId="uploadProcedureDocuments",
     *      tags={"Procedures"},
     *      summary="Upload procedure documents",
     *      description="Uploads documents for a procedure",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  @OA\Property(property="files[]", type="array", @OA\Items(type="file"), description="Documents to upload"),
     *                  @OA\Property(property="document_names[]", type="array", @OA\Items(type="string"), description="Names of the documents"),
     *                  @OA\Property(property="document_types[]", type="array", @OA\Items(type="string"), description="Types of the documents")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/ProcedureDocumentResource"))
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function uploadDocuments(Request $request, Procedure $procedure): JsonResponse
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|max:10240', // 10MB max size
            'document_names' => 'required|array',
            'document_names.*' => 'required|string|max:255',
            'document_types' => 'required|array',
            'document_types.*' => 'required|string|max:50',
        ]);
        
        $uploadedDocuments = [];
        
        DB::beginTransaction();
        
        try {
            for ($i = 0; $i < count($request->file('files')); $i++) {
                $file = $request->file('files')[$i];
                $name = $request->input('document_names')[$i];
                $type = $request->input('document_types')[$i];
                
                // Store file
                $fileUrl = $this->fileService->storeFile($file, 'procedure_documents');
                
                // Create document record
                $document = ProcedureDocument::create([
                    'procedure_id' => $procedure->id,
                    'name' => $name,
                    'type' => $type,
                    'url' => $fileUrl,
                    'uploaded_at' => now(),
                ]);
                
                $uploadedDocuments[] = $document;
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Documents uploaded successfully',
                'documents' => ProcedureDocumentResource::collection(collect($uploadedDocuments))
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to upload procedure documents: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to upload documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *      path="/procedures/{id}/documents/{docId}",
     *      operationId="deleteProcedureDocument",
     *      tags={"Procedures"},
     *      summary="Delete procedure document",
     *      description="Deletes a procedure document",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of procedure", required=true, @OA\Schema(type="integer")),
     *      @OA\Parameter(name="docId", in="path", description="ID of document", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=204, description="Successful operation"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function deleteDocument(Procedure $procedure, $docId): JsonResponse
    {
        $document = ProcedureDocument::where('procedure_id', $procedure->id)
            ->where('id', $docId)
            ->firstOrFail();
        
        $this->authorize('delete', $procedure);
        
        // Delete file from storage
        $this->fileService->deleteFile($document->url);
        
        // Delete document record
        $document->delete();
        
        return response()->json(null, 204);
    }
}
