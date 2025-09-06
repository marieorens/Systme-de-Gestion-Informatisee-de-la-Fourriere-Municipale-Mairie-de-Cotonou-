import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { vehicleService } from '@/services';
import { VehicleCreateData, VehicleUpdateData } from '@/services/vehicleService';
import { VehicleType, VehicleStatus } from '@/types/enums';

interface VehicleFormData {
  license_plate: string;
  make: string;
  model: string;
  color: string;
  year: number;
  type: VehicleType;
  location: string;
  description?: string;
  owner_name?: string;
  status: VehicleStatus;
  impound_date?: string;
  photos?: File[];
}

const initialFormData: VehicleFormData = {
  license_plate: '',
  make: '',
  model: '',
  color: '',
  year: new Date().getFullYear(),
  type: VehicleType.MOTORCYCLE,
  location: '',
  description: '',
  owner_name: '',
  status: VehicleStatus.IMPOUNDED,
  impound_date: new Date().toISOString().split('T')[0], 
  photos: [],
};

export const VehicleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Fetch vehicle data if editing
  useEffect(() => {
    const fetchVehicle = async () => {
      if (id) {
        try {
          setIsLoading(true);
          const vehicleData = await vehicleService.getVehicle(id);
          
          setFormData({
            license_plate: vehicleData.license_plate,
            make: vehicleData.make,
            model: vehicleData.model,
            color: vehicleData.color,
            year: vehicleData.year,
            type: vehicleData.type,
            location: vehicleData.location,
            description: vehicleData.description || '',
            owner_name: vehicleData.owner ? `${vehicleData.owner.first_name} ${vehicleData.owner.last_name}` : '',
            status: vehicleData.status || VehicleStatus.IMPOUNDED,
            impound_date: vehicleData.impound_date.split('T')[0],
          });
          
          // If there are photos, show them as previews
          if (vehicleData.photos && vehicleData.photos.length > 0) {
            setPhotoPreviewUrls(vehicleData.photos);
          }
        } catch (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données du véhicule.',
            variant: 'destructive',
          });
          navigate('/app/vehicules');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchVehicle();
  }, [id, navigate]);

  const handleInputChange = (field: keyof VehicleFormData, value: string | number | VehicleType | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPhotoFiles(prev => [...prev, ...newFiles]);
      
      // Create preview URLs for the new files
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    // Remove from files array
    const newFiles = [...photoFiles];
    newFiles.splice(index, 1);
    setPhotoFiles(newFiles);
    
    // Remove from preview URLs and revoke object URL to prevent memory leaks
    const newUrls = [...photoPreviewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPhotoPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      const vehicleData: VehicleCreateData | VehicleUpdateData = {
        license_plate: formData.license_plate,
        make: formData.make,
        model: formData.model,
        color: formData.color,
        year: formData.year,
        type: formData.type,
        location: formData.location,
        description: formData.description,
        status: formData.status,
        impound_date: formData.impound_date || new Date().toISOString().split('T')[0],
      };

      if (isEdit && id) {
        // Update existing vehicle
        response = await vehicleService.publicUpdateVehicleByPlate(id, vehicleData);
      } else {
        // Create new vehicle
        response = await vehicleService.createVehicle(vehicleData as VehicleCreateData);
      }

      // Upload photos if any
      if (photoFiles.length > 0) {
        await vehicleService.uploadVehiclePhotos(response.id, photoFiles);
      }
      
      toast({
        title: isEdit ? 'Véhicule modifié' : 'Véhicule enregistré',
        description: `Le véhicule ${formData.license_plate} a été ${isEdit ? 'modifié' : 'enregistré'} avec succès.`,
      });
      
      // Clean up all object URLs to prevent memory leaks
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Rediriger vers la page de recherche du propriétaire
      navigate(`/app/vehicules/${response.id}/notify`, {
        state: { 
          licensePlate: formData.license_plate,
          vehicleId: response.id
        }
      });
    } catch (error) {
      console.error('Error saving vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/app/vehicules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEdit ? 'Modifier le véhicule' : 'Nouveau véhicule'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifier les informations du véhicule' : 'Enregistrer un nouveau véhicule en fourrière'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du véhicule</CardTitle>
            <CardDescription>
              Saisir les détails d'identification du véhicule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_plate">Plaque d'immatriculation *</Label>
                <Input
                  id="license_plate"
                  placeholder="AB-123-CD"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange('license_plate', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de véhicule *</Label>
                <Select value={formData.type} onValueChange={(value: VehicleType) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Marque *</Label>
                <Input
                  id="make"
                  placeholder="Toyota, Honda, etc."
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Input
                  id="model"
                  placeholder="Corolla, Civic, etc."
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur *</Label>
                <Input
                  id="color"
                  placeholder="Blanc, Noir, Rouge, etc."
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localisation en fourrière *</Label>
                <Select value={formData.location} onValueChange={(value: string) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zone A">Zone A</SelectItem>
                    <SelectItem value="Zone B">Zone B</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label htmlFor="impound_date">Date de mise en fourrière *</Label>
                <Input
                  id="impound_date"
                  type="date"
                  value={formData.impound_date}
                  onChange={(e) => handleInputChange('impound_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_name">Nom du propriétaire (optionnel)</Label>
              <Input
                id="owner_name"
                placeholder="Nom du propriétaire si connu"
                value={formData.owner_name}
                onChange={(e) => handleInputChange('owner_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Raison/Infraction commise (optionnelle)</Label>
              <Textarea
                id="description"
                placeholder="État du véhicule, dommages observés, etc."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Photos du véhicule (optionnel)</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24">
                    <img
                      src={url}
                      alt={`Vehicle ${index}`}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="text-xs mt-1">Ajouter</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Clean up object URLs before navigating away
              photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
              navigate('/app/vehicules');
            }}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-municipal-gradient hover:opacity-90"
          >
            {isSubmitting ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Enregistrer')}
          </Button>
        </div>
      </form>
    </div>
  );
};
