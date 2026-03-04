import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { leadsApi, tasksApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays } from 'date-fns';
import { 
    Users, 
    UserX, 
    Clock, 
    AlertCircle,
    Calendar as CalendarIcon,
    ChevronRight,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { LeadStats, EmployeeStats, ComplianceAlerts, Task } from '@/types';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [stats, setStats] = useState<LeadStats | null>(null);
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
    const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlerts | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const params = {
                date_from: format(dateRange.from, 'yyyy-MM-dd'),
                date_to: format(dateRange.to, 'yyyy-MM-dd')
            };

            // Fetch stats
            const statsRes = await leadsApi.getStats(params);
            setStats(statsRes.data);

            // Fetch employee stats (admin only)
            if (isAdmin()) {
                const empStatsRes = await leadsApi.getEmployeeStats(params);
                setEmployeeStats(empStatsRes.data);

                const alertsRes = await leadsApi.getComplianceAlerts();
                setComplianceAlerts(alertsRes.data);
            }

            // Fetch tasks for current user
            const tasksRes = await tasksApi.getAll({ status: 'Pending' });
            setTasks(tasksRes.data.tasks.slice(0, 5));
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const statCards = [
        { 
            title: 'Total Leads', 
            value: stats?.total_leads || '0', 
            icon: Users, 
            color: 'bg-blue-500',
            textColor: 'text-blue-600'
        },
        { 
            title: 'Converted', 
            value: stats?.converted || '0', 
            icon: CheckCircle2, 
            color: 'bg-green-500',
            textColor: 'text-green-600'
        },
        { 
            title: 'Lost', 
            value: stats?.lost || '0', 
            icon: UserX, 
            color: 'bg-red-500',
            textColor: 'text-red-600'
        },
        { 
            title: 'On Progress', 
            value: stats?.on_progress || '0', 
            icon: Clock, 
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600'
        },
        { 
            title: 'Open', 
            value: stats?.open || '0', 
            icon: AlertCircle, 
            color: 'bg-purple-500',
            textColor: 'text-purple-600'
        },
    ];

    const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#ef4444'];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.name}</p>
                </div>
                
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="range"
                            selected={{ from: dateRange.from, to: dateRange.to }}
                            onSelect={(range) => {
                                if (range?.from && range?.to) {
                                    setDateRange({ from: range.from, to: range.to });
                                }
                            }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{card.title}</p>
                                    <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                                </div>
                                <div className={`${card.color} p-2 rounded-lg`}>
                                    <card.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Employee Performance (Admin Only) */}
                {isAdmin() && (
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Employee Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {employeeStats.map((emp) => {
                                        const chartData = [
                                            { name: 'Open', value: parseInt(emp.open) },
                                            { name: 'On Progress', value: parseInt(emp.on_progress) },
                                            { name: 'Converted', value: parseInt(emp.converted) },
                                            { name: 'Lost', value: parseInt(emp.lost) },
                                        ];

                                        return (
                                            <Card key={emp.id} className="border">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold">{emp.employee_name}</h4>
                                                        <Badge variant="secondary">{emp.total_leads} leads</Badge>
                                                    </div>
                                                    <div className="h-40">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={chartData}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={30}
                                                                    outerRadius={50}
                                                                    dataKey="value"
                                                                >
                                                                    {chartData.map((_entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip />
                                                                <Legend fontSize={10} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance Alerts */}
                        {complianceAlerts && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-600">
                                        <AlertTriangle className="w-5 h-5" />
                                        Compliance Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {complianceAlerts.no_call_recording.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-red-600 mb-2">
                                                    No Call Recording ({complianceAlerts.no_call_recording.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {complianceAlerts.no_call_recording.slice(0, 3).map((alert) => (
                                                        <div key={alert.lead_id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-medium">{alert.lead_name}</p>
                                                                <p className="text-xs text-muted-foreground">{alert.employee_name}</p>
                                                            </div>
                                                            <Badge variant="destructive">
                                                                {Math.floor(alert.days_since_assignment || 0)} days
                                                            </Badge>
                                                            <Link to={`/leads/${alert.lead_id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {complianceAlerts.overdue_followups.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-orange-600 mb-2">
                                                    Overdue Follow-ups ({complianceAlerts.overdue_followups.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {complianceAlerts.overdue_followups.slice(0, 3).map((alert) => (
                                                        <div key={alert.lead_id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-medium">{alert.lead_name}</p>
                                                                <p className="text-xs text-muted-foreground">{alert.employee_name}</p>
                                                            </div>
                                                            <Badge variant="destructive">
                                                                {alert.days_overdue} days overdue
                                                            </Badge>
                                                            <Link to={`/leads/${alert.lead_id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {complianceAlerts.inactive_leads.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-yellow-600 mb-2">
                                                    Inactive Leads ({complianceAlerts.inactive_leads.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {complianceAlerts.inactive_leads.slice(0, 3).map((alert) => (
                                                        <div key={alert.lead_id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-medium">{alert.lead_name}</p>
                                                                <p className="text-xs text-muted-foreground">{alert.employee_name}</p>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                {Math.floor((alert.hours_inactive || 0) / 24)} days inactive
                                                            </Badge>
                                                            <Link to={`/leads/${alert.lead_id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Task Panel */}
                <div className={isAdmin() ? '' : 'lg:col-span-3'}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    My Tasks
                                </span>
                                <Link to="/leads">
                                    <Button variant="ghost" size="sm">View All</Button>
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                    <p>No pending tasks</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((task) => {
                                        const isOverdue = new Date(task.follow_up_date) < new Date();
                                        return (
                                            <div 
                                                key={task.id} 
                                                className={`p-3 rounded-lg border ${
                                                    isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{task.lead_name}</p>
                                                        <p className="text-sm text-gray-600">{task.description}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                                                            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                                {isOverdue ? 'Overdue: ' : 'Due: '}
                                                                {format(new Date(task.follow_up_date), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Link to={`/leads/${task.lead_id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;