"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { AdminOverview } from './AdminOverview';
import { EmployeeOverview } from './EmployeeOverview';

export function DashboardOverview() {
  const { user, profile } = useAuth();
  const [profileWaitExpired, setProfileWaitExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileWaitExpired(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (user && !profile && !profileWaitExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        <p className="text-sm text-gray-500">Loading workspace...</p>
      </div>
    );
  }

  if (profile?.role === 'admin') {
    return <AdminOverview />;
  }

  return <EmployeeOverview />;
}
