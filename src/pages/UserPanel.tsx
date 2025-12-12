import { useState, useRef } from 'react';
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
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, FileText, Camera, Shield, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function UserPanelPage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [email, setEmail] = useState(profile?.email || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [loading, setLoading] = useState(false);

  if (!user || !profile) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="font-display text-3xl mb-4">Musisz być zalogowany</h1>
          <Button variant="fire" onClick={() => navigate('/auth')}>
            Zaloguj się
          </Button>
        </div>
      </Layout>
    );
  }

  const canChangeEmail = !profile.last_email_change || 
    differenceInDays(new Date(), new Date(profile.last_email_change)) >= 31;
  
  const canChangeAvatar = !profile.last_avatar_change || 
    differenceInDays(new Date(), new Date(profile.last_avatar_change)) >= 31;

  const daysUntilEmailChange = profile.last_email_change 
    ? Math.max(0, 31 - differenceInDays(new Date(), new Date(profile.last_email_change)))
    : 0;

  const daysUntilAvatarChange = profile.last_avatar_change 
    ? Math.max(0, 31 - differenceInDays(new Date(), new Date(profile.last_avatar_change)))
    : 0;

  const handleUpdateDescription = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ description })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Nie udało się zaktualizować opisu');
    } else {
      toast.success('Opis został zaktualizowany');
      refreshProfile();
    }
    
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!canChangeEmail) {
      toast.error(`Możesz zmienić email za ${daysUntilEmailChange} dni`);
      return;
    }

    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        email,
        last_email_change: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Nie udało się zaktualizować emaila');
    } else {
      toast.success('Email został zaktualizowany');
      refreshProfile();
    }
    
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canChangeAvatar) {
      toast.error(`Możesz zmienić avatar za ${daysUntilAvatarChange} dni`);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Plik jest za duży. Maksymalny rozmiar to 2MB');
      return;
    }

    setLoading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Nie udało się przesłać zdjęcia');
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        last_avatar_change: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      toast.error('Nie udało się zaktualizować avatara');
    } else {
      toast.success('Avatar został zaktualizowany');
      refreshProfile();
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-4xl">
        <h1 className="font-display text-4xl tracking-wider mb-8">
          <span className="text-flame">PANEL</span> UŻYTKOWNIKA
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="bg-card/50 border-border md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary/50">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canChangeAvatar || loading}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              
              <h2 className="font-display text-2xl tracking-wide mb-2">
                {profile.username}
              </h2>
              
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="mb-4">
                <Shield className="h-3 w-3 mr-1" />
                {isAdmin ? 'Admin' : 'Zawodnik'}
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                Dołączył: {format(new Date(profile.created_at), 'd MMMM yyyy', { locale: pl })}
              </p>

              {!canChangeAvatar && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Zmiana avatara za {daysUntilAvatarChange} dni
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-card/50 border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-xl tracking-wide">Ustawienia profilu</CardTitle>
              <CardDescription>Zarządzaj swoimi danymi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Opis o sobie</Label>
                <Textarea
                  id="description"
                  placeholder="Napisz coś o sobie..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleUpdateDescription} disabled={loading}>
                  Zapisz opis
                </Button>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adres email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canChangeEmail}
                  />
                  <Button 
                    onClick={handleUpdateEmail} 
                    disabled={loading || !canChangeEmail}
                  >
                    Zmień
                  </Button>
                </div>
                {!canChangeEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Możesz zmienić email za {daysUntilEmailChange} dni
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
