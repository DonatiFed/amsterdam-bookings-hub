import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Tv, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [projectorHoursUsed, setProjectorHoursUsed] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProjectorHours();
    }
  }, [user]);

  const fetchProjectorHours = async () => {
    if (!user) return;
    
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });

    const { data } = await supabase
      .from('projector_bookings')
      .select('duration_hours')
      .eq('user_id', user.id)
      .gte('start_datetime', format(monday, "yyyy-MM-dd'T'00:00:00"))
      .lte('start_datetime', format(sunday, "yyyy-MM-dd'T'23:59:59"));

    const total = (data || []).reduce((sum, b) => sum + b.duration_hours, 0);
    setProjectorHoursUsed(total);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold mb-1">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            What would you like to book today?
          </p>
        </div>

        {/* Booking cards */}
        <div className="grid gap-4 animate-fade-up stagger-1">
          <Link to="/kitchen">
            <Card className="card-hover group cursor-pointer border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Kitchen</h2>
                        <p className="text-sm text-muted-foreground">3 time slots daily</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Book your cooking time. 24-hour advance booking required.
                    </p>
                  </div>
                  <div className="pr-6">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/projector">
            <Card className="card-hover group cursor-pointer border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Tv className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Projector</h2>
                        <p className="text-sm text-muted-foreground">Flexible hours</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Reserve 1-6 hours. Max 6 hours per week.
                    </p>
                  </div>
                  <div className="pr-6">
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-secondary to-primary" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 animate-fade-up stagger-2">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{6 - projectorHoursUsed}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Projector hours left this week
              </p>
            </CardContent>
          </Card>
          <Link to="/my-bookings">
            <Card className="border-0 shadow-md card-hover">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">→</p>
                <p className="text-xs text-muted-foreground mt-1">
                  View my bookings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
