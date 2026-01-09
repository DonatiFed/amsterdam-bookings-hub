import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { KitchenBooking, KitchenSlotType, User } from '@/lib/types';
import { KITCHEN_SLOTS } from '@/lib/types';
import { addDays, startOfDay, format, parseISO, differenceInHours } from 'date-fns';
import { toast } from 'sonner';

export function useKitchenBookings(weekStart: Date) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<KitchenBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitchen_bookings')
        .select(`
          *,
          user:users(id, name, room_number)
        `)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      
      // Transform the data to match our type
      const transformedData = (data || []).map(booking => ({
        ...booking,
        user: booking.user as User | undefined
      })) as KitchenBooking[];
      
      setBookings(transformedData);
    } catch (error) {
      console.error('Error fetching kitchen bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [weekStart]);

  const canBookSlot = (date: Date, slotType: KitchenSlotType): { canBook: boolean; reason?: string } => {
    if (!user) return { canBook: false, reason: 'Please log in to book' };

    const slot = KITCHEN_SLOTS.find(s => s.type === slotType);
    if (!slot) return { canBook: false, reason: 'Invalid slot' };

    // Calculate slot start time
    const slotStart = new Date(date);
    slotStart.setHours(slot.startHour, 0, 0, 0);

    // Check 24-hour rule
    const now = new Date();
    const hoursUntilSlot = differenceInHours(slotStart, now);
    if (hoursUntilSlot < 24) {
      return { canBook: false, reason: 'Must book at least 24 hours in advance' };
    }

    // Check if already booked
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingBooking = bookings.find(
      b => b.booking_date === dateStr && b.slot_type === slotType
    );
    if (existingBooking) {
      return { canBook: false, reason: `Booked by ${existingBooking.user?.name}` };
    }

    // Check if user already has a booking for this day
    const userDayBooking = bookings.find(
      b => b.booking_date === dateStr && b.user_id === user.id
    );
    if (userDayBooking) {
      return { canBook: false, reason: 'You can only book 1 slot per day' };
    }

    return { canBook: true };
  };

  const bookSlot = async (date: Date, slotType: KitchenSlotType) => {
    if (!user) return;

    const { canBook, reason } = canBookSlot(date, slotType);
    if (!canBook) {
      toast.error(reason);
      return;
    }

    try {
      const { error } = await supabase
        .from('kitchen_bookings')
        .insert({
          user_id: user.id,
          booking_date: format(date, 'yyyy-MM-dd'),
          slot_type: slotType,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This slot was just booked by someone else');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Kitchen slot booked!');
      fetchBookings();
    } catch (error: any) {
      console.error('Error booking slot:', error);
      toast.error(error.message || 'Failed to book slot');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  return {
    bookings,
    loading,
    canBookSlot,
    bookSlot,
    cancelBooking,
    refetch: fetchBookings,
  };
}
