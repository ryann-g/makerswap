import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function ProfileView() {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    universityOrg: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        universityOrg: profile.universityOrg || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      const firebaseCode = (error as { code?: string })?.code;
      console.error('[Profile] Save error:', { code: firebaseCode, error });
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Personalize how other makers see you.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.image || ''} />
            <AvatarFallback className="text-2xl">{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle>{profile?.name}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
             <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="How others should call you"
                autoComplete="nopill"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org">University / Organization</Label>
              <Input 
                id="org" 
                value={formData.universityOrg} 
                onChange={e => setFormData({...formData, universityOrg: e.target.value})}
                placeholder="e.g. MSU-IIT Robotics Club"
                autoComplete="nopill"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea 
                id="bio" 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell others about your hardware interests..."
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
