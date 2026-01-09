import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useKitchenBookings } from '@/hooks/useKitchenBookings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { KITCHEN_SLOTS, KitchenSlotType } from '@/lib/types';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function KitchenBooking() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Get Monday of the current week, then add offset
  const today = new Date();
  const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = addDays(baseWeekStart, weekOffset * 7);
  
  const { bookings, loading, canBookSlot, bookSlot } = useKitchenBookings(weekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSlotStatus = (date: Date, slotType: KitchenSlotType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const booking = bookings.find(
      b => b.booking_date === dateStr && b.slot_type === slotType
    );
    
    if (booking) {
      return {
        booked: true,
        isOwn: booking.user_id === user?.id,
        user: booking.user,
      };
    }
    
    const { canBook, reason } = canBookSlot(date, slotType);
    return { booked: false, canBook, reason };
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold">Kitchen</h1>
            <p className="text-muted-foreground text-sm">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
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

        {/* Week grid */}
        <div className="space-y-3 animate-fade-up stagger-1">
          {weekDays.map((date, dayIndex) => {
            const isToday = isSameDay(date, today);
            
            return (
              <Card 
                key={dayIndex} 
                className={cn(
                  "border-0 shadow-md overflow-hidden",
                  isToday && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-0">
                  {/* Day header */}
                  <div className={cn(
                    "px-4 py-3 border-b border-border",
                    isToday ? "bg-primary/5" : "bg-muted/30"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{format(date, 'EEEE')}</span>
                      <span className="text-muted-foreground text-sm">
                        {format(date, 'MMM d')}
                      </span>
                      {isToday && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {KITCHEN_SLOTS.map((slot) => {
                      const status = getSlotStatus(date, slot.type);
                      
                      return (
                        <div
                          key={slot.type}
                          className={cn(
                            "p-4 transition-colors",
                            !status.booked && status.canBook && "hover:bg-muted/50 cursor-pointer"
                          )}
                          onClick={() => {
                            if (!status.booked && status.canBook) {
                              bookSlot(date, slot.type);
                            }
                          }}
                        >
                          <div className="text-sm font-medium mb-2">{slot.label}</div>
                          
                          {status.booked ? (
                            <div className={cn(
                              "text-sm rounded-lg p-2",
                              status.isOwn ? "bg-primary/10 text-primary" : "bg-muted"
                            )}>
                              <div className="flex items-center gap-1.5">
                                {status.isOwn ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span>
                                  {status.isOwn ? 'Your booking' : `${status.user?.name}`}
                                </span>
                              </div>
                              {!status.isOwn && status.user && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Room {status.user.room_number}
                                </div>
                              )}
                            </div>
                          ) : status.canBook ? (
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Available
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              {status.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
    </Layout>
  );
}
