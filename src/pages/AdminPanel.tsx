import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { playSuccessSound } from '@/hooks/use-success-sound';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  Ban,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CalendarIcon,
  Settings,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  description: string;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
  role?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface Transfer {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  position: string;
  description: string;
  transfer_type: string;
  transfer_date?: string;
}

interface AdminLog {
  id: string;
  action: string;
  details: unknown;
  created_at: string;
  admin_username?: string;
  target_username?: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission: string;
}

const ALL_PERMISSIONS = [
  { key: 'edit_any_profile', label: 'Edycja profili innych użytkowników' },
  { key: 'delete_threads', label: 'Usuwanie wątków' },
  { key: 'manage_transfers', label: 'Zarządzanie transferami' },
  { key: 'manage_categories', label: 'Zarządzanie kategoriami' },
  { key: 'ban_users', label: 'Banowanie użytkowników' },
  { key: 'manage_roles', label: 'Zarządzanie rolami' },
];

const ROLE_STYLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: 'Admin', color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: <Shield className="h-3 w-3" /> },
  kapitan: { label: 'Kapitan', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: <Crown className="h-3 w-3" /> },
  trener: { label: 'Trener', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: <Star className="h-3 w-3" /> },
  zawodnik: { label: 'Zawodnik', color: 'bg-secondary text-muted-foreground border-border', icon: null },
};

