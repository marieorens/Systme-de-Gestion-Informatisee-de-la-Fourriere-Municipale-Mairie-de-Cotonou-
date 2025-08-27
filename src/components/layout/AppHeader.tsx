import { Search, Bell, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const AppHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 transition-all duration-300 ease-out">
      <div className="h-full px-6 flex items-center justify-between animate-fade-in">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 transform-gpu" /> 
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative transition-all duration-200 hover:scale-110 transform-gpu hover:shadow-md"
            onClick={() => navigate('/app/notifications')}
          >
            <Bell className="h-4 w-4 transition-all duration-200" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110 transform-gpu hover:shadow-lg">
                <Avatar className="h-8 w-8 transition-all duration-200">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 animate-scale-in" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {user?.role === 'admin' && 'Administrateur'}
                    {user?.role === 'agent' && 'Agent de saisie'}
                    {user?.role === 'finance' && 'Responsable financier'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="transition-all duration-200 hover:scale-[1.02] transform-gpu">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/app/change-password')} className="transition-all duration-200 hover:scale-[1.02] transform-gpu">
                <Settings className="mr-2 h-4 w-4" />
                <span>Changer mot de passe</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive transition-all duration-200 hover:scale-[1.02] transform-gpu">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};