import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    Contact,
    UserCog,
    LogOut,
    Menu,
    X,
    Mountain
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/leads', label: 'Leads', icon: Users, show: true },
        { path: '/contacts', label: 'Contacts', icon: Contact, show: isAdmin() },
        { path: '/employees', label: 'Employees', icon: UserCog, show: isAdmin() },
    ];

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 px-4 py-6 border-b">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Mountain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">Adventure Holidays</h1>
                    <p className="text-xs text-muted-foreground">Lead Management</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                    item.show && (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    )
                ))}
            </nav>

            <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Mountain className="w-6 h-6 text-primary" />
                    <span className="font-bold">Adventure Holidays</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar */}
            <div
                className={`lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-white border-r z-40 transform transition-transform duration-200 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {sidebarContent}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
                {sidebarContent}
            </div>

            {/* Mobile Spacer */}
            <div className="lg:hidden h-16" />
        </>
    );
};

export default Sidebar;
