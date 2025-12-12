import { Link } from 'react-router-dom';
import { Flame, Mail, FileText, Cookie, Shield } from 'lucide-react';
import furioazLogo from '@/assets/furioza-logo.png';

export function Footer() {
  return (
    <footer className="border-t border-border bg-coal texture-industrial">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={furioazLogo} alt="FURIOZA" className="h-10 w-10" />
              <span className="font-display text-2xl tracking-wider text-flame">
                FURIOZA
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Amatorski klub piłkarski z sercem w Zabrzu. 
              Gramy z pasją, wygrywamy z dumą.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide text-foreground">NAWIGACJA</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/forum" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Forum
              </Link>
              <Link to="/transfers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Transfery
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Dołącz do nas
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide text-foreground">INFORMACJE</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/regulamin" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Regulamin
              </Link>
              <Link to="/prywatnosc" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Polityka prywatności
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Cookie className="h-4 w-4" />
                Pliki cookies
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide text-foreground">KONTAKT</h4>
            <div className="flex flex-col gap-2">
              <a 
                href="mailto:kontakt@furioza.pl" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                kontakt@furioza.pl
              </a>
              <p className="text-sm text-muted-foreground">
                Zabrze, Śląsk, Polska
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FURIOZA. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-primary" />
            <span>Zbudowane z pasją w Zabrzu</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
