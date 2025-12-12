import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { 
  MessageSquare, 
  Users, 
  Flame,
  Plus,
  ChevronRight
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  threads_count?: number;
}

export default function ForumPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      const categoriesWithStats = await Promise.all(
        data.map(async (cat) => {
          const { count: threadsCount } = await supabase
            .from('threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);

          return {
            ...cat,
            threads_count: threadsCount || 0,
          };
        })
      );
      setCategories(categoriesWithStats);
    }
    setLoading(false);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare className="h-6 w-6" />;
      case 'Users': return <Users className="h-6 w-6" />;
      case 'Flame': return <Flame className="h-6 w-6" />;
      default: return <MessageSquare className="h-6 w-6" />;
    }
  };

  return (
    <Layout>
      <div className="container py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wider mb-2">
              <span className="text-flame">FORUM</span> FURIOZA
            </h1>
            <p className="text-muted-foreground">
              Dyskutuj, dziel się opinią i bądź częścią naszej społeczności
            </p>
          </div>
          {isAdmin && (
            <Button variant="fire" onClick={() => navigate('/admin?tab=categories')}>
              <Plus className="mr-2 h-4 w-4" />
              Nowa kategoria
            </Button>
          )}
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-card/50">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-2xl mb-2">Brak kategorii</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin 
                  ? 'Stwórz pierwszą kategorię, aby rozpocząć dyskusje.'
                  : 'Administrator nie dodał jeszcze kategorii.'
                }
              </p>
              {isAdmin && (
                <Button variant="fire" onClick={() => navigate('/admin?tab=categories')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj kategorię
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/forum/category/${category.id}`}>
                <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_hsl(142_76%_45%/0.3)]">
                        {getIconComponent(category.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl tracking-wide text-foreground group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{category.threads_count || 0}</div>
                          <div>Wątków</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
