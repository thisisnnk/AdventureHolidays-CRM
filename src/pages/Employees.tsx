import React, { useEffect, useState } from 'react';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Phone, Mail, User, Loader2, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { User as UserType } from '@/types';

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<UserType | null>(null);
    
    // New employee form
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        email: '',
        password: '',
        whatsapp_personal: '',
        whatsapp_official: ''
    });

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await authApi.getEmployees();
            setEmployees(response.data);
        } catch (error) {
            toast.error('Failed to load employees');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authApi.createEmployee(newEmployee);
            toast.success('Employee created successfully');
            setIsDialogOpen(false);
            setNewEmployee({
                name: '',
                email: '',
                password: '',
                whatsapp_personal: '',
                whatsapp_official: ''
            });
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create employee');
        }
    };

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        
        try {
            await authApi.updateEmployee(selectedEmployee.id, {
                name: selectedEmployee.name,
                email: selectedEmployee.email,
                whatsapp_personal: selectedEmployee.whatsapp_personal,
                whatsapp_official: selectedEmployee.whatsapp_official,
                is_active: selectedEmployee.is_active
            });
            toast.success('Employee updated successfully');
            setIsEditDialogOpen(false);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update employee');
        }
    };

    const handleDeleteEmployee = async (id: number) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        
        try {
            await authApi.deleteEmployee(id);
            toast.success('Employee deleted successfully');
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete employee');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <p className="text-muted-foreground">Manage employee accounts and permissions</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create New Employee</DialogTitle>
                            <DialogDescription>
                                Add a new employee to the system.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Password *</Label>
                                <Input
                                    type="password"
                                    value={newEmployee.password}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Personal WhatsApp</Label>
                                <Input
                                    placeholder="+91XXXXXXXXXX"
                                    value={newEmployee.whatsapp_personal}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, whatsapp_personal: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Official WhatsApp</Label>
                                <Input
                                    placeholder="+91XXXXXXXXXX"
                                    value={newEmployee.whatsapp_official}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, whatsapp_official: e.target.value })}
                                />
                            </div>
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Employee</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Employees Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No employees found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{employee.name}</p>
                                                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    {employee.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {employee.whatsapp_personal && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-green-500" />
                                                        {employee.whatsapp_personal}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={employee.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    {employee.is_active !== false ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {employee.created_at && format(new Date(employee.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedEmployee(employee);
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteEmployee(employee.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                    </DialogHeader>
                    
                    {selectedEmployee && (
                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={selectedEmployee.name}
                                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={selectedEmployee.email}
                                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Personal WhatsApp</Label>
                                <Input
                                    value={selectedEmployee.whatsapp_personal || ''}
                                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, whatsapp_personal: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Official WhatsApp</Label>
                                <Input
                                    value={selectedEmployee.whatsapp_official || ''}
                                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, whatsapp_official: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={selectedEmployee.is_active !== false ? 'active' : 'inactive'}
                                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, is_active: e.target.value === 'active' })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Employees;
