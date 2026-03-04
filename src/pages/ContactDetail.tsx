import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contactsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    ArrowLeft, 
    Phone, 
    Mail, 
    MapPin, 
    User, 
    Briefcase,
    Play,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Contact } from '@/types';

interface Trip {
    id: number;
    name: string;
    destination: string;
    travelers: number;
    duration: string;
    enquiry_date: string;
    status: string;
    assigned_employee_name: string;
    revisions: Array<{
        id: number;
        revision_number: number;
        call_recording_url: string;
        notes: string;
        itinerary_link: string;
        date_sent: string;
        send_status: string;
    }>;
}

const ContactDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [contact, setContact] = useState<Contact | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchContactData = async () => {
        try {
            setIsLoading(true);
            const response = await contactsApi.getById(Number(id));
            setContact(response.data.contact);
            setTrips(response.data.trips);
        } catch (error) {
            toast.error('Failed to load contact details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContactData();
    }, [id]);

    const handleUpdateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact) return;
        
        try {
            await contactsApi.update(contact.id, contact);
            toast.success('Contact updated successfully');
            setIsEditing(false);
            fetchContactData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update contact');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!contact) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/contacts">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{contact.name}</h1>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {contact.contact_id}
                        </code>
                    </div>
                    <p className="text-muted-foreground">{contact.total_trips} trips completed</p>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit Contact'}
                </Button>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="trips">Trip History ({trips.length})</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details">
                    {isEditing ? (
                        <form onSubmit={handleUpdateContact} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input 
                                            value={contact.name} 
                                            onChange={(e) => setContact({ ...contact, name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone</label>
                                        <Input 
                                            value={contact.phone} 
                                            onChange={(e) => setContact({ ...contact, phone: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">WhatsApp</label>
                                        <Input 
                                            value={contact.whatsapp || ''} 
                                            onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input 
                                            type="email"
                                            value={contact.email || ''} 
                                            onChange={(e) => setContact({ ...contact, email: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">City</label>
                                        <Input 
                                            value={contact.city || ''} 
                                            onChange={(e) => setContact({ ...contact, city: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">State</label>
                                        <Input 
                                            value={contact.state || ''} 
                                            onChange={(e) => setContact({ ...contact, state: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Country</label>
                                        <Input 
                                            value={contact.country || ''} 
                                            onChange={(e) => setContact({ ...contact, country: e.target.value })} 
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-4">
                                <Button type="submit">Save Changes</Button>
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span>{contact.phone}</span>
                                    </div>
                                    {contact.whatsapp && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-green-500" />
                                            <span>{contact.whatsapp} (WhatsApp)</span>
                                        </div>
                                    )}
                                    {contact.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span>{contact.email}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(contact.city || contact.state || contact.country) ? (
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span>{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</span>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No location information</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Trip History Tab */}
                <TabsContent value="trips" className="space-y-6">
                    {trips.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No trips yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        trips.map((trip) => (
                            <Card key={trip.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Briefcase className="w-5 h-5" />
                                                {trip.destination}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {trip.travelers} travelers • {trip.duration}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-green-100 text-green-800">{trip.status}</Badge>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Handled by: {trip.assigned_employee_name}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="text-sm font-medium mb-3">Revisions</h4>
                                    {trip.revisions && trip.revisions.length > 0 ? (
                                        <div className="space-y-3">
                                            {trip.revisions.map((revision) => (
                                                <div key={revision.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge variant="secondary">Rev {revision.revision_number}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {revision.date_sent && format(new Date(revision.date_sent), 'MMM d, yyyy')}
                                                        </span>
                                                        <Badge className={revision.send_status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                                            {revision.send_status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <a 
                                                            href={revision.call_recording_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                        >
                                                            <Play className="w-3 h-3" />
                                                            Recording
                                                        </a>
                                                        <a 
                                                            href={revision.itinerary_link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Itinerary
                                                        </a>
                                                    </div>
                                                    {revision.notes && (
                                                        <p className="mt-2 text-sm text-gray-600">{revision.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No revisions for this trip</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ContactDetail;
