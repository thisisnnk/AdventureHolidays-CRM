import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contactsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, ChevronRight, Phone, Mail, MapPin, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Contact } from '@/types';

const Contacts: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    
    // New contact form
    const [newContact, setNewContact] = useState<Partial<Contact>>({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        city: '',
        state: '',
        country: ''
    });

    const fetchContacts = async () => {
        try {
            setIsLoading(true);
            const response = await contactsApi.getAll({
                search,
                page: pagination.page,
                limit: pagination.limit
            });
            setContacts(response.data.contacts);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load contacts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [pagination.page, search]);

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await contactsApi.create(newContact);
            toast.success('Contact created successfully');
            setIsDialogOpen(false);
            setNewContact({
                name: '',
                phone: '',
                whatsapp: '',
                email: '',
                city: '',
                state: '',
                country: ''
            });
            fetchContacts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create contact');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground">Manage customer contacts and trip history</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Contact
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Contact</DialogTitle>
                            <DialogDescription>
                                Add a new contact to the database.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateContact} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name *</label>
                                    <Input
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone *</label>
                                    <Input
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">WhatsApp</label>
                                    <Input
                                        value={newContact.whatsapp}
                                        onChange={(e) => setNewContact({ ...newContact, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">City</label>
                                    <Input
                                        value={newContact.city}
                                        onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">State</label>
                                    <Input
                                        value={newContact.state}
                                        onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Country</label>
                                    <Input
                                        value={newContact.country}
                                        onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Contact</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, or contact ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contacts Table */}
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
                                        <TableHead>Contact Name</TableHead>
                                        <TableHead>Contact ID</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Total Trips</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No contacts found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        contacts.map((contact) => (
                                            <TableRow key={contact.id} className="cursor-pointer hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium">{contact.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {contact.contact_id}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                                        {contact.phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {contact.email ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                            {contact.email}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {(contact.city || contact.country) ? (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3 h-3 text-muted-foreground" />
                                                            {[contact.city, contact.country].filter(Boolean).join(', ')}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={contact.total_trips > 0 ? 'default' : 'secondary'}>
                                                        {contact.total_trips} trips
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/contacts/${contact.id}`}>
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

export default Contacts;
