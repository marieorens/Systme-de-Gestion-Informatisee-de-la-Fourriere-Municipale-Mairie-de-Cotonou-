import { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail, Smartphone, Bell, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Notification } from '@/types';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/types/enums';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services';

const notificationTemplates = [
  {
    id: 'entry',
    name: 'Mise en fourrière',
    subject: 'Véhicule mis en fourrière',
    content: 'Votre véhicule {plateNumber} a été mis en fourrière le {date}. Vous disposez de 15 jours pour le récupérer.'
  },
  {
    id: 'reminder',
    name: 'Rappel délai',
    subject: 'Rappel - Véhicule en fourrière',
    content: 'Rappel: Il vous reste {remainingDays} jours pour récupérer votre véhicule {plateNumber}.'
  },
  {
    id: 'final_notice',
    name: 'Dernier avis',
    subject: 'Dernier avis - Procédure de vente',
    content: 'Dernier avis: Votre véhicule {plateNumber} sera vendu aux enchères si vous ne le récupérez pas sous 48h.'
  }
];

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationChannel>(NotificationChannel.SMS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        setNotifications(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.READ:
        return <Badge variant="secondary" className="bg-success-light text-success">Lu</Badge>;
      case NotificationStatus.UNREAD:
        return <Badge variant="default">Non lu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (channel: NotificationChannel | string) => {
    switch (channel) {
      case NotificationChannel.SMS:
        return <Smartphone className="w-4 h-4" />;
      case NotificationChannel.EMAIL:
        return <Mail className="w-4 h-4" />;
      case NotificationChannel.IN_APP:
        return <Bell className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return 'Information';
      case NotificationType.WARNING:
        return 'Avertissement';
      case NotificationType.ALERT:
        return 'Alerte';
      case NotificationType.PAYMENT:
        return 'Paiement';
      case NotificationType.PROCEDURE:
        return 'Procédure';
      default:
        return type;
    }
  };

  const readCount = notifications.filter(n => n.status === NotificationStatus.READ).length;
  const unreadCount = notifications.filter(n => n.status === NotificationStatus.UNREAD).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Gestion des communications avec les propriétaires</p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">Envoyer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        {/* Send Notifications Tab */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nouvelle notification</CardTitle>
                <CardDescription>Envoyer un message aux propriétaires</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type de notification</label>
                  <Select value={notificationType} onValueChange={(value) => setNotificationType(value as NotificationChannel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NotificationChannel.SMS}>SMS</SelectItem>
                      <SelectItem value={NotificationChannel.EMAIL}>Email</SelectItem>
                      <SelectItem value={NotificationChannel.IN_APP}>Notification in-app</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Modèle prédéfini</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message personnalisé</label>
                  <Textarea
                    placeholder="Tapez votre message ici..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Destinataires</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner les destinataires" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les propriétaires</SelectItem>
                      <SelectItem value="overdue">Délai dépassé</SelectItem>
                      <SelectItem value="expiring">Délai proche</SelectItem>
                      <SelectItem value="specific">Sélection spécifique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const title = selectedTemplate 
                        ? notificationTemplates.find(t => t.id === selectedTemplate)?.subject || 'Notification'
                        : 'Notification personnalisée';
                        
                      await notificationService.sendNotification({
                        title,
                        content: customMessage,
                        type: NotificationType.INFO,
                        channel: notificationType
                      });
                      
                      // Rafraîchir la liste des notifications
                      const response = await notificationService.getNotifications();
                      setNotifications(response.data);
                      
                      setCustomMessage('');
                      setSelectedTemplate('');
                      
                      alert('Notification envoyée avec succès!');
                    } catch (error) {
                      console.error('Erreur lors de l\'envoi de la notification:', error);
                      alert('Erreur lors de l\'envoi de la notification');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer notification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aperçu du message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(notificationType)}
                    <span className="text-sm font-medium capitalize">{notificationType}</span>
                  </div>
                  <div className="text-sm">
                    {selectedTemplate ? 
                      notificationTemplates.find(t => t.id === selectedTemplate)?.content || customMessage :
                      customMessage || "Votre message apparaîtra ici..."
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notifications.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Lus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{readCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Non lus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{unreadCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">ID</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[80px]">Canal</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[120px]">Destinataire</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[200px]">Message</TableHead>
                      <TableHead className="min-w-[80px]">Statut</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Chargement des notifications...
                      </TableCell>
                    </TableRow>
                  ) : notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucune notification trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">{notification.id}</TableCell>
                        <TableCell className="hidden sm:table-cell">{getTypeLabel(notification.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.channel)}
                            <span className="hidden sm:inline capitalize">{notification.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {notification.owner?.first_name} {notification.owner?.last_name}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xs truncate">{notification.content}</TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {notificationTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </div>
                    {user?.role === 'admin' && (
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    {template.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};