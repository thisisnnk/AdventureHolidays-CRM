import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { leadsApi, authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Search, Filter, ChevronRight, Loader2, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Lead, User } from '@/types';

const Leads: React.FC = () => {
    const { isAdmin } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    
    // Filters
    const [filters, setFilters] = useState({
        status: '',
        assigned_employee_id: '',
        search: '',
        date_from: '',
        date_to: ''
    });
    
    // New lead form
    const [newLead, setNewLead] = useState<Partial<Lead>>({
        name: '',
        phone: '',
        email: '',
        destination: '',
        travelers: 1,
        duration: '',
        lead_source: 'Website',
        assigned_employee_id: undefined
    });

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const params: any = {
                page: pagination.page,
                limit: pagination.limit
            };
            
            if (filters.status) params.status = filters.status;
            if (filters.assigned_employee_id) params.assigned_employee_id = filters.assigned_employee_id;
            if (filters.search) params.search = filters.search;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            
            const response = await leadsApi.getAll(params);
            setLeads(response.data.leads);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load leads');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        if (!isAdmin()) return;
        try {
            const response = await authApi.getEmployees();
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to load employees');
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchEmployees();
    }, [pagination.page, filters.status, filters.assigned_employee_id]);

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await leadsApi.create(newLead);
            toast.success('Lead created successfully');
            setIsDialogOpen(false);
            setNewLead({
                name: '',
                phone: '',
                email: '',
                destination: '',
                travelers: 1,
                duration: '',
                lead_source: 'Website',
                assigned_employee_id: undefined
            });
            fetchLeads();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create lead');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'Open': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
            'On Progress': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
            'Converted': 'bg-green-100 text-green-800 hover:bg-green-100',
            'Lost': 'bg-red-100 text-red-800 hover:bg-red-100'
        };
        return <Badge className={variants[status] || ''}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Leads</h1>
                    <p className="text-muted-foreground">Manage and track all leads</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Lead</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new lead.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateLead} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newLead.email}
                                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination</Label>
                                <Input
                                    id="destination"
                                    value={newLead.destination}
                                    onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="travelers">Travelers</Label>
                                    <Input
                                        id="travelers"
                                        type="number"
                                        min={1}
                                        value={newLead.travelers}
                                        onChange={(e) => setNewLead({ ...newLead, travelers: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration</Label>
                                    <Input
                                        id="duration"
                                        placeholder="e.g., 5 days"
                                        value={newLead.duration}
                                        onChange={(e) => setNewLead({ ...newLead, duration: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="lead_source">Lead Source</Label>
                                <Select
                                    value={newLead.lead_source}
                                    onValueChange={(value) => setNewLead({ ...newLead, lead_source: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="Website">Website</SelectItem>
                                        <SelectItem value="Referral">Referral</SelectItem>
                                        <SelectItem value="Office Direct Lead">Office Direct Lead</SelectItem>
                                        <SelectItem value="Telegram Bot">Telegram Bot</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {isAdmin() && (
                                <div className="space-y-2">
                                    <Label htmlFor="assigned_employee">Assign To</Label>
                                    <Select
                                        value={newLead.assigned_employee_id?.toString()}
                                        onValueChange={(value) => setNewLead({ ...newLead, assigned_employee_id: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Lead</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <SelectTrigger className="w-[150px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="On Progress">On Progress</SelectItem>
                                <SelectItem value="Converted">Converted</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {isAdmin() && (
                            <Select
                                value={filters.assigned_employee_id}
                                onValueChange={(value) => setFilters({ ...filters, assigned_employee_id: value })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Assigned To" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Employees</SelectItem>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {emp.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        
                        <Button variant="outline" onClick={fetchLeads}>
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead Name</TableHead>
                                        <TableHead>Itinerary Code</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Travelers</TableHead>
                                        <TableHead>Enquiry Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        {isAdmin() && <TableHead>Assigned To</TableHead>}
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isAdmin() ? 8 : 7} className="text-center py-8 text-muted-foreground">
                                                No leads found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        leads.map((lead) => (
                                            <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50">
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{lead.name}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Phone className="w-3 h-3" />
                                                            {lead.phone}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {lead.itinerary_code}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                                        {lead.destination || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{lead.travelers || '-'}</TableCell>
                                                <TableCell>
                                                    {lead.enquiry_date && format(new Date(lead.enquiry_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                                {isAdmin() && (
                                                    <TableCell>{lead.assigned_employee_name || 'Unassigned'}</TableCell>
                                                )}
                                                <TableCell>
                                                    <Link to={`/leads/${lead.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            
                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === pagination.totalPages}
                                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Leads;
