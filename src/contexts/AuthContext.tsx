import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isBlocked: boolean;
  loading: boolean;
  login: (name: string, roomNumber: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('booking_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      checkUserStatus(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserStatus = async (userId: string) => {
    try {
      // For testing/development: allow admin access if localStorage has test_admin flag
      const testAdminMode = localStorage.getItem('test_admin') === 'true';
      if (testAdminMode) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check if admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      setIsAdmin(roles && roles.length > 0);

      // Check if blocked
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId);
      
      setIsBlocked(blocked && blocked.length > 0);
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (name: string, roomNumber: string, phone?: string) => {
    try {
      // Try to find existing user
      const { data: existingUsers, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .eq('room_number', roomNumber);

      if (findError) throw findError;

      let userData: User;

      if (existingUsers && existingUsers.length > 0) {
        // Update phone if provided
        userData = existingUsers[0] as User;
        if (phone && phone !== userData.phone) {
          await supabase
            .from('users')
            .update({ phone })
            .eq('id', userData.id);
          userData.phone = phone;
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            name,
            room_number: roomNumber,
            phone: phone || null,
            agreed_to_rules: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        userData = newUser as User;
      }

      // Check if blocked
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userData.id);

      if (blocked && blocked.length > 0) {
        return { success: false, error: 'Your account has been blocked. Please contact an RA.' };
      }

      // Store user and update state
      localStorage.setItem('booking_user', JSON.stringify(userData));
      setUser(userData);
      await checkUserStatus(userData.id);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('booking_user');
    setUser(null);
    setIsAdmin(false);
    setIsBlocked(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isBlocked, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
