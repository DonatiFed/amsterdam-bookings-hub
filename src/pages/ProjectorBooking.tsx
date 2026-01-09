import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useProjectorBookings } from '@/hooks/useProjectorBookings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Clock, Tv } from 'lucide-react';
import { addDays, startOfWeek, format, parseISO, isSameDay, addHours, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProjectorBooking() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(18);
  const [duration, setDuration] = useState<number>(2);
  const [weeklyHours, setWeeklyHours] = useState(0);
  
  const today = new Date();
  const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = addDays(baseWeekStart, weekOffset * 7);
  
  const { bookings, loading, bookProjector, getUserWeeklyHours } = useProjectorBookings(weekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Check if this week is beyond 60 days
  const maxDate = addDays(today, 60);
  const isWeekDisabled = weekStart > maxDate;

  useEffect(() => {
    if (user) {
      getUserWeeklyHours().then(setWeeklyHours);
    }
  }, [user, bookings]);

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(b => 
      format(parseISO(b.start_datetime), 'yyyy-MM-dd') === dateStr
    );
  };

  const handleBook = async () => {
    if (!selectedDate) return;
    
    const startTime = setMinutes(setHours(selectedDate, selectedHour), 0);
    await bookProjector(startTime, duration);
    setSelectedDate(null);
  };

  const hoursRemaining = 6 - weeklyHours;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold">Projector</h1>
            <p className="text-muted-foreground text-sm">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{hoursRemaining}h left</div>
              <div className="text-xs text-muted-foreground">this week</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(w => w - 1)}
                disabled={weekOffset === 0}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekOffset(w => w + 1)}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isWeekDisabled && (
          <Card className="border-0 shadow-md mb-4 bg-muted/50">
            <CardContent className="p-4 text-center text-muted-foreground">
              This week is beyond the 60-day booking limit
            </CardContent>
          </Card>
        )}

        {/* Week grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6 animate-fade-up stagger-1">
          {weekDays.map((date, dayIndex) => {
            const isToday = isSameDay(date, today);
            const dayBookings = getBookingsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isPast = date < today && !isToday;
            const isTooFar = date > maxDate;
            const isDisabled = isPast || isTooFar || isWeekDisabled;
            
            return (
              <Card 
                key={dayIndex} 
                className={cn(
                  "border-0 shadow-md cursor-pointer transition-all",
                  isSelected && "ring-2 ring-primary",
                  isToday && "ring-1 ring-primary/50",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isDisabled && "hover:shadow-lg"
                )}
                onClick={() => !isDisabled && setSelectedDate(date)}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday && "text-primary"
                  )}>
                    {format(date, 'd')}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayBookings.slice(0, 2).map((booking, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "text-xs rounded px-1.5 py-0.5 truncate",
                            booking.user_id === user?.id 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {format(parseISO(booking.start_datetime), 'HH:mm')}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Booking form */}
        {selectedDate && (
          <Card className="border-0 shadow-lg animate-scale-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tv className="h-5 w-5 text-primary" />
                Book for {format(selectedDate, 'EEEE, MMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Time</label>
                  <Select 
                    value={selectedHour.toString()} 
                    onValueChange={(v) => setSelectedHour(parseInt(v))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration</label>
                  <Select 
                    value={duration.toString()} 
                    onValueChange={(v) => setDuration(parseInt(v))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(6, hoursRemaining) }, (_, i) => i + 1).map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} hour{hours > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Clock className="h-4 w-4" />
                <span>
                  {selectedHour.toString().padStart(2, '0')}:00 – {(selectedHour + duration).toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Show existing bookings for this day */}
              {getBookingsForDate(selectedDate).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Existing bookings:</label>
                  <div className="space-y-1">
                    {getBookingsForDate(selectedDate).map((booking) => (
                      <div 
                        key={booking.id}
                        className="text-sm bg-muted rounded-lg p-2 flex justify-between"
                      >
                        <span>
                          {format(parseISO(booking.start_datetime), 'HH:mm')} – {format(parseISO(booking.end_datetime), 'HH:mm')}
                        </span>
                        <span className="text-muted-foreground">
                          {booking.user?.name} (Room {booking.user?.room_number})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setSelectedDate(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 btn-press"
                  onClick={handleBook}
                  disabled={hoursRemaining < duration}
                >
                  Book Projector
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
    </Layout>
  );
}
