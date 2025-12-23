import React from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminOverview from './AdminOverview';
import EmployeeOverview from './EmployeeOverview';
const DashboardOverview: React.FC = () => {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (profile?.role === 'admin') {
        return <AdminOverview />;
    }

    // Default to EmployeeOverview for all other internal roles
    // We can add specific PM/Client views later if needed
    return <EmployeeOverview />;
};

export default DashboardOverview;
