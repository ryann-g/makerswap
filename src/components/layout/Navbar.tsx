import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  Package, 
  ClipboardList, 
  LayoutDashboard, 
  LogOut, 
  LogIn,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  currentView: string;
}

export function Navbar({ currentView }: NavbarProps) {
  const { user, profile, login, signOut } = useAuth();
  const navigate = useNavigate();

  const signOutHandler = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="bg-primary p-1.5 rounded-sm">
            <Cpu className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline-block">MakerSwap</span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Button 
            variant={currentView === 'marketplace' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Marketplace</span>
          </Button>
          <Button 
            variant={currentView === 'bounties' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => navigate('/bounties')}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">Bounties</span>
          </Button>

          {user ? (
            <div className="flex items-center gap-4">
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-8 w-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.image || ''} alt={profile?.name || ''} />
                      <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOutHandler} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={login} size="sm" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
