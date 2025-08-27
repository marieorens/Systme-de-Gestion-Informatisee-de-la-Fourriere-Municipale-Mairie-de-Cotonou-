import { useState } from 'react';
import { Save, Settings, DollarSign, Clock, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Fourrière Municipale Cotonou',
      contactEmail: 'fourriere@mairie-cotonou.bj',
      contactPhone: '+229 21 30 04 00',
      address: 'Mairie de Cotonou, Place Jean Bayol',
      legalDelay: 15
    },
    tariffs: {
      carDaily: 5000,
      motorcycleDaily: 2500,
      commercialDaily: 10000,
      truckDaily: 20000,
      processingFee: 10000
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      autoReminders: true,
      reminderDays: [7, 3, 1]
    },
    documents: {
      receiptTemplate: 'Reçu de paiement des frais de fourrière...',
      pvTemplate: 'Procès-verbal de mise en fourrière...',
      noticeTemplate: 'Avis de mise en fourrière...'
    }
  });

  const handleSave = async () => {
    try {
      // Save settings to API
      console.log('Saving settings:', settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleTemplateChange = (templateType: 'receiptTemplate' | 'pvTemplate' | 'noticeTemplate', value: string) => {
    setSettings(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [templateType]: value
      }
    }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration du système de fourrière</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
          <TabsTrigger value="general" className="text-xs sm:text-sm">Général</TabsTrigger>
          <TabsTrigger value="tariffs" className="text-xs sm:text-sm">Tarifs</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>Configuration de base du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email de contact</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, contactEmail: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.general.contactPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, contactPhone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="legalDelay">Délai légal (jours)</Label>
                  <Input
                    id="legalDelay"
                    type="number"
                    value={settings.general.legalDelay}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, legalDelay: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={settings.general.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, address: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tariffs Settings */}
        <TabsContent value="tariffs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Grille tarifaire
              </CardTitle>
              <CardDescription>Configuration des tarifs de la fourrière</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carDaily">Voiture particulière (FCFA/jour)</Label>
                  <Input
                    id="carDaily"
                    type="number"
                    value={settings.tariffs.carDaily}
                    onChange={(e) => setSettings({
                      ...settings,
                      tariffs: { ...settings.tariffs, carDaily: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="motorcycleDaily">Motocyclette (FCFA/jour)</Label>
                  <Input
                    id="motorcycleDaily"
                    type="number"
                    value={settings.tariffs.motorcycleDaily}
                    onChange={(e) => setSettings({
                      ...settings,
                      tariffs: { ...settings.tariffs, motorcycleDaily: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="commercialDaily">Véhicule commercial (FCFA/jour)</Label>
                  <Input
                    id="commercialDaily"
                    type="number"
                    value={settings.tariffs.commercialDaily}
                    onChange={(e) => setSettings({
                      ...settings,
                      tariffs: { ...settings.tariffs, commercialDaily: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="truckDaily">Poids lourd (FCFA/jour)</Label>
                  <Input
                    id="truckDaily"
                    type="number"
                    value={settings.tariffs.truckDaily}
                    onChange={(e) => setSettings({
                      ...settings,
                      tariffs: { ...settings.tariffs, truckDaily: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="processingFee">Frais de dossier (FCFA)</Label>
                  <Input
                    id="processingFee"
                    type="number"
                    value={settings.tariffs.processingFee}
                    onChange={(e) => setSettings({
                      ...settings,
                      tariffs: { ...settings.tariffs, processingFee: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuration des notifications
              </CardTitle>
              <CardDescription>Paramètres d'envoi des messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">Envoyer des emails aux propriétaires</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailEnabled: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par SMS</Label>
                    <p className="text-sm text-muted-foreground">Envoyer des SMS aux propriétaires</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsEnabled: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rappels automatiques</Label>
                    <p className="text-sm text-muted-foreground">Envoyer des rappels avant la fin du délai</p>
                  </div>
                  <Switch
                    checked={settings.notifications.autoReminders}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, autoReminders: checked }
                    })}
                  />
                </div>
              </div>

              {settings.notifications.autoReminders && (
                <div>
                  <Label>Jours de rappel</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Envoyer des rappels à 7, 3 et 1 jour(s) avant la fin du délai
                  </p>
                  <div className="flex gap-2">
                    {[7, 5, 3, 1].map(day => (
                      <label key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.reminderDays.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.notifications.reminderDays, day]
                              : settings.notifications.reminderDays.filter(d => d !== day);
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, reminderDays: newDays }
                            });
                          }}
                        />
                        <span className="text-sm">{day} jour{day > 1 ? 's' : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Settings */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Modèles de documents
              </CardTitle>
              <CardDescription>Configuration des modèles PDF et notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receiptTemplate">Modèle de reçu</Label>
                <Textarea
                  id="receiptTemplate"
                  rows={4}
                  value={settings.documents.receiptTemplate}
                  onChange={(e) => handleTemplateChange('receiptTemplate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="pvTemplate">Modèle de procès-verbal</Label>
                <Textarea
                  id="pvTemplate"
                  rows={4}
                  value={settings.documents.pvTemplate}
                  onChange={(e) => handleTemplateChange('pvTemplate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="noticeTemplate">Modèle d'avis</Label>
                <Textarea
                  id="noticeTemplate"
                  rows={4}
                  value={settings.documents.noticeTemplate}
                  onChange={(e) => handleTemplateChange('noticeTemplate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};