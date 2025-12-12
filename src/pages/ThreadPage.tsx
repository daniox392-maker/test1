import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { playSuccessSound } from '@/hooks/use-success-sound';
import { 
  Clock, 
  Pin, 
  Lock,
  Eye,
  Send,
  Flame,
  Trash2,
  Image,
  X,
  Plus
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
}

interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  is_flame_style: boolean;
  created_at: string;
}

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState<(Thread & { author?: Profile }) | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<(Post & { author?: Profile })[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isFlameStyle, setIsFlameStyle] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchPosts();
      incrementViews();
    }
  }, [threadId]);

  const incrementViews = async () => {
    await supabase
      .from('threads')
      .update({ views_count: (thread?.views_count || 0) + 1 })
      .eq('id', threadId);
  };

  const fetchThread = async () => {
    const { data } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();

    if (data) {
      const { data: authorData } = await supabase
        .from('public_profiles')
        .select('username, avatar_url')
        .eq('user_id', data.author_id)
        .maybeSingle();

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', data.category_id)
        .maybeSingle();

      setThread({ ...data, author: authorData || undefined });
      setCategory(categoryData);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (postsData) {
      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const { data: authorData } = await supabase
            .from('public_profiles')
            .select('username, avatar_url')
            .eq('user_id', post.author_id)
            .maybeSingle();

          return { ...post, author: authorData || undefined };
        })
      );
      setPosts(postsWithAuthors);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && imageUrls.length < 5) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Musisz być zalogowany, aby dodać komentarz');
      return;
    }

    if (!newPost.trim() && imageUrls.length === 0) {
      toast.error('Treść komentarza nie może być pusta');
      return;
    }

    if (thread?.is_locked) {
      toast.error('Ten wątek jest zamknięty');
      return;
    }

    setSubmitting(true);
    
    // Combine text with image URLs
    let fullContent = newPost;
    if (imageUrls.length > 0) {
      fullContent += '\n\n' + imageUrls.map(url => `[IMG]${url}[/IMG]`).join('\n');
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        thread_id: threadId,
        author_id: user.id,
        content: fullContent,
        is_flame_style: isFlameStyle,
      });

    if (error) {
      toast.error('Nie udało się dodać komentarza');
    } else {
      playSuccessSound();
      toast.success('Komentarz dodany!');
      setNewPost('');
      setIsFlameStyle(false);
      setImageUrls([]);
      fetchPosts();
    }
    
    setSubmitting(false);
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast.error('Nie udało się usunąć komentarza');
    } else {
      playSuccessSound();
      toast.success('Komentarz usunięty');
      fetchPosts();
    }
  };

  const renderContent = (content: string) => {
    // Parse [IMG]url[/IMG] tags
    const parts = content.split(/\[IMG\](.*?)\[\/IMG\]/g);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is an image URL
        return (
          <img 
            key={index} 
            src={part} 
            alt="Załącznik" 
            className="max-w-full h-auto rounded-lg mt-2 max-h-96 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="font-display text-3xl mb-4">Wątek nie został znaleziony</h1>
          <Button onClick={() => navigate('/forum')}>Powrót do forum</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/forum" className="hover:text-primary transition-colors">Forum</Link>
          <span>/</span>
          <Link to={`/forum/category/${category?.id}`} className="hover:text-primary transition-colors">
            {category?.name || 'Kategoria'}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{thread.title}</span>
        </div>

        {/* Thread Header */}
        <Card className="bg-card/50 border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={thread.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary">
                  {thread.author?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
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
                </div>
                <h1 className="font-display text-2xl md:text-3xl tracking-wide mb-2">
                  {thread.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{thread.author?.username || 'Nieznany'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(thread.created_at), 'd MMMM yyyy, HH:mm', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {thread.views_count} wyświetleń
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 prose prose-invert max-w-none">
              <div className="text-foreground">{renderContent(thread.content)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4 mb-8">
          <h2 className="font-display text-xl tracking-wide">
            Odpowiedzi ({posts.length})
          </h2>
          
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className={`bg-card/50 border-border ${post.is_flame_style ? 'post-flame' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary">
                      {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author?.username || 'Nieznany'}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
                        </span>
                      </div>
                      {(user?.id === post.author_id || isAdmin) && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeletePost(post.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>{renderContent(post.content)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        {!thread.is_locked && user && (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h3 className="font-display text-lg tracking-wide mb-4">Dodaj odpowiedź</h3>
              <form onSubmit={handleSubmitPost} className="space-y-4">
                <Textarea
                  placeholder="Napisz swoją odpowiedź..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[120px]"
                />
                
                {/* Image URLs */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Obrazki (max 5)
                  </Label>
                  
                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Obrazek ${index + 1}`}
                            className="h-16 w-16 object-cover rounded border border-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {imageUrls.length < 5 && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL obrazka (np. https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddImage}
                        disabled={!newImageUrl.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant={isFlameStyle ? 'fire' : 'outline'}
                    size="sm"
                    onClick={() => setIsFlameStyle(!isFlameStyle)}
                  >
                    <Flame className="mr-2 h-4 w-4" />
                    Styl płomienia
                  </Button>
                  <Button type="submit" variant="fire" disabled={submitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Wysyłanie...' : 'Wyślij'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {thread.is_locked && (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <p>Ten wątek jest zamknięty i nie można dodawać nowych odpowiedzi.</p>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Zaloguj się, aby dodać odpowiedź</p>
              <Button variant="fire" onClick={() => navigate('/auth')}>
                Zaloguj się
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
