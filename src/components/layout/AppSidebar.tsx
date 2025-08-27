import { NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigationItems = [
  {
    title: 'Tableau de bord',
    url: '/app/dashboard',
    icon: BarChart3,
    roles: ['admin', 'agent', 'finance'],
  },
  {
    title: 'Véhicules',
    url: '/app/vehicules',
    icon: Car,
    roles: ['admin', 'agent', 'finance'],
  },
  {
    title: 'Procédures',
    url: '/app/procedures',
    icon: FileText,
    roles: ['admin', 'agent', 'finance'],
  },
  {
    title: 'Paiements',
    url: '/app/paiements',
    icon: CreditCard,
    roles: ['admin', 'finance'],
  },
  {
    title: 'Notifications',
    url: '/app/notifications',
    icon: Bell,
    roles: ['admin', 'agent'],
  },
];

const adminItems = [
  {
    title: 'Utilisateurs',
    url: '/app/admin/utilisateurs',
    icon: Shield,
    roles: ['admin'],
  },
  {
    title: 'Paramètres',
    url: '/app/parametres',
    icon: Settings,
    roles: ['admin'],
  },
];

export const AppSidebar = () => {
  const { user, hasAnyRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getNavClassName = (path: string) => {
    const isCurrentPage = isActive(path);
    const baseClasses = "w-full justify-start transition-all duration-200 ease-out hover:scale-[1.02] transform-gpu";
    return isCurrentPage
      ? `${baseClasses} bg-primary text-primary-foreground hover:bg-primary-hover shadow-md animate-scale-in`
      : `${baseClasses} hover:bg-accent hover:text-accent-foreground hover:shadow-sm`;
  };

  const filteredNavItems = navigationItems.filter(item =>
    hasAnyRole(item.roles)
  );

  const filteredAdminItems = adminItems.filter(item =>
    hasAnyRole(item.roles)
  );

  return (
    <Sidebar className="border-r border-border transition-all duration-300 ease-out">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3 transition-all duration-300 ease-out hover:scale-[1.02] transform-gpu">
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <h2 className="font-semibold text-sm text-foreground truncate">
                Fourrière Municipale
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Mairie de Cotonou
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 transition-all duration-200 hover:bg-accent/70 hover:scale-[1.02] transform-gpu">
                  <Avatar className="h-8 w-8 transition-all duration-200 hover:shadow-lg">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 animate-fade-in">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.role === 'admin' && 'Administrateur'}
                        {user?.role === 'agent' && 'Agent de saisie'}
                        {user?.role === 'finance' && 'Responsable financier'}
                      </p>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredNavItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4 transition-all duration-200" />
                      {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto animate-scale-in transition-transform duration-200" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredAdminItems.map((item, index) => (
                  <SidebarMenuItem key={item.title} className="animate-fade-in" style={{ animationDelay: `${(filteredNavItems.length + index) * 50}ms` }}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClassName(item.url)}>
                        <item.icon className="h-4 w-4 transition-all duration-200" />
                        {!collapsed && <span className="transition-all duration-200">{item.title}</span>}
                        {!collapsed && isActive(item.url) && (
                          <ChevronRight className="h-4 w-4 ml-auto animate-scale-in transition-transform duration-200" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};