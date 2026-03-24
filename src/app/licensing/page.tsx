"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import LicenseManager from '@/modules/licensing/LicenseManager';

export default function LicensingPage() {
  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">
        <LicenseManager />
      </div>
    </DashboardLayout>
  );
}
