import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Zap, Users, MessageSquare, Trophy, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-zabrze.jpg';
import furioazLogo from '@/assets/furioza-logo.png';

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
        </div>

        {/* Content */}
        <div className="relative container px-4 text-center space-y-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img 
              src={furioazLogo} 
              alt="FURIOZA" 
              className="h-32 w-32 md:h-40 md:w-40 drop-shadow-[0_0_30px_hsl(142_76%_45%/0.5)]"
            />
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-wider">
            <span className="text-flame animate-flame">FURIOZA</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Amatorski klub piłkarski z sercem wykutym w ogniu Zabrza.
            Gramy z pasją, walczymy z furią.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {user ? (
              <Button variant="fire" size="xl" asChild>
                <Link to="/forum">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Przejdź do forum
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="fire" size="xl" asChild>
                  <Link to="/auth?mode=register">
                    <Zap className="mr-2 h-5 w-5" />
                    Dołącz do nas
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/forum">
                    Przeglądaj forum
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-steel-gradient">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl tracking-wider mb-4">
              <span className="text-flame">NASZA</span> SPOŁECZNOŚĆ
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dołącz do grona pasjonatów futbolu i poczuj prawdziwą energię klubu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_hsl(142_76%_45%/0.3)]">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="font-display text-2xl tracking-wide">FORUM</CardTitle>
                <CardDescription>
                  Dyskutuj z innymi członkami klubu, dziel się przemyśleniami i bądź na bieżąco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group/btn">
                  <Link to="/forum">
                    Przeglądaj dyskusje
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_hsl(142_76%_45%/0.3)]">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="font-display text-2xl tracking-wide">SPOŁECZNOŚĆ</CardTitle>
                <CardDescription>
                  Poznaj innych zawodników, buduj relacje i wspólnie twórz historię klubu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group/btn">
                  <Link to="/auth?mode=register">
                    Dołącz teraz
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_hsl(142_76%_45%/0.3)]">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="font-display text-2xl tracking-wide">TRANSFERY</CardTitle>
                <CardDescription>
                  Śledź ruchy transferowe i bądź na bieżąco z nowymi zawodnikami w drużynie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group/btn">
                  <Link to="/transfers">
                    Zobacz transfery
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <Zap className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl tracking-wider">
              GOTOWY NA <span className="text-flame">FURIĘ</span>?
            </h2>
            <p className="text-muted-foreground text-lg">
              Dołącz do FURIOZY już dziś i stań się częścią naszej rodziny. 
              Razem tworzymy historię amatorskiego futbolu w Zabrzu.
            </p>
            {!user && (
              <Button variant="fire" size="xl" asChild>
                <Link to="/auth?mode=register">
                  <Zap className="mr-2 h-5 w-5" />
                  Zarejestruj się za darmo
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
