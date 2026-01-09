import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ProjectorBooking, User } from '@/lib/types';
import { addDays, startOfWeek, endOfWeek, format, parseISO, differenceInHours, isWithinInterval, addHours, startOfDay, isBefore, isAfter } from 'date-fns';
import { toast } from 'sonner';

export function useProjectorBookings(weekStart: Date) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ProjectorBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projector_bookings')
        .select(`
          *,
          user:users(id, name, room_number)
        `)
        .gte('start_datetime', format(weekStart, "yyyy-MM-dd'T'00:00:00"))
        .lte('start_datetime', format(weekEnd, "yyyy-MM-dd'T'23:59:59"));

      if (error) throw error;
      
      // Transform the data to match our type
      const transformedData = (data || []).map(booking => ({
        ...booking,
        user: booking.user as User | undefined
      })) as ProjectorBooking[];
      
      setBookings(transformedData);
    } catch (error) {
      console.error('Error fetching projector bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [weekStart]);

  const getUserWeeklyHours = async (): Promise<number> => {
    if (!user) return 0;

    // Get the Monday of the current week
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    const sunday = endOfWeek(weekStart, { weekStartsOn: 1 });

    const { data } = await supabase
      .from('projector_bookings')
      .select('duration_hours')
      .eq('user_id', user.id)
      .gte('start_datetime', format(monday, "yyyy-MM-dd'T'00:00:00"))
      .lte('start_datetime', format(sunday, "yyyy-MM-dd'T'23:59:59"));

    return (data || []).reduce((sum, b) => sum + b.duration_hours, 0);
  };

  const checkOverlap = (start: Date, end: Date): ProjectorBooking | null => {
    for (const booking of bookings) {
      const bookingStart = parseISO(booking.start_datetime);
      const bookingEnd = parseISO(booking.end_datetime);

      // Check if there's any overlap
      if (
        (start >= bookingStart && start < bookingEnd) ||
        (end > bookingStart && end <= bookingEnd) ||
        (start <= bookingStart && end >= bookingEnd)
      ) {
        return booking;
      }
    }
    return null;
  };

  const canBook = async (startTime: Date, duration: number): Promise<{ canBook: boolean; reason?: string }> => {
    if (!user) return { canBook: false, reason: 'Please log in to book' };

    const now = new Date();
    const maxDate = addDays(now, 60);
    const endTime = addHours(startTime, duration);

    // Check 60-day limit
    if (isAfter(startTime, maxDate)) {
      return { canBook: false, reason: 'Cannot book more than 60 days in advance' };
    }

    // Check if in the past
    if (isBefore(startTime, now)) {
      return { canBook: false, reason: 'Cannot book in the past' };
    }

    // Check duration
    if (duration < 1 || duration > 6) {
      return { canBook: false, reason: 'Duration must be 1-6 hours' };
    }

    // Check weekly hours
    const currentHours = await getUserWeeklyHours();
    if (currentHours + duration > 6) {
      return { canBook: false, reason: `You have ${6 - currentHours} hours left this week` };
    }

    // Check overlap
    const overlap = checkOverlap(startTime, endTime);
    if (overlap) {
      return { canBook: false, reason: 'This time overlaps with an existing booking' };
    }

    return { canBook: true };
  };

  const bookProjector = async (startTime: Date, duration: number) => {
    if (!user) return;

    const { canBook: allowed, reason } = await canBook(startTime, duration);
    if (!allowed) {
      toast.error(reason);
      return;
    }

    const endTime = addHours(startTime, duration);

    try {
      const { error } = await supabase
        .from('projector_bookings')
        .insert({
          user_id: user.id,
          start_datetime: startTime.toISOString(),
          end_datetime: endTime.toISOString(),
          duration_hours: duration,
        });

      if (error) throw error;

      toast.success('Projector booked!');
      fetchBookings();
    } catch (error: any) {
      console.error('Error booking projector:', error);
      toast.error(error.message || 'Failed to book projector');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('projector_bookings')
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
    canBook,
    bookProjector,
    cancelBooking,
    getUserWeeklyHours,
    refetch: fetchBookings,
  };
}
