import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Flame, Menu, X, User, Settings, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import furioazLogo from '@/assets/furioza-logo.png';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={furioazLogo} alt="FURIOZA" className="h-10 w-10 transition-transform group-hover:scale-110" />
          <span className="font-display text-2xl tracking-wider text-flame animate-flame">
            FURIOZA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/forum" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Forum
          </Link>
          <Link 
            to="/transfers" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Transfery
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {isAdmin ? 'Admin' : 'Zawodnik'}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/panel')}>
                  <User className="mr-2 h-4 w-4" />
                  Panel użytkownika
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/panel/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Ustawienia
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Panel admina
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj się
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Zaloguj się
              </Button>
              <Button variant="fire" onClick={() => navigate('/auth?mode=register')}>
                <Flame className="mr-2 h-4 w-4" />
                Dołącz do nas
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-4">
            <Link 
              to="/forum" 
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Forum
            </Link>
            <Link 
              to="/transfers" 
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Transfery
            </Link>
            {user ? (
              <>
                <Link 
                  to="/panel" 
                  className="text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel użytkownika
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-sm font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Panel admina
                  </Link>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  Wyloguj się
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                  Zaloguj się
                </Button>
                <Button variant="fire" onClick={() => { navigate('/auth?mode=register'); setMobileMenuOpen(false); }}>
                  Dołącz do nas
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
