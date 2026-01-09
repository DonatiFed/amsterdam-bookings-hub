import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Tv, Trash2 } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { KITCHEN_SLOTS } from '@/lib/types';
import type { KitchenBooking, ProjectorBooking } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MyBookings() {
  const { user } = useAuth();
  const [kitchenBookings, setKitchenBookings] = useState<KitchenBooking[]>([]);
  const [projectorBookings, setProjectorBookings] = useState<ProjectorBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [kitchenRes, projectorRes] = await Promise.all([
        supabase
          .from('kitchen_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('booking_date', today)
          .order('booking_date', { ascending: true }),
        supabase
          .from('projector_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_datetime', new Date().toISOString())
          .order('start_datetime', { ascending: true }),
      ]);

      if (kitchenRes.error) throw kitchenRes.error;
      if (projectorRes.error) throw projectorRes.error;

      setKitchenBookings(kitchenRes.data as KitchenBooking[]);
      setProjectorBookings(projectorRes.data as ProjectorBooking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelKitchenBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel');
    }
  };

  const cancelProjectorBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projector_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel');
    }
  };

  const getSlotLabel = (type: string) => {
    return KITCHEN_SLOTS.find(s => s.type === type)?.label || type;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your upcoming reservations
          </p>
        </div>

        <Tabs defaultValue="kitchen" className="animate-fade-up stagger-1">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="kitchen" className="gap-2">
              <Calendar className="h-4 w-4" />
              Kitchen
            </TabsTrigger>
            <TabsTrigger value="projector" className="gap-2">
              <Tv className="h-4 w-4" />
              Projector
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kitchen" className="mt-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : kitchenBookings.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming kitchen bookings
                </CardContent>
              </Card>
            ) : (
              kitchenBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {format(parseISO(booking.booking_date), 'EEEE, MMM d')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getSlotLabel(booking.slot_type)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => cancelKitchenBooking(booking.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="projector" className="mt-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : projectorBookings.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming projector bookings
                </CardContent>
              </Card>
            ) : (
              projectorBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {format(parseISO(booking.start_datetime), 'EEEE, MMM d')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(booking.start_datetime), 'HH:mm')} – {format(parseISO(booking.end_datetime), 'HH:mm')}
                        <span className="ml-2">({booking.duration_hours}h)</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => cancelProjectorBooking(booking.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
