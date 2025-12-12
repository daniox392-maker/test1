import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { playSuccessSound } from '@/hooks/use-success-sound';
import { 
  MessageSquare, 
  Clock, 
  Pin, 
  Lock,
  Plus,
  ChevronLeft,
  Eye,
  User,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

interface Thread {
  id: string;
  title: string;
  content: string;
  category_id: string;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Profile {
  username: string;
  avatar_url: string | null;
}

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<(Thread & { author?: Profile; posts_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
      fetchThreads();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();

    if (data) setCategory(data);
  };

  const fetchThreads = async () => {
    const { data: threadsData } = await supabase
      .from('threads')
      .select('*')
      .eq('category_id', categoryId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (threadsData) {
      const threadsWithData = await Promise.all(
        threadsData.map(async (thread) => {
          const { data: authorData } = await supabase
            .from('public_profiles')
            .select('username, avatar_url')
            .eq('user_id', thread.author_id)
            .maybeSingle();

          const { count: postsCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);

          return {
            ...thread,
            author: authorData || undefined,
            posts_count: postsCount || 0,
          };
        })
      );
      setThreads(threadsWithData);
    }
    setLoading(false);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Czy na pewno chcesz usunąć ten wątek?')) return;

    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      toast.error('Nie udało się usunąć wątku');
    } else {
      playSuccessSound();
      toast.success('Wątek usunięty');
      fetchThreads();
    }
  };

  return (
    <Layout>
      <div className="container py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/forum" className="hover:text-primary transition-colors">Forum</Link>
          <span>/</span>
          <span className="text-foreground">{category?.name || 'Kategoria'}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-wider mb-2">
              {category?.name || 'Ładowanie...'}
            </h1>
            <p className="text-muted-foreground">
              {category?.description}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/forum')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
            {isAdmin && (
              <Button variant="fire" onClick={() => navigate('/admin?tab=threads')}>
                <Plus className="mr-2 h-4 w-4" />
                Nowy wątek
              </Button>
            )}
          </div>
        </div>

        {/* Threads List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-card/50">
                <CardContent className="p-4">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-2xl mb-2">Brak wątków</h3>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Utwórz pierwszy wątek w tej kategorii.'
                  : 'W tej kategorii nie ma jeszcze żadnych wątków.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link key={thread.id} to={`/forum/thread/${thread.id}`}>
                <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={thread.author?.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary">
                          {thread.author?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {thread.is_pinned && (
                            <Badge variant="outline" className="border-primary text-primary">
                              <Pin className="h-3 w-3 mr-1" />
                              Przypięty
                            </Badge>
                          )}
                          {thread.is_locked && (
                            <Badge variant="outline" className="border-muted-foreground">
                              <Lock className="h-3 w-3 mr-1" />
                              Zamknięty
                            </Badge>
                          )}
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {thread.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {thread.author?.username || 'Nieznany'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(thread.created_at), 'd MMM yyyy', { locale: pl })}
                          </span>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{thread.posts_count}</div>
                          <div>Odpowiedzi</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{thread.views_count}</div>
                          <div>Wyświetleń</div>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteThread(e, thread.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
