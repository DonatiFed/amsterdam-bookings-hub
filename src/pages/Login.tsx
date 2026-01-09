import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !roomNumber.trim()) {
      toast.error('Please fill in your name and room number');
      return;
    }

    if (!agreedToRules) {
      toast.error('Please agree to the house rules');
      return;
    }

    setLoading(true);
    const result = await login(name.trim(), roomNumber.trim(), phone.trim() || undefined);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold">Schedly</h1>
          <p className="text-muted-foreground mt-2">Amsterdam Booking System</p>
        </div>

        <Card className="border-0 shadow-xl animate-fade-up stagger-1">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Enter your details to access the booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  placeholder="e.g., 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+31 6 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="rules"
                  checked={agreedToRules}
                  onCheckedChange={(checked) => setAgreedToRules(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="rules" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the house rules for bookings and will respect other residents' reservations
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium btn-press"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-up stagger-2">
          By continuing, you acknowledge that your bookings are visible to other residents
        </p>
      </div>
    </div>
  );
}
