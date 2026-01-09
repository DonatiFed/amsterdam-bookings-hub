import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Mail, Shield, Ban, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { User, KitchenBooking, ProjectorBooking, BlockedUser } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { KITCHEN_SLOTS } from '@/lib/types';

export default function Admin() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [kitchenBookings, setKitchenBookings] = useState<(KitchenBooking & { user: User })[]>([]);
  const [projectorBookings, setProjectorBookings] = useState<(ProjectorBooking & { user: User })[]>([]);
  const [raEmails, setRaEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, blockedRes, rolesRes, kitchenRes, projectorRes, configRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('blocked_users').select('*'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('kitchen_bookings').select('*, user:users(*)').order('booking_date', { ascending: false }).limit(50),
        supabase.from('projector_bookings').select('*, user:users(*)').order('start_datetime', { ascending: false }).limit(50),
        supabase.from('admin_config').select('*').eq('key', 'ra_emails').single(),
      ]);

      setUsers(usersRes.data as User[] || []);
      setBlockedUsers(blockedRes.data as BlockedUser[] || []);
      setAdmins((rolesRes.data || []).map((r: any) => r.user_id));
      setKitchenBookings((kitchenRes.data || []) as any);
      setProjectorBookings((projectorRes.data || []) as any);
      
      if (configRes.data) {
        try {
          setRaEmails(JSON.parse(configRes.data.value));
        } catch {
          setRaEmails([]);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
        toast.success('Admin role removed');
      } else {
        await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
        toast.success('Admin role granted');
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await supabase.from('blocked_users').delete().eq('user_id', userId);
        toast.success('User unblocked');
      } else {
        await supabase.from('blocked_users').insert({ user_id: userId });
        toast.success('User blocked');
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update block status');
    }
  };

  const deleteKitchenBooking = async (id: string) => {
    try {
      await supabase.from('kitchen_bookings').delete().eq('id', id);
      toast.success('Booking deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const deleteProjectorBooking = async (id: string) => {
    try {
      await supabase.from('projector_bookings').delete().eq('id', id);
      toast.success('Booking deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const addRaEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    const updated = [...raEmails, newEmail.trim()];
    try {
      await supabase
        .from('admin_config')
        .update({ value: JSON.stringify(updated), updated_at: new Date().toISOString() })
        .eq('key', 'ra_emails');
      
      setRaEmails(updated);
      setNewEmail('');
      toast.success('Email added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add email');
    }
  };

  const removeRaEmail = async (email: string) => {
    const updated = raEmails.filter(e => e !== email);
    try {
      await supabase
        .from('admin_config')
        .update({ value: JSON.stringify(updated), updated_at: new Date().toISOString() })
        .eq('key', 'ra_emails');
      
      setRaEmails(updated);
      toast.success('Email removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove email');
    }
  };

  const getSlotLabel = (type: string) => {
    return KITCHEN_SLOTS.find(s => s.type === type)?.label || type;
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">
            Manage users, bookings, and settings
          </p>
        </div>

        <Tabs defaultValue="users" className="animate-fade-up stagger-1">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              users.map((u) => {
                const isUserAdmin = admins.includes(u.id);
                const isUserBlocked = blockedUsers.some(b => b.user_id === u.id);
                const isSelf = u.id === currentUser?.id;

                return (
                  <Card key={u.id} className="border-0 shadow-md">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {u.name}
                          {isUserAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                          {isUserBlocked && (
                            <Badge variant="destructive" className="text-xs">Blocked</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Room {u.room_number}
                          {u.phone && ` · ${u.phone}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isSelf && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAdmin(u.id, isUserAdmin)}
                              title={isUserAdmin ? 'Remove admin' : 'Make admin'}
                            >
                              <Shield className={`h-4 w-4 ${isUserAdmin ? 'text-primary' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleBlock(u.id, isUserBlocked)}
                              className={isUserBlocked ? 'text-destructive' : ''}
                              title={isUserBlocked ? 'Unblock' : 'Block'}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-4 space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kitchen Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kitchenBookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No bookings</p>
                ) : (
                  kitchenBookings.slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium">
                          {format(parseISO(b.booking_date), 'MMM d')} · {getSlotLabel(b.slot_type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {b.user?.name} (Room {b.user?.room_number})
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteKitchenBooking(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Projector Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {projectorBookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No bookings</p>
                ) : (
                  projectorBookings.slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium">
                          {format(parseISO(b.start_datetime), 'MMM d, HH:mm')} – {format(parseISO(b.end_datetime), 'HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {b.user?.name} (Room {b.user?.room_number})
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteProjectorBooking(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">RA Email Recipients</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Daily booking digests will be sent to these addresses at 18:00
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addRaEmail}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {raEmails.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No emails configured</p>
                ) : (
                  <div className="space-y-2">
                    {raEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                        <span className="text-sm">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeRaEmail(email)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
