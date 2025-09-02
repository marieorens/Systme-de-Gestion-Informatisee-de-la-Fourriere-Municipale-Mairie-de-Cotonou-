<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class FileService
{
    /**
     * Store a file in the storage.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string|null $filename
     * @return string
     */
    public function storeFile(UploadedFile $file, string $directory, string $filename = null): string
    {
        $filename = $filename ?: Str::random(40) . '.' . $file->getClientOriginalExtension();
        
        $path = $file->storeAs(
            'public/' . $directory,
            $filename
        );
        
        return str_replace('public/', '', $path);
    }
    
    /**
     * Store multiple files in the storage.
     *
     * @param array $files
     * @param string $directory
     * @return array
     */
    public function storeFiles(array $files, string $directory): array
    {
        $paths = [];
        
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $paths[] = $this->storeFile($file, $directory);
            }
        }
        
        return $paths;
    }
    
    /**
     * Delete a file from storage.
     *
     * @param string $path
     * @return bool
     */
    public function deleteFile(string $path): bool
    {
        if (Storage::exists('public/' . $path)) {
            return Storage::delete('public/' . $path);
        }
        
        return false;
    }
    
    /**
     * Delete multiple files from storage.
     *
     * @param array $paths
     * @return array
     */
    public function deleteFiles(array $paths): array
    {
        $results = [];
        
        foreach ($paths as $path) {
            $results[$path] = $this->deleteFile($path);
        }
        
        return $results;
    }
    
    /**
     * Generate a QR code for a vehicle.
     *
     * @param array $data
     * @return string
     */
    public function generateQrCode(array $data): string
    {
        
        $qrCode = 'QR' . md5(json_encode($data));
        
        return $qrCode;
    }
    
    /**
     * Get the full URL for a file
     *
     * @param string $path
     * @return string
     */
    public function getFileUrl(string $path): string
    {
        if (Storage::exists('public/' . $path)) {
            return Storage::url('public/' . $path);
        }
        
        return '';
    }
    
    /**
     * Store a base64 encoded file
     *
     * @param string $base64String
     * @param string $directory
     * @param string $extension
     * @return string
     */
    public function storeBase64File(string $base64String, string $directory, string $extension = 'png'): string
    {
        $base64Content = $this->extractBase64Content($base64String);
        
        $fileName = Str::random(40) . '.' . $extension;
        
        $path = 'public/' . $directory . '/' . $fileName;
        Storage::put($path, base64_decode($base64Content));
        
        return str_replace('public/', '', $path);
    }
    
    /**
     * Extract base64 content from a string (removes data:image/png;base64, prefix)
     *
     * @param string $base64String
     * @return string
     */
    protected function extractBase64Content(string $base64String): string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
            return substr($base64String, strpos($base64String, ',') + 1);
        }
        
        return $base64String;
    }
}