export default function AdminPanelPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile dialog
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', description: '' });

  // New category form
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'MessageSquare' });
  
  // New transfer form
  const [newTransfer, setNewTransfer] = useState({
    first_name: '',
    last_name: '',
    age: '',
    position: '',
    description: '',
    transfer_type: 'in',
    transfer_date: new Date()
  });

  // New thread form
  const [newThread, setNewThread] = useState({
    category_id: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    // Fetch users with roles
    const { data: profilesData } = await supabase.from('profiles').select('*');
    
    if (profilesData) {
      const usersWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();
          
          return { ...profile, role: roleData?.role || 'zawodnik' };
        })
      );
      setUsers(usersWithRoles);
    }

    // Fetch categories
    const { data: categoriesData } = await supabase.from('categories').select('*').order('sort_order');
    if (categoriesData) setCategories(categoriesData);

    // Fetch transfers
    const { data: transfersData } = await supabase.from('transfers').select('*').order('created_at', { ascending: false });
    if (transfersData) setTransfers(transfersData);

    // Fetch logs
    const { data: logsData } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (logsData) setLogs(logsData as AdminLog[]);

    // Fetch role permissions
    const { data: permData } = await supabase.from('role_permissions').select('*');
    if (permData) setRolePermissions(permData as RolePermission[]);

    setLoading(false);
  };

  const logAdminAction = async (action: string, targetUserId?: string, details?: Record<string, string | number>) => {
    await supabase.from('admin_logs').insert([{
      admin_id: user?.id,
      action,
      target_user_id: targetUserId || null,
      details: (details || {}) as unknown as Record<string, never>
    }]);
  };

  const handleChangeRole = async (targetUser: UserProfile, newRole: 'admin' | 'kapitan' | 'trener' | 'zawodnik') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', targetUser.user_id);

    if (error) {
      toast.error('Nie udało się zmienić rangi');
    } else {
      playSuccessSound();
      toast.success(`Zmieniono rangę na ${ROLE_STYLES[newRole]?.label || newRole}`);
      await logAdminAction('CHANGE_ROLE', targetUser.user_id, { newRole });
      fetchData();
    }
  };

  const handleToggleBan = async (targetUser: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !targetUser.is_banned })
      .eq('user_id', targetUser.user_id);

    if (error) {
      toast.error('Nie udało się zbanować użytkownika');
    } else {
      playSuccessSound();
      toast.success(targetUser.is_banned ? 'Użytkownik odbanowany' : 'Użytkownik zbanowany');
      await logAdminAction(
        targetUser.is_banned ? 'UNBAN_USER' : 'BAN_USER',
        targetUser.user_id
      );
      fetchData();
    }
  };

  const handleEditProfile = (targetUser: UserProfile) => {
    setEditingUser(targetUser);
    setEditForm({
      username: targetUser.username,
      email: targetUser.email,
      description: targetUser.description || ''
    });
  };

  const handleSaveProfile = async () => {
    if (!editingUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editForm.username,
        email: editForm.email,
        description: editForm.description
      })
      .eq('user_id', editingUser.user_id);

    if (error) {
      toast.error('Nie udało się zaktualizować profilu');
    } else {
      playSuccessSound();
      toast.success('Profil zaktualizowany');
      await logAdminAction('EDIT_PROFILE', editingUser.user_id, { 
        username: editForm.username 
      });
      setEditingUser(null);
      fetchData();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('categories').insert({
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon,
      created_by: user?.id,
      sort_order: categories.length
    });

    if (error) {
      toast.error('Nie udało się utworzyć kategorii');
    } else {
      playSuccessSound();
      toast.success('Kategoria utworzona');
      setNewCategory({ name: '', description: '', icon: 'MessageSquare' });
      await logAdminAction('CREATE_CATEGORY', undefined, { name: newCategory.name });
      fetchData();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);

    if (error) {
      toast.error('Nie udało się usunąć kategorii');
    } else {
      playSuccessSound();
      toast.success('Kategoria usunięta');
      await logAdminAction('DELETE_CATEGORY', undefined, { categoryId });
      fetchData();
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('threads').insert({
      category_id: newThread.category_id,
      title: newThread.title,
      content: newThread.content,
      author_id: user?.id
    });

    if (error) {
      toast.error('Nie udało się utworzyć wątku');
    } else {
      playSuccessSound();
      toast.success('Wątek utworzony');
      setNewThread({ category_id: '', title: '', content: '' });
      await logAdminAction('CREATE_THREAD', undefined, { title: newThread.title });
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('transfers').insert({
      first_name: newTransfer.first_name,
      last_name: newTransfer.last_name,
      age: parseInt(newTransfer.age),
      position: newTransfer.position,
      description: newTransfer.description,
      transfer_type: newTransfer.transfer_type,
      transfer_date: format(newTransfer.transfer_date, 'yyyy-MM-dd'),
      created_by: user?.id
    });

    if (error) {
      toast.error('Nie udało się dodać transferu');
    } else {
      playSuccessSound();
      toast.success('Transfer dodany');
      setNewTransfer({
        first_name: '',
        last_name: '',
        age: '',
        position: '',
        description: '',
        transfer_type: 'in',
        transfer_date: new Date()
      });
      await logAdminAction('CREATE_TRANSFER', undefined, { 
        name: `${newTransfer.first_name} ${newTransfer.last_name}` 
      });
      fetchData();
    }
  };

  const handleDeleteTransfer = async (transferId: string) => {
    const { error } = await supabase.from('transfers').delete().eq('id', transferId);

    if (error) {
      toast.error('Nie udało się usunąć transferu');
    } else {
      playSuccessSound();
      toast.success('Transfer usunięty');
      await logAdminAction('DELETE_TRANSFER', undefined, { transferId });
      fetchData();
    }
  };

  const handleTogglePermission = async (role: 'admin' | 'kapitan' | 'trener' | 'zawodnik', permission: string) => {
    const existing = rolePermissions.find(p => p.role === role && p.permission === permission);
    
    if (existing) {
      const { error } = await supabase.from('role_permissions').delete().eq('id', existing.id);
      if (error) {
        toast.error('Nie udało się usunąć uprawnienia');
      } else {
        playSuccessSound();
        toast.success('Uprawnienie usunięte');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('role_permissions').insert([{ role, permission }]);
      if (error) {
        toast.error('Nie udało się dodać uprawnienia');
      } else {
        playSuccessSound();
        toast.success('Uprawnienie dodane');
        fetchData();
      }
    }
  };

  const hasPermission = (role: string, permission: string) => {
    return rolePermissions.some(p => p.role === role && p.permission === permission);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8 px-4">
        <h1 className="font-display text-4xl tracking-wider mb-8">
          <span className="text-flame">PANEL</span> ADMINISTRATORA
        </h1>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 md:w-auto md:inline-grid">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Użytkownicy</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Kategorie</span>
            </TabsTrigger>
            <TabsTrigger value="threads" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Wątki</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transfery</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Uprawnienia</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Logi</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl">Zarządzanie użytkownikami</CardTitle>
                <CardDescription>Lista wszystkich użytkowników forum</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.username}</span>
                            <Badge className={cn('gap-1', ROLE_STYLES[u.role || 'zawodnik']?.color)}>
                              {ROLE_STYLES[u.role || 'zawodnik']?.icon}
                              {ROLE_STYLES[u.role || 'zawodnik']?.label}
                            </Badge>
                            {u.is_banned && <Badge variant="destructive">Zbanowany</Badge>}
                          </div>
                          <span className="text-sm text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={u.role || 'zawodnik'}
                          onValueChange={(value) => handleChangeRole(u, value as 'admin' | 'kapitan' | 'trener' | 'zawodnik')}
                          disabled={u.user_id === user?.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="kapitan">Kapitan</SelectItem>
                            <SelectItem value="trener">Trener</SelectItem>
                            <SelectItem value="zawodnik">Zawodnik</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditProfile(u)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={u.is_banned ? 'default' : 'destructive'}
                          size="icon"
                          onClick={() => handleToggleBan(u)}
                          disabled={u.user_id === user?.id}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Nowa kategoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nazwa</Label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Opis</Label>
                      <Textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      />
                    </div>
                    <Button type="submit" variant="fire">
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj kategorię
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Istniejące kategorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <span className="font-medium">{cat.name}</span>
                          <p className="text-sm text-muted-foreground">{cat.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Threads Tab */}
          <TabsContent value="threads">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl">Nowy wątek</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kategoria</Label>
                    <Select
                      value={newThread.category_id}
                      onValueChange={(value) => setNewThread({ ...newThread, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tytuł</Label>
                    <Input
                      value={newThread.title}
                      onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Treść</Label>
                    <Textarea
                      value={newThread.content}
                      onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                      className="min-h-[200px]"
                      required
                    />
                  </div>
                  <Button type="submit" variant="fire">
                    <Plus className="mr-2 h-4 w-4" />
                    Utwórz wątek
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfers Tab */}
          <TabsContent value="transfers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Nowy transfer</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTransfer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Imię</Label>
                        <Input
                          value={newTransfer.first_name}
                          onChange={(e) => setNewTransfer({ ...newTransfer, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nazwisko</Label>
                        <Input
                          value={newTransfer.last_name}
                          onChange={(e) => setNewTransfer({ ...newTransfer, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Wiek</Label>
                        <Input
                          type="number"
                          value={newTransfer.age}
                          onChange={(e) => setNewTransfer({ ...newTransfer, age: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pozycja</Label>
                        <Input
                          value={newTransfer.position}
                          onChange={(e) => setNewTransfer({ ...newTransfer, position: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Data transferu</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newTransfer.transfer_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTransfer.transfer_date ? format(newTransfer.transfer_date, 'd MMMM yyyy', { locale: pl }) : <span>Wybierz datę</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newTransfer.transfer_date}
                            onSelect={(date) => date && setNewTransfer({ ...newTransfer, transfer_date: date })}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Typ</Label>
                      <Select
                        value={newTransfer.transfer_type}
                        onValueChange={(value) => setNewTransfer({ ...newTransfer, transfer_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Przychodzący</SelectItem>
                          <SelectItem value="out">Odchodzący</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Opis</Label>
                      <Textarea
                        value={newTransfer.description}
                        onChange={(e) => setNewTransfer({ ...newTransfer, description: e.target.value })}
                      />
                    </div>
                    <Button type="submit" variant="fire">
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj transfer
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Lista transferów</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {transfers.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            t.transfer_type === 'in' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {t.transfer_type === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <span className="font-medium">{t.first_name} {t.last_name}</span>
                            <p className="text-sm text-muted-foreground">
                              {t.position}, {t.age} lat
                              {t.transfer_date && ` • ${format(new Date(t.transfer_date), 'd MMM yyyy', { locale: pl })}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransfer(t.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl">Zarządzanie uprawnieniami</CardTitle>
                <CardDescription>Przypisz uprawnienia do poszczególnych ról</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Uprawnienie</th>
                        <th className="text-center py-3 px-4 font-medium">
                          <Badge className={cn('gap-1', ROLE_STYLES.admin.color)}>
                            {ROLE_STYLES.admin.icon}
                            Admin
                          </Badge>
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          <Badge className={cn('gap-1', ROLE_STYLES.kapitan.color)}>
                            {ROLE_STYLES.kapitan.icon}
                            Kapitan
                          </Badge>
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          <Badge className={cn('gap-1', ROLE_STYLES.trener.color)}>
                            {ROLE_STYLES.trener.icon}
                            Trener
                          </Badge>
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          <Badge className={cn('gap-1', ROLE_STYLES.zawodnik.color)}>
                            Zawodnik
                          </Badge>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_PERMISSIONS.map((perm) => (
                        <tr key={perm.key} className="border-b border-border/50">
                          <td className="py-3 px-4">{perm.label}</td>
                          {(['admin', 'kapitan', 'trener', 'zawodnik'] as const).map((role) => (
                            <td key={role} className="text-center py-3 px-4">
                              <Checkbox
                                checked={hasPermission(role, perm.key)}
                                onCheckedChange={() => handleTogglePermission(role, perm.key)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="font-display text-xl">Logi administratora</CardTitle>
                <CardDescription>Historia akcji administracyjnych</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
                        </span>
                      </div>
                      {log.details && Object.keys(log.details as object).length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edytuj profil użytkownika</DialogTitle>
              <DialogDescription>
                Edytujesz profil: {editingUser?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nazwa użytkownika</Label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Opis</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Anuluj
              </Button>
              <Button variant="fire" onClick={handleSaveProfile}>
                Zapisz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
