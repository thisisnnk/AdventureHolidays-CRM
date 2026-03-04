import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { leadsApi, revisionsApi, tasksApi, authApi, uploadsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { 
    ArrowLeft, 
    Phone, 
    Mail, 
    MapPin, 
    User as UserIcon, 
    Calendar, 
    Plus, 
    Upload, 
    Play, 
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileAudio,
    History
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Lead, Revision, Task, ActivityLog, User } from '@/types';

const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    
    const [lead, setLead] = useState<Lead | null>(null);
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Revision form state
    const [newRevision, setNewRevision] = useState({
        call_recording_url: '',
        notes: '',
        itinerary_link: '',
        date_sent: '',
        send_status: 'Pending'
    });
    const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Task form state
    const [newTask, setNewTask] = useState({
        description: '',
        follow_up_date: '',
        notes: ''
    });
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    const fetchLeadData = async () => {
        try {
            setIsLoading(true);
            const response = await leadsApi.getById(Number(id));
            setLead(response.data.lead);
            setRevisions(response.data.revisions);
            setTasks(response.data.tasks);
            setActivityLogs(response.data.activity_logs);
        } catch (error) {
            toast.error('Failed to load lead details');
            navigate('/leads');
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
        fetchLeadData();
        fetchEmployees();
    }, [id]);

    const handleUpdateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead) return;
        
        try {
            await leadsApi.update(lead.id, lead);
            toast.success('Lead updated successfully');
            setIsEditing(false);
            fetchLeadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update lead');
        }
    };

    const handleCreateRevision = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await revisionsApi.create({
                lead_id: Number(id),
                ...newRevision
            });
            toast.success('Revision created successfully');
            setIsRevisionDialogOpen(false);
            setNewRevision({
                call_recording_url: '',
                notes: '',
                itinerary_link: '',
                date_sent: '',
                send_status: 'Pending'
            });
            fetchLeadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create revision');
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await tasksApi.create({
                lead_id: Number(id),
                ...newTask
            });
            toast.success('Task created successfully');
            setIsTaskDialogOpen(false);
            setNewTask({
                description: '',
                follow_up_date: '',
                notes: ''
            });
            fetchLeadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create task');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'recording' | 'document') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            setIsUploading(true);
            const response = type === 'recording' 
                ? await uploadsApi.uploadRecording(file)
                : await uploadsApi.uploadDocument(file);
            
            setNewRevision({ ...newRevision, call_recording_url: response.data.file.url });
            toast.success('File uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'Open': 'bg-purple-100 text-purple-800',
            'On Progress': 'bg-blue-100 text-blue-800',
            'Converted': 'bg-green-100 text-green-800',
            'Lost': 'bg-red-100 text-red-800'
        };
        return <Badge className={variants[status] || ''}>{status}</Badge>;
    };

    const isRevisionFormValid = () => {
        return newRevision.call_recording_url && newRevision.notes && newRevision.itinerary_link;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/leads">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{lead.name}</h1>
                        {getStatusBadge(lead.status)}
                    </div>
                    <p className="text-muted-foreground">{lead.itinerary_code}</p>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit Lead'}
                </Button>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="revisions">Revisions ({revisions.length})</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                    {isEditing ? (
                        <form onSubmit={handleUpdateLead} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input 
                                            value={lead.name} 
                                            onChange={(e) => setLead({ ...lead, name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input 
                                            value={lead.phone} 
                                            onChange={(e) => setLead({ ...lead, phone: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input 
                                            value={lead.email || ''} 
                                            onChange={(e) => setLead({ ...lead, email: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input 
                                            value={lead.city || ''} 
                                            onChange={(e) => setLead({ ...lead, city: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input 
                                            value={lead.state || ''} 
                                            onChange={(e) => setLead({ ...lead, state: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input 
                                            value={lead.country || ''} 
                                            onChange={(e) => setLead({ ...lead, country: e.target.value })} 
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Lead Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Lead Source</Label>
                                        <Select 
                                            value={lead.lead_source} 
                                            onValueChange={(value) => setLead({ ...lead, lead_source: value })}
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
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select 
                                            value={lead.status} 
                                            onValueChange={(value: any) => setLead({ ...lead, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="On Progress">On Progress</SelectItem>
                                                <SelectItem value="Converted">Converted</SelectItem>
                                                <SelectItem value="Lost">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Destination</Label>
                                        <Input 
                                            value={lead.destination || ''} 
                                            onChange={(e) => setLead({ ...lead, destination: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Travelers</Label>
                                        <Input 
                                            type="number"
                                            value={lead.travelers || ''} 
                                            onChange={(e) => setLead({ ...lead, travelers: parseInt(e.target.value) })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Input 
                                            value={lead.duration || ''} 
                                            onChange={(e) => setLead({ ...lead, duration: e.target.value })} 
                                        />
                                    </div>
                                    {isAdmin() && (
                                        <div className="space-y-2">
                                            <Label>Assigned To</Label>
                                            <Select 
                                                value={lead.assigned_employee_id?.toString()} 
                                                onValueChange={(value) => setLead({ ...lead, assigned_employee_id: parseInt(value) })}
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
                        <>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <UserIcon className="w-5 h-5" />
                                            Personal Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{lead.phone}</span>
                                        </div>
                                        {lead.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span>{lead.email}</span>
                                            </div>
                                        )}
                                        {(lead.city || lead.state || lead.country) && (
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                                <span>{[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Lead Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Lead Source</span>
                                            <span>{lead.lead_source}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Enquiry Date</span>
                                            <span>{lead.enquiry_date && format(new Date(lead.enquiry_date), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Destination</span>
                                            <span>{lead.destination || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Travelers</span>
                                            <span>{lead.travelers || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Duration</span>
                                            <span>{lead.duration || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Assigned To</span>
                                            <span>{lead.assigned_employee_name || 'Unassigned'}</span>
                                        </div>
                                        {lead.contact_code && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Contact ID</span>
                                                <Link to={`/contacts/${lead.contact_id}`}>
                                                    <Badge variant="outline">{lead.contact_code}</Badge>
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* Revisions Tab */}
                <TabsContent value="revisions" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Revision History</h3>
                        <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Revision
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Add New Revision</DialogTitle>
                                    <DialogDescription>
                                        All fields are mandatory to create a revision.
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <form onSubmit={handleCreateRevision} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Call Recording *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Recording URL"
                                                value={newRevision.call_recording_url}
                                                onChange={(e) => setNewRevision({ ...newRevision, call_recording_url: e.target.value })}
                                            />
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept="audio/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileUpload(e, 'recording')}
                                                />
                                                <Button type="button" variant="outline" disabled={isUploading}>
                                                    <Upload className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Itinerary/Quotation Link *</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={newRevision.itinerary_link}
                                            onChange={(e) => setNewRevision({ ...newRevision, itinerary_link: e.target.value })}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Notes *</Label>
                                        <Textarea
                                            placeholder="Enter notes..."
                                            value={newRevision.notes}
                                            onChange={(e) => setNewRevision({ ...newRevision, notes: e.target.value })}
                                            rows={4}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Date Sent</Label>
                                        <Input
                                            type="date"
                                            value={newRevision.date_sent}
                                            onChange={(e) => setNewRevision({ ...newRevision, date_sent: e.target.value })}
                                        />
                                    </div>
                                    
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsRevisionDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={!isRevisionFormValid()}
                                        >
                                            Create Revision
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-4">
                        {revisions.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    <FileAudio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No revisions yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            revisions.map((revision) => (
                                <Card key={revision.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Badge variant="secondary">Rev {revision.revision_number}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {revision.created_at && format(new Date(revision.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                    <Badge className={revision.send_status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                                        {revision.send_status}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Call Recording</p>
                                                        <a 
                                                            href={revision.call_recording_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                            Listen
                                                        </a>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Itinerary Link</p>
                                                        <a 
                                                            href={revision.itinerary_link} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            View
                                                        </a>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                                        <p className="text-sm">{revision.notes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Tasks & Follow-ups</h3>
                        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Task</DialogTitle>
                                </DialogHeader>
                                
                                <form onSubmit={handleCreateTask} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Task Description *</Label>
                                        <Input
                                            placeholder="Enter task description"
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Follow-up Date *</Label>
                                        <Input
                                            type="date"
                                            value={newTask.follow_up_date}
                                            onChange={(e) => setNewTask({ ...newTask, follow_up_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            placeholder="Additional notes..."
                                            value={newTask.notes}
                                            onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">Create Task</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-3">
                        {tasks.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No tasks yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            tasks.map((task) => {
                                const isOverdue = new Date(task.follow_up_date) < new Date() && task.status === 'Pending';
                                return (
                                    <Card key={task.id} className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-medium">{task.description}</p>
                                                        <Badge className={
                                                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            isOverdue ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }>
                                                            {isOverdue ? 'Overdue' : task.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Due: {format(new Date(task.follow_up_date), 'MMM d, yyyy')}
                                                        </span>
                                                        {task.assigned_employee_name && (
                                                            <span>Assigned to: {task.assigned_employee_name}</span>
                                                        )}
                                                    </div>
                                                    {task.notes && (
                                                        <p className="mt-2 text-sm">{task.notes}</p>
                                                    )}
                                                </div>
                                                {task.status === 'Pending' && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={async () => {
                                                            await tasksApi.updateStatus(task.id, 'Completed');
                                                            fetchLeadData();
                                                            toast.success('Task marked as completed');
                                                        }}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activityLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No activity recorded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activityLogs.map((log) => (
                                        <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">{log.action}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                                {log.user_name && (
                                                    <p className="text-sm text-muted-foreground">by {log.user_name}</p>
                                                )}
                                                {log.details && (
                                                    <p className="text-sm mt-1">{log.details}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LeadDetail;
