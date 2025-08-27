<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Cotonou Municipal Garage API",
 *     description="Documentation de l'API de la Fourrière Municipale de Cotonou",
 *     @OA\Contact(
 *         email="contact@fourriere-municipale.bj"
 *     )
 * )
 * @OA\Server(
 *     url="/api",
 *     description="API Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
class SwaggerController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/documentation",
     *     description="Page d'accueil de la documentation API",
     *     @OA\Response(
     *         response="200",
     *         description="Documentation de l'API"
     *     )
     * )
     */
    public function index()
    {
        return view('swagger.index');
    }
}
