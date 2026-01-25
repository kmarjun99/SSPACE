
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppState, UserRole, Ad, TargetAudience, User, SupportTicket, TicketStatus, SupportCategory, SubscriptionPlan, PromotionPlan, PromotionRequest, PromotionRequestStatus, PromotionPlanStatus, PromotionPlacement, PromotionApplicableTo } from '../types';
import { Card, Button, Input, Badge, Modal } from '../components/UI';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {


    Users, DollarSign, Activity, FileText, Plus, Trash2, ExternalLink, MapPin, Building2, BookOpen, Layers,
    Shield, AlertTriangle, CheckCircle, Flag, Save, Globe, Lock, User as UserIcon, Sparkles, RotateCcw, Clock
} from 'lucide-react';
import { supportService } from '../services/supportService';
import { adService } from '../services/adService';
import { cityService } from '../services/cityService';
import { supplyService } from '../services/supplyService';
import { bookingService } from '../services/bookingService';
import { boostService, BoostPlan, BoostRequest } from '../services/boostService';
import { subscriptionService } from '../services/subscriptionService';
import { paymentService, RefundAdmin } from '../services/paymentService';
import { SuperAdminReadingRoomReview } from './SuperAdminReadingRoomReview';
import { SuperAdminAccommodationReview } from './SuperAdminAccommodationReview';
import { SuperAdminAdsView } from './SuperAdminAdsView';
import { venueService } from '../services/venueService';
import { CityStats, CityDetail } from '../types';
import { LocationManagement } from '../components/LocationManagement';

interface SuperAdminDashboardProps {
    state: AppState;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ state }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // --- ADS LOGIC ---
    const [ads, setAds] = useState<Ad[]>([]);
    const [isCreatingAd, setIsCreatingAd] = useState(false);
    const [newAd, setNewAd] = useState<Partial<Ad>>({
        categoryId: '',  // Changed from category to categoryId for dynamic categories
        targetAudience: 'STUDENT',
        ctaText: 'Learn More'
    });

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        try {
            // Use new adService.getAllAds with include_inactive=true for admin view
            const fetchedAds = await adService.getAllAds(true);
            setAds(fetchedAds);
        } catch (e) {
            console.error("Failed to load ads", e);
        }
    };

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adService.createAd(newAd);
            setIsCreatingAd(false);
            setNewAd({});
            loadAds();
            alert("Ad Campaign Created Successfully!");
        } catch (e) {
            alert("Failed to create ad");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await adService.deleteAd(id);
            loadAds();
        } catch (e) {
            alert("Failed to delete ad");
        }
    };

    const handleEditAd = (ad: Ad) => {
        // Populate form with ad data for editing
        setNewAd({
            title: ad.title,
            description: ad.description,
            imageUrl: ad.imageUrl,
            ctaText: ad.ctaText,
            link: ad.link,
            categoryId: ad.categoryId,
            targetAudience: ad.targetAudience,
        });
        setIsCreatingAd(true);
        // Store the editing ad ID for update instead of create
        // For now, we handle this by using the state - user can modify and save as new
        // Full edit would require storing editingAdId state
        alert(`Editing ad: ${ad.title}. Modify the form and save as new, or delete the old one first.`);
    };

    const handleToggleAd = async (id: string) => {
        try {
            await adService.toggleAd(id);
            loadAds();
        } catch (e) {
            alert("Failed to toggle ad status");
        }
    };


    // --- SUPPORT MANAGER VIEW ---
    const SupportManagerView = () => {
        const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
        const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
        const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
        const [adminNotes, setAdminNotes] = useState('');

        const tickets = state.tickets || [];

        const filteredTickets = tickets.filter(t => {
            if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
            // Map 'Student' -> STUDENT, 'Owner' -> ADMIN for filtering if needed, but tickets store actual role
            if (filterRole !== 'ALL' && t.userRole !== filterRole) return false;
            return true;
        }).sort((a, b) => {
            // Sort Open first, then by date
            const isOpenA = a.status === 'OPEN';
            const isOpenB = b.status === 'OPEN';
            if (isOpenA && !isOpenB) return -1;
            if (!isOpenA && isOpenB) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
            try {
                // In real app use supportService.updateTicketStatus(ticketId, newStatus, adminNotes)
                // Since state is local in App.tsx for now, we simulate success
                await supportService.updateTicketStatus(ticketId, newStatus, adminNotes);
                alert(`Ticket status updated to ${newStatus}`);
                // In a real connected app, state would update via re-fetch or context. 
                // Here we might need to force refresh or rely on parent re-render if state was lifted.
                // Assuming AppState tickets updates automatically if service mocks it well, 
                // but usually we need to update local state if it's a copy.
                // For this strict phase, we assume the service call is the "Action".
                if (selectedTicket) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                }
            } catch (error) {
                console.error("Failed to update ticket", error);
            }
        };

        return (
            <div className="space-y-6">
                {selectedTicket ? (
                    <div>
                        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">
                            ← Back to Tickets
                        </Button>
                        <Card className="p-6">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket #{selectedTicket.id}</h2>
                                    <div className="flex gap-2">
                                        <Badge variant={selectedTicket.userRole === 'ADMIN' ? 'warning' : 'info'}>
                                            {selectedTicket.userRole === 'ADMIN' ? 'OWNER' : 'USER'}
                                        </Badge>
                                        <Badge variant={
                                            selectedTicket.status === 'OPEN' ? 'error' :
                                                selectedTicket.status === 'IN_PROGRESS' ? 'warning' : 'success'
                                        }>{selectedTicket.status}</Badge>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <div>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                                    <div>Category: {selectedTicket.category}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Subject</h3>
                                        <p className="text-lg">{selectedTicket.subject}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px] text-gray-700 whitespace-pre-wrap">
                                            {selectedTicket.description}
                                        </div>
                                    </div>
                                    {selectedTicket.metaData && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Metadata</h3>
                                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                                                {JSON.stringify(selectedTicket.metaData, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">User Details</h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 block">Name</span>
                                                <span className="font-medium">{selectedTicket.userName}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Email</span>
                                                <span className="font-medium">{selectedTicket.userEmail}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Role</span>
                                                <span className="font-medium">{selectedTicket.userRole}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                        <h3 className="font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Admin Actions</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-indigo-800 uppercase mb-1 block">Update Status</label>
                                                <select
                                                    className="w-full rounded border-indigo-200 text-sm p-2"
                                                    value={selectedTicket.status}
                                                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                                                >
                                                    <option value="OPEN">Open</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="RESOLVED">Resolved</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-indigo-800 uppercase mb-1 block">Internal Notes</label>
                                                <textarea
                                                    className="w-full rounded border-indigo-200 text-sm p-2 h-20"
                                                    placeholder="Add private notes..."
                                                    value={adminNotes}
                                                    onChange={e => setAdminNotes(e.target.value)}
                                                />
                                                <Button size="sm" className="w-full mt-2" onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status)}>
                                                    Save Note
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    className="rounded-lg border-gray-300 text-sm py-2 pl-3 pr-8"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                >
                                    <option value="ALL">Status: All</option>
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                                <select
                                    className="rounded-lg border-gray-300 text-sm py-2 pl-3 pr-8"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value as any)}
                                >
                                    <option value="ALL">Role: Any</option>
                                    <option value="STUDENT">Users</option>
                                    <option value="ADMIN">Owners</option>
                                </select>
                            </div>
                        </div>

                        <Card className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700">
                                        <tr>
                                            <th className="px-6 py-4">Ticket ID</th>
                                            <th className="px-6 py-4">Created</th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTickets.length > 0 ? (
                                            filteredTickets.map(ticket => (
                                                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs">{ticket.id}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{ticket.userName}</div>
                                                        <Badge variant={ticket.userRole === 'ADMIN' ? 'warning' : 'info'} size="sm">
                                                            {ticket.userRole === 'ADMIN' ? 'OWNER' : 'USER'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            {ticket.category.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                                            ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {ticket.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-900" onClick={() => setSelectedTicket(ticket)}>
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No tickets match your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
    };

    // --- FEATURED MANAGER VIEW (Control Missing) ---
    const FeaturedManagerView = () => {
        const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ACTIVE' | 'HISTORY'>('REQUESTS');

        // Combine Venues and PGs
        const allListings = [
            ...state.readingRooms.map(r => ({ ...r, entityType: 'VENUE' })),
            ...state.accommodations.map(a => ({ ...a, entityType: 'PG' }))
        ];

        // Logic: Request = Plan set but not active (false/undefined isFeatured)
        // Logic: Active = Plan set + isFeatured true + not expired
        // Logic: Expired/History = isFeatured true + expired

        const featuredRequests = allListings.filter(l => l.featuredPlan && !l.isFeatured);
        const activeFeatured = allListings.filter(l => l.isFeatured && (!l.featuredExpiry || new Date(l.featuredExpiry) > new Date()));
        const expiredFeatured = allListings.filter(l => l.isFeatured && l.featuredExpiry && new Date(l.featuredExpiry) <= new Date());

        const displayItems = activeTab === 'REQUESTS' ? featuredRequests
            : activeTab === 'ACTIVE' ? activeFeatured
                : expiredFeatured;

        const handleAction = (id: string, type: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
            if (confirm(`Confirm ${action} for this listing?`)) {
                // In a real app, this would call API endpoints like /api/admin/featured/{id}/{action}
                // For now, we simulate the success feedback.
                alert(`${action} successful! The listing status has been updated.`);
                // Since we don't have dispatch here, we rely on page refresh or parent update in real app.
            }
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
                        <p className="text-gray-500">Approve and manage promoted venues.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={activeTab === 'REQUESTS' ? 'primary' : 'outline'} onClick={() => setActiveTab('REQUESTS')}>
                            Requests <Badge variant={activeTab === 'REQUESTS' ? 'light' : 'warning'} className="ml-2">{featuredRequests.length}</Badge>
                        </Button>
                        <Button variant={activeTab === 'ACTIVE' ? 'primary' : 'outline'} onClick={() => setActiveTab('ACTIVE')}>
                            Active <Badge variant={activeTab === 'ACTIVE' ? 'light' : 'success'} className="ml-2">{activeFeatured.length}</Badge>
                        </Button>
                        <Button variant={activeTab === 'HISTORY' ? 'primary' : 'outline'} onClick={() => setActiveTab('HISTORY')}>
                            History
                        </Button>
                    </div>
                </div>

                <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-4">Listing</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Plan Duration</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayItems.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No listings found in this category.</td></tr>
                            ) : displayItems.map(item => {
                                const owner = state.users.find(u => u.id === item.ownerId);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            <Badge variant="outline" size="sm" className="mt-1">{item.entityType}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 font-medium">{owner?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-indigo-600 block">{item.featuredPlan}</span>
                                            {item.featuredExpiry && <span className="text-xs text-gray-400">Exp: {item.featuredExpiry}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Assuming payment is pre-verified or handled via gateway callback before appearing here */}
                                            <Badge variant="success">PAID</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {activeTab === 'REQUESTS' && (
                                                <>
                                                    <Button size="sm" variant="primary" onClick={() => handleAction(item.id, item.entityType, 'APPROVE')}>Approve</Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleAction(item.id, item.entityType, 'REJECT')}>Reject</Button>
                                                </>
                                            )}
                                            {activeTab === 'ACTIVE' && (
                                                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(item.id, item.entityType, 'SUSPEND')}>Disable</Button>
                                            )}
                                            {activeTab === 'HISTORY' && (
                                                <span className="text-xs text-gray-400 italic">Expired</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>
        );
    };


    // --- SUBSCRIPTION PLANS MANAGER VIEW ---
    const SubscriptionPlansView = () => {
        const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [isEditorOpen, setIsEditorOpen] = useState(false);
        const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan>>({
            name: '', price: 0, billingCycle: 'MONTHLY', allowedListingTypes: ['READING_ROOM'], features: [], isActive: true, isDefault: false, ctaLabel: 'Subscribe'
        });

        // Load plans from API on mount
        useEffect(() => {
            const loadPlans = async () => {
                setIsLoading(true);
                try {
                    const apiPlans = await subscriptionService.getPlans(true); // Include inactive for Super Admin
                    setPlans(apiPlans.map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description || '',
                        price: p.price,
                        durationDays: p.durationDays,
                        features: p.features,
                        isActive: p.isActive,
                        isDefault: p.isDefault,
                        billingCycle: 'MONTHLY',
                        allowedListingTypes: ['READING_ROOM', 'ACCOMMODATION'],
                        createdAt: p.createdAt,
                        ctaLabel: 'Subscribe'
                    })));
                } catch (error) {
                    console.error('Failed to load subscription plans:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadPlans();
        }, []);

        // Delete a subscription plan
        const handleDeletePlan = async (planId: string) => {
            if (!confirm('Are you sure you want to delete this subscription plan?')) return;
            try {
                await subscriptionService.deletePlan(planId);
                setPlans(plans.filter(p => p.id !== planId));
                alert('Plan deleted successfully!');
            } catch (error) {
                console.error('Failed to delete plan:', error);
                alert('Failed to delete plan.');
            }
        };

        const [isSaving, setIsSaving] = useState(false);

        const handleSavePlan = async () => {
            // Validation
            if (!editingPlan.name || !editingPlan.price || editingPlan.price <= 0) {
                alert('Please enter valid name and price.');
                return;
            }

            setIsSaving(true);
            try {
                if (editingPlan.id) {
                    // Update existing plan
                    const updated = await subscriptionService.updatePlan(editingPlan.id, {
                        name: editingPlan.name,
                        description: editingPlan.description,
                        price: editingPlan.price,
                        duration_days: editingPlan.durationDays || 30,
                        features: editingPlan.features || [],
                        is_active: editingPlan.isActive ?? true,
                        is_default: editingPlan.isDefault ?? false
                    });
                    if (updated) {
                        setPlans(plans.map(p => p.id === updated.id ? {
                            ...p,
                            name: updated.name,
                            description: updated.description || '',
                            price: updated.price,
                            durationDays: updated.durationDays,
                            features: updated.features,
                            isActive: updated.isActive,
                            isDefault: updated.isDefault
                        } : p));
                        alert('Plan updated successfully!');
                    }
                } else {
                    // Create new plan
                    const created = await subscriptionService.createPlan({
                        name: editingPlan.name || '',
                        description: editingPlan.description,
                        price: editingPlan.price || 0,
                        duration_days: editingPlan.durationDays || 30,
                        features: editingPlan.features || [],
                        is_active: editingPlan.isActive ?? true,
                        is_default: editingPlan.isDefault ?? false
                    });
                    if (created) {
                        setPlans([...plans, {
                            id: created.id,
                            name: created.name,
                            description: created.description || '',
                            price: created.price,
                            durationDays: created.durationDays,
                            features: created.features,
                            isActive: created.isActive,
                            isDefault: created.isDefault,
                            billingCycle: 'MONTHLY',
                            allowedListingTypes: ['READING_ROOM', 'ACCOMMODATION'],
                            createdAt: created.createdAt,
                            ctaLabel: 'Subscribe'
                        }]);
                        alert('Plan created successfully!');
                    }
                }

                setIsEditorOpen(false);
                setEditingPlan({ name: '', price: 0, billingCycle: 'MONTHLY', allowedListingTypes: ['READING_ROOM'], features: [], isActive: true, isDefault: false, ctaLabel: 'Subscribe' });
            } catch (error) {
                console.error('Failed to save plan:', error);
                alert('Failed to save plan. Please try again.');
            } finally {
                setIsSaving(false);
            }
        };

        const toggleFeature = (feat: string) => {
            const current = editingPlan.features || [];
            if (current.includes(feat)) {
                setEditingPlan({ ...editingPlan, features: current.filter(f => f !== feat) });
            } else {
                setEditingPlan({ ...editingPlan, features: [...current, feat] });
            }
        };

        const toggleListingType = (type: 'READING_ROOM' | 'ACCOMMODATION') => {
            const current = editingPlan.allowedListingTypes || [];
            if (current.includes(type)) {
                setEditingPlan({ ...editingPlan, allowedListingTypes: current.filter(t => t !== type) as any });
            } else {
                setEditingPlan({ ...editingPlan, allowedListingTypes: [...current, type] });
            }
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subscription Plans</h2>
                        <p className="text-sm sm:text-base text-gray-500">Manage billing plans for Venue Owners.</p>
                    </div>
                    <Button onClick={() => { setEditingPlan({ name: '', price: 0, billingCycle: 'MONTHLY', allowedListingTypes: ['READING_ROOM'], features: [], isActive: true, isDefault: false, ctaLabel: 'Subscribe' }); setIsEditorOpen(true); }} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> Create New Plan
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.id} className={`flex flex-col h-full border-t-4 ${plan.isActive ? 'border-t-indigo-500' : 'border-t-gray-300'}`}>
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                                    {plan.isDefault && <Badge variant="warning">Default</Badge>}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                                    <span className="ml-1 text-gray-500">/{plan.billingCycle.toLowerCase()} <span className="text-xs">+ GST</span></span>
                                </div>
                                <div className="mt-6 space-y-2">
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-center text-sm text-gray-600">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> {feat}
                                        </div>
                                    ))}
                                    {plan.allowedListingTypes.length > 0 && (
                                        <div className="pt-2 mt-2 border-t border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                                            Includes: {plan.allowedListingTypes.join(' & ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                                <Button size="sm" variant="outline" onClick={() => { setEditingPlan(plan); setIsEditorOpen(true); }}>Edit Plan</Button>
                                {/* Deactivate/Delete Logic could go here */}
                            </div>
                        </Card>
                    ))}
                </div>

                {isEditorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{editingPlan.id ? 'Edit Plan' : 'Create New Plan'}</h3>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditorOpen(false)}>Close</Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input label="Plan Name" value={editingPlan.name || ''} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} required />
                                    <Input label="Price (₹)" type="number" value={editingPlan.price || 0} onChange={e => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) })} required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                                        <select className="w-full border p-2 rounded-lg" value={editingPlan.billingCycle} onChange={e => setEditingPlan({ ...editingPlan, billingCycle: e.target.value as any })}>
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="QUARTERLY">Quarterly</option>
                                            <option value="YEARLY">Yearly</option>
                                        </select>
                                    </div>
                                    <Input label="CTA Label" value={editingPlan.ctaLabel || ''} onChange={e => setEditingPlan({ ...editingPlan, ctaLabel: e.target.value })} placeholder="e.g. Subscribe Now" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea className="w-full border p-2 rounded-lg" rows={2} value={editingPlan.description || ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                                </div>

                                <div className="border-t border-b py-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Listing Types</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={editingPlan.allowedListingTypes?.includes('READING_ROOM')} onChange={() => toggleListingType('READING_ROOM')} />
                                                <span>Reading Room</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={editingPlan.allowedListingTypes?.includes('ACCOMMODATION')} onChange={() => toggleListingType('ACCOMMODATION')} />
                                                <span>PG / Hostel</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Unlimited Listings', 'Basic Analytics', 'Advanced Analytics', 'Priority Support', 'Featured for 7 Days', 'API Access', 'Custom Branding'].map(feat => (
                                                <button
                                                    key={feat}
                                                    onClick={() => toggleFeature(feat)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${editingPlan.features?.includes(feat) ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {feat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingPlan.isActive} onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} />
                                        <span className="text-sm font-medium">Active Plan</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingPlan.isDefault} onChange={e => setEditingPlan({ ...editingPlan, isDefault: e.target.checked })} />
                                        <span className="text-sm font-medium">Set as Default</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSavePlan} isLoading={isSaving}>Save Plan</Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
    };

    // --- UNIFIED PROMOTION MANAGER VIEW ---
    const PromotionManagerView = () => {
        const [activeTab, setActiveTab] = useState<'PLANS' | 'PENDING' | 'ACTIVE' | 'HISTORY'>('PLANS');
        const [plans, setPlans] = useState<BoostPlan[]>([]);
        const [requests, setRequests] = useState<BoostRequest[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [isEditorOpen, setIsEditorOpen] = useState(false);
        const [editingPlan, setEditingPlan] = useState<Partial<BoostPlan>>({
            name: '', description: '', durationDays: 7, price: 499,
            status: 'draft', applicableTo: 'both', placement: 'featured_section'
        });

        // Load data from API on mount
        useEffect(() => {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const [plansData, requestsData] = await Promise.all([
                        boostService.getPlans(true), // Include inactive for super admin
                        boostService.getAllRequests()
                    ]);
                    setPlans(plansData);
                    setRequests(requestsData);
                } catch (error) {
                    console.error('Failed to load boost data:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }, []);

        const pendingRequests = requests.filter(r => ['payment_pending', 'initiated', 'paid', 'admin_review'].includes(r.status.toLowerCase()));
        const activeRequests = requests.filter(r => r.status === 'approved' && (!r.expiryDate || new Date(r.expiryDate) > new Date()));
        const historyRequests = requests.filter(r => r.status === 'rejected' || r.status === 'expired' || (r.status === 'approved' && r.expiryDate && new Date(r.expiryDate) <= new Date()));

        const handleSavePlan = async () => {
            if (!editingPlan.name || !editingPlan.price || editingPlan.price <= 0 || !editingPlan.durationDays) {
                alert('Please enter valid name, price, and duration.');
                return;
            }

            try {
                if (editingPlan.id) {
                    // Update existing plan
                    const updated = await boostService.updatePlan(editingPlan.id, editingPlan);
                    setPlans(plans.map(p => p.id === updated.id ? updated : p));
                } else {
                    // Create new plan
                    const created = await boostService.createPlan(editingPlan);
                    setPlans([...plans, created]);
                }
                setIsEditorOpen(false);
                setEditingPlan({ name: '', description: '', durationDays: 7, price: 499, status: 'draft', applicableTo: 'both', placement: 'featured_section' });
                alert('Promotion Plan saved to database!');
            } catch (error) {
                console.error('Failed to save plan:', error);
                alert('Failed to save plan. Please try again.');
            }
        };

        const handleTogglePlanStatus = async (planId: string, newStatus: 'draft' | 'active' | 'inactive') => {
            try {
                const updated = await boostService.updatePlan(planId, { status: newStatus });
                setPlans(plans.map(p => p.id === planId ? updated : p));
            } catch (error) {
                console.error('Failed to update plan status:', error);
                alert('Failed to update status.');
            }
        };

        const handleDeletePlan = async (planId: string) => {
            if (!confirm('Delete this promotion plan?')) return;
            try {
                await boostService.deletePlan(planId);
                setPlans(plans.filter(p => p.id !== planId));
            } catch (error) {
                console.error('Failed to delete plan:', error);
                alert('Failed to delete plan.');
            }
        };

        const handleApprove = async (requestId: string) => {
            try {
                await boostService.approveRequest(requestId);
                // Reload requests
                const updatedRequests = await boostService.getAllRequests();
                setRequests(updatedRequests);
                alert('Request approved! Listing is now promoted.');
            } catch (error) {
                console.error('Failed to approve:', error);
                alert('Failed to approve request.');
            }
        };

        const handleReject = async (requestId: string) => {
            const reason = prompt('Enter rejection reason:');
            if (!reason) return;
            try {
                await boostService.rejectRequest(requestId, reason);
                // Reload requests
                const updatedRequests = await boostService.getAllRequests();
                setRequests(updatedRequests);
                alert('Request rejected.');
            } catch (error) {
                console.error('Failed to reject:', error);
                alert('Failed to reject request.');
            }
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
                    <p className="text-gray-500">Manage promotion plans and approve owner requests.</p>
                </div>

                <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
                    {(['PLANS', 'PENDING', 'ACTIVE', 'HISTORY'] as const).map(tab => (
                        <Button key={tab} variant={activeTab === tab ? 'primary' : 'outline'} onClick={() => setActiveTab(tab)}>
                            {tab === 'PLANS' && 'Plans'}
                            {tab === 'PENDING' && <>Pending <Badge variant="warning" className="ml-1">{pendingRequests.length}</Badge></>}
                            {tab === 'ACTIVE' && <>Active <Badge variant="success" className="ml-1">{activeRequests.length}</Badge></>}
                            {tab === 'HISTORY' && 'History'}
                        </Button>
                    ))}
                </div>

                {activeTab === 'PLANS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500">Create promotion plans that venue owners can purchase.</p>
                            <Button onClick={() => { setEditingPlan({ name: '', description: '', durationDays: 7, price: 499, status: 'DRAFT', applicableTo: 'BOTH', placement: 'FEATURED_SECTION' }); setIsEditorOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" /> Create Plan
                            </Button>
                        </div>
                        {plans.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-700 mb-2">No Promotion Plans</h3>
                                <p className="text-gray-500 mb-4">Owners cannot promote listings until you create a plan.</p>
                                <Button onClick={() => setIsEditorOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create First Plan</Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <Card key={plan.id} className={`border-t-4 ${plan.status === 'ACTIVE' ? 'border-t-green-500' : plan.status === 'DRAFT' ? 'border-t-yellow-500' : 'border-t-gray-300'}`}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant={plan.status === 'active' ? 'success' : plan.status === 'draft' ? 'warning' : 'neutral'}>{plan.status}</Badge>
                                                <div className="flex gap-1">
                                                    {plan.status !== 'active' && <button onClick={() => handleTogglePlanStatus(plan.id, 'active')} className="p-1 text-gray-400 hover:text-green-600" title="Activate"><CheckCircle className="w-4 h-4" /></button>}
                                                    {plan.status === 'active' && <button onClick={() => handleTogglePlanStatus(plan.id, 'inactive')} className="p-1 text-gray-400 hover:text-orange-600" title="Deactivate"><Lock className="w-4 h-4" /></button>}
                                                    <button onClick={() => handleDeletePlan(plan.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Badge variant="outline" size="sm">{plan.placement.replace('_', ' ')}</Badge>
                                                <Badge variant="outline" size="sm">{plan.applicableTo}</Badge>
                                            </div>
                                            <div className="mt-4 flex items-baseline">
                                                <span className="text-3xl font-extrabold text-indigo-600">₹{plan.price}</span>
                                                <span className="ml-1 text-gray-500">/ {plan.durationDays} days <span className="text-xs">+ GST</span></span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 border-t">
                                            <Button size="sm" variant="outline" onClick={() => { setEditingPlan(plan); setIsEditorOpen(true); }}>Edit</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'PENDING' || activeTab === 'ACTIVE' || activeTab === 'HISTORY') && (
                    <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Listing</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(activeTab === 'PENDING' ? pendingRequests : activeTab === 'ACTIVE' ? activeRequests : historyRequests).length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No requests found.</td></tr>
                                ) : (activeTab === 'PENDING' ? pendingRequests : activeTab === 'ACTIVE' ? activeRequests : historyRequests).map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{item.venueName || 'Unknown Venue'}</div>
                                            <Badge variant="outline" size="sm">{item.venueType}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.ownerName}</div>
                                            <div className="text-xs text-gray-500">{item.ownerEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-indigo-600">{item.planName || 'Boost Plan'}</span>
                                            <div className="text-xs text-gray-400">₹{item.price} / {item.durationDays} days</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="success">PAID</Badge>
                                            <div className="text-xs text-gray-400">{item.paymentId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'}>{item.status}</Badge>
                                            {item.expiryDate && <div className="text-xs text-gray-400 mt-1">Expires: {new Date(item.expiryDate).toLocaleDateString()}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {activeTab === 'PENDING' && (
                                                <>
                                                    <Button size="sm" variant="primary" onClick={() => handleApprove(item.id)}>Approve</Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleReject(item.id)}>Reject</Button>
                                                </>
                                            )}
                                            {activeTab !== 'PENDING' && item.adminNotes && <span className="text-xs text-gray-400 italic">{item.adminNotes}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingPlan.id ? 'Edit Promotion Plan' : 'Create Promotion Plan'}>
                    <div className="space-y-4">
                        <Input label="Plan Name" value={editingPlan.name || ''} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="e.g. 7 Day Feature" required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Price (₹)" type="number" value={editingPlan.price || 0} onChange={e => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) })} required />
                            <Input label="Duration (Days)" type="number" value={editingPlan.durationDays || 7} onChange={e => setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value) })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea className="w-full border p-2 rounded-lg" rows={2} value={editingPlan.description || ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} placeholder="Benefits of this plan" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
                                <select className="w-full border p-2 rounded-lg" value={editingPlan.applicableTo || 'BOTH'} onChange={e => setEditingPlan({ ...editingPlan, applicableTo: e.target.value as PromotionApplicableTo })}>
                                    <option value="BOTH">Both</option>
                                    <option value="READING_ROOM">Reading Rooms</option>
                                    <option value="ACCOMMODATION">Accommodations</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                                <select className="w-full border p-2 rounded-lg" value={editingPlan.placement || 'FEATURED_SECTION'} onChange={e => setEditingPlan({ ...editingPlan, placement: e.target.value as PromotionPlacement })}>
                                    <option value="FEATURED_SECTION">Featured Section</option>
                                    <option value="TOP_LIST">Top of List</option>
                                    <option value="BANNER">Banner</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select className="w-full border p-2 rounded-lg" value={editingPlan.status || 'DRAFT'} onChange={e => setEditingPlan({ ...editingPlan, status: e.target.value as PromotionPlanStatus })}>
                                <option value="DRAFT">Draft</option>
                                <option value="ACTIVE">Active (Visible to Owners)</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSavePlan}>Save Plan</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    };




















    // --- DASHBOARD (OVERVIEW) ---
    const DashboardHome = () => {
        const globalRevenue = state.bookings.reduce((sum, b) => sum + b.amount, 0);
        const [activities, setActivities] = useState([
            { id: 1, type: 'BOOKING', message: 'New booking at Central Library', time: 'Just now', status: 'success' },
            { id: 2, type: 'CHECKIN', message: 'Student verified at Study Nook', time: '2 mins ago', status: 'info' },
            { id: 3, type: 'ERROR', message: 'Payment failed for User #992', time: '5 mins ago', status: 'error' },
            { id: 4, type: 'REVIEW', message: 'New 5-star review for Sunrise PG', time: '12 mins ago', status: 'success' },
        ]);

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mission Control</h1>
                        <p className="text-gray-500">Real-time platform health.</p>
                    </div>
                    <div className="text-sm text-gray-500">Last updated: Just now</div>
                </div>

                {/* Live Status Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Global Pulse */}
                    <Card className="col-span-2 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-indigo-500" /> Platform Pulse
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider">Live Users</p>
                                <p className="text-3xl font-extrabold text-indigo-900 mt-1">{state.users.length}</p>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Bookings / Hr</p>
                                <p className="text-3xl font-extrabold text-green-900 mt-1">
                                    {/* Functional: Count Bookings in last 60 mins */}
                                    {state.bookings.filter(b => {
                                        if (!b.createdAt) return false;
                                        const created = new Date(b.createdAt);
                                        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
                                        return created > hourAgo;
                                    }).length}
                                </p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">Pending KYC</p>
                                <p className="text-3xl font-extrabold text-orange-900 mt-1">
                                    {/* Functional: Count ADMINs with PENDING status */}
                                    {state.users.filter(u => u.role === UserRole.ADMIN && u.verificationStatus === 'PENDING').length}
                                </p>
                            </div>

                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Critical Issues</p>
                                <p className="text-3xl font-extrabold text-red-900 mt-1">
                                    {state.notifications.filter(n => n.type === 'error').length}
                                </p>
                            </div>
                        </div>
                        <div className="h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <MapPin className="w-12 h-12 mb-2 opacity-20" />
                            <p className="font-medium">Live City Heatmap Placeholder</p>
                            <p className="text-xs opacity-60">Visualizing demand hotspots in real-time</p>
                        </div>
                    </Card>

                    {/* 2. Live Activity Feed */}
                    <Card className="p-0 overflow-hidden flex flex-col h-full bg-white border border-gray-200 shadow-sm">
                        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live Feed
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {activities.map((act, i) => (
                                <div key={act.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 text-sm animate-in slide-in-from-right-2`} style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${act.status === 'success' ? 'bg-green-500' :
                                        act.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                    <div>
                                        <p className="text-gray-900 font-medium leading-snug">{act.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Financial Reconciliation (Mini) */}
                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            Financial Overview
                        </h3>
                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-50" onClick={() => navigate('/super-admin/finance')}>View Full Report &rarr;</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        <div className="px-4">
                            <p className="text-sm text-gray-500 mb-1">Total Processed Vol.</p>
                            <p className="text-2xl font-bold tracking-tight text-gray-900">₹{globalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-green-600 flex items-center mt-1">↑ 12% vs last month</p>
                        </div>
                        <div className="px-4 pt-4 md:pt-0">
                            <p className="text-sm text-gray-500 mb-1">Platform Revenue (Est)</p>
                            <p className="text-2xl font-bold tracking-tight text-indigo-600">₹{(globalRevenue * 0.1).toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">Based on 10% commission</p>
                        </div>
                        <div className="px-4 pt-4 md:pt-0">
                            <p className="text-sm text-gray-500 mb-1">Pending Payouts</p>
                            <p className="text-2xl font-bold tracking-tight text-orange-600">₹45,200</p>
                            <p className="text-xs text-orange-600/80 mt-1">Due in 3 days</p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    const AdsView = () => {
        const [dragActive, setDragActive] = useState(false);
        const [urlWarning, setUrlWarning] = useState('');

        const handleDrag = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.type === "dragenter" || e.type === "dragover") {
                setDragActive(true);
            } else if (e.type === "dragleave") {
                setDragActive(false);
            }
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                // Simulate upload
                const objectUrl = URL.createObjectURL(file);
                // In a real app, this would be the response from upload service
                setNewAd(prev => ({ ...prev, imageUrl: objectUrl })); // Showing local preview as value for demo
            }
        };

        const handleUrlChange = (val: string) => {
            setNewAd({ ...newAd, imageUrl: val });
            if (val && !val.startsWith('http')) {
                setUrlWarning('URL should start with http:// or https://');
            } else {
                setUrlWarning('');
            }
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ad Campaigns</h2>
                        <p className="text-gray-500">Manage promotional content across the platform.</p>
                    </div>
                    <Button onClick={() => setIsCreatingAd(true)}><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>
                </div>

                {isCreatingAd && (
                    <Card className="p-6 bg-indigo-50/50 border border-indigo-100 shadow-md">
                        <h3 className="font-bold text-lg text-indigo-900 mb-6">Create New Campaign</h3>
                        <form onSubmit={handleCreateAd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <Input label="Campaign Title" value={newAd.title || ''} onChange={e => setNewAd({ ...newAd, title: e.target.value })} required placeholder="e.g. Summer Discount 2024" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                    rows={3}
                                    value={newAd.description || ''}
                                    onChange={e => setNewAd({ ...newAd, description: e.target.value })}
                                    required
                                    placeholder="Ad copy text..."
                                />
                            </div>

                            {/* --- Level 2: Simplified Input (Drag & Drop) --- */}
                            <div className="col-span-2 space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Ad Banner Image</label>

                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors
                                        ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        Drag & drop your image here, or <span className="text-indigo-600 cursor-pointer hover:underline">browse</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setNewAd(prev => ({ ...prev, imageUrl: URL.createObjectURL(e.target.files![0]) }));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Fallback Manual Input */}
                                <div className="relative">
                                    <Input
                                        label=""
                                        value={newAd.imageUrl || ''}
                                        onChange={e => handleUrlChange(e.target.value)}
                                        placeholder="Or paste direct Image URL..."
                                        className="text-xs"
                                    />
                                    {/* Level 3: Validation Warning */}
                                    {urlWarning && (
                                        <div className="absolute right-3 top-3 text-red-500 text-xs flex items-center bg-white px-1">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> {urlWarning}
                                        </div>
                                    )}
                                </div>

                                {/* --- Level 1: Visual Feedback (Preview) --- */}
                                {newAd.imageUrl && (
                                    <div className="mt-4 relative group w-full h-48 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                        <img
                                            src={newAd.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL')}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-medium">
                                            Live Preview
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Destination</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            label=""
                                            value={newAd.link || ''}
                                            onChange={e => setNewAd({ ...newAd, link: e.target.value })}
                                            required
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {/* --- Level 1: Visual Feedback (Test Link) --- */}
                                    {newAd.link && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-0"
                                            onClick={() => window.open(newAd.link, '_blank')}
                                            title="Test Link"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Input label="CTA Button Text" value={newAd.ctaText || ''} onChange={e => setNewAd({ ...newAd, ctaText: e.target.value })} placeholder="e.g. Book Now" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border" value={newAd.categoryId || ''} onChange={e => setNewAd({ ...newAd, categoryId: e.target.value })}>
                                    <option value="">Select Category</option>
                                    <option value="EDUCATION">Education</option>
                                    <option value="FOOD">Food</option>
                                    <option value="TRANSPORT">Transport</option>
                                    <option value="LIFESTYLE">Lifestyle</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border" value={newAd.targetAudience} onChange={e => setNewAd({ ...newAd, targetAudience: e.target.value as any })}>
                                    <option value="STUDENT">Students Only</option>
                                    <option value="ADMIN">Partners (Owners) Only</option>
                                    <option value="ALL">All Users</option>
                                </select>
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-indigo-100">
                                <Button type="button" variant="ghost" onClick={() => setIsCreatingAd(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Launch Campaign</Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {ads.map(ad => (
                        <Card key={ad.id} className="p-0 overflow-hidden flex flex-col h-full group hover:shadow-lg transition-shadow">
                            <div className="h-40 overflow-hidden relative bg-gray-100">
                                <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.title} />
                                <div className="absolute top-2 right-2">
                                    <Badge variant="info" className="bg-white/90 backdrop-blur-sm shadow-sm">{ad.category}</Badge>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1">{ad.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{ad.description}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                        <Users className="w-3 h-3" /> {ad.targetAudience}
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2" onClick={() => handleDeleteAd(ad.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const UsersView = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Directory</h2>
                    <p className="text-gray-500">Manage all students and partners.</p>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Search users..." className="min-w-[300px]" />
                </div>
            </div>

            <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                        <tr>
                            <th className="px-6 py-4">User Details</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {state.users.map(user => (
                            <tr key={user.id} className="bg-white hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-4">
                                            <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={user.avatarUrl} alt="" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={user.role === UserRole.ADMIN ? 'warning' : user.role === UserRole.SUPER_ADMIN ? 'error' : 'success'}>
                                        {user.role}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    Oct 24, 2023
                                </td>
                                <td className="px-6 py-4">
                                    <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-900">Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );

    const CitiesView = () => {
        const [cities, setCities] = useState<CityStats[]>([]);
        const [selectedCity, setSelectedCity] = useState<CityDetail | null>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            loadCities();
        }, []);

        const loadCities = async () => {
            try {
                const data = await cityService.getAllCities();
                setCities(data);
            } catch (err) {
                console.error("Failed to load cities", err);
            } finally {
                setLoading(false);
            }
        };

        const handleViewCity = async (cityName: string) => {
            setLoading(true);
            try {
                const detail = await cityService.getCityDetails(cityName);
                setSelectedCity(detail);
            } catch (err) {
                console.error("Failed to load city details", err);
            } finally {
                setLoading(false);
            }
        };

        const handleToggleStatus = async (cityName: string, currentStatus: boolean, e: React.MouseEvent) => {
            e.stopPropagation();
            if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} ${cityName}?`)) return;
            try {
                await cityService.updateCityStatus(cityName, !currentStatus);
                loadCities(); // Refresh list
                if (selectedCity && selectedCity.name === cityName) {
                    setSelectedCity(prev => prev ? { ...prev, is_active: !currentStatus } : null);
                }
            } catch (err) {
                alert("Failed to update status");
            }
        };

        if (selectedCity) {
            return (
                <div className="space-y-6 animate-in fade-in">
                    <Button variant="ghost" onClick={() => setSelectedCity(null)} className="mb-4">
                        &larr; Back to Cities
                    </Button>

                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{selectedCity.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={selectedCity.is_active ? 'success' : 'error'}>
                                    {selectedCity.is_active ? 'Active Market' : 'Disabled'}
                                </Badge>
                                <span className="text-gray-500 text-sm">Last synced: Just now</span>
                            </div>
                        </div>
                        <Button
                            variant={selectedCity.is_active ? 'outline' : 'primary'}
                            onClick={(e) => handleToggleStatus(selectedCity.name, selectedCity.is_active, e)}
                        >
                            {selectedCity.is_active ? 'Disable City' : 'Enable City'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="p-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase">Total Supply</h4>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{selectedCity.total_venues}</p>
                            <div className="mt-2 text-xs flex gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded full">{selectedCity.total_accommodations} Beds</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded full">{selectedCity.total_cabins} Desks</span>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase">Active Demand</h4>
                            {/* Placeholder for real bookings */}
                            <p className="text-3xl font-bold text-gray-900 mt-2">{selectedCity.active_bookings}</p>
                            <p className="text-xs text-green-600 mt-1">↑ 5% this week</p>
                        </Card>
                        <Card className="p-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase">Occupancy</h4>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{selectedCity.occupancy_rate}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${selectedCity.occupancy_rate}%` }}></div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase">Owners</h4>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{selectedCity.owners.length}</p>
                            <p className="text-xs text-gray-400 mt-1">Active Partners</p>
                        </Card>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Area Breakdown</h3>
                        </div>
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Area Name</th>
                                    <th className="px-6 py-3">Venue Count</th>
                                    <th className="px-6 py-3">Desk Capacity</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedCity.areas.map((area, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{area.name}</td>
                                        <td className="px-6 py-4">{area.venue_count}</td>
                                        <td className="px-6 py-4">{area.cabin_count}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">High Demand</span>
                                        </td>
                                    </tr>
                                ))}
                                {selectedCity.areas.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No areas found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">City Operations</h2>
                        <p className="text-gray-500">Manage supply and visibility across regions.</p>
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Search cities..." className="min-w-[300px]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cities.map(city => (
                        <Card
                            key={city.name}
                            className={`p-0 overflow-hidden cursor-pointer transition-all hover:shadow-lg group border-l-4 ${city.is_active ? 'border-l-indigo-500' : 'border-l-gray-300'}`}
                            onClick={() => handleViewCity(city.name)}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-3 ${city.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg ${city.is_active ? 'text-gray-900' : 'text-gray-500'}`}>{city.name}</h3>
                                            <p className="text-xs text-gray-400">{city.total_venues} Venues</p>
                                        </div>
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={city.is_active}
                                                onChange={(e) => handleToggleStatus(city.name, city.is_active, e as any)}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Capacity</p>
                                        <p className="font-semibold text-gray-700">{city.total_cabins} <span className="text-xs font-normal">Desks</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Occupancy</p>
                                        <p className="font-semibold text-gray-700">{city.occupancy_rate}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-2 text-xs text-gray-500 flex justify-between group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                                <span>View Operational Details</span>
                                <ExternalLink className="w-3 h-3" />
                            </div>
                        </Card>
                    ))}
                    {cities.length === 0 && !loading && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            No cities found. Add venues to see them appear here.
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // --- FEATURED MANAGER VIEW (NEW) ---


    const PlaceholderView = ({ title }: { title: string }) => (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 max-w-md text-center">This module is currently under development. Check back soon for full functionality.</p>
        </div>
    );

    const SupplyView = () => {
        const [activeTab, setActiveTab] = useState<'VENUES' | 'ACCOMMODATIONS'>('VENUES');
        const [venues, setVenues] = useState<any[]>([]); // Using any for rapid proto, ideally typed
        const [accommodations, setAccommodations] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            loadSupply();
        }, []);

        const loadSupply = async () => {
            setLoading(true);
            try {
                const [vData, aData] = await Promise.all([
                    supplyService.getAllReadingRooms(true),
                    supplyService.getAllAccommodations(true)
                ]);
                setVenues(vData);
                setAccommodations(aData);
            } catch (err) {
                console.error("Failed to load supply", err);
            } finally {
                setLoading(false);
            }
        };

        const handleVerify = async (id: string, type: 'room' | 'accommodation') => {
            try {
                await supplyService.verifyEntity(id, type);
                // Optimistic update
                if (type === 'room') {
                    setVenues(prev => prev.map(v => v.id === id ? { ...v, is_verified: true } : v));
                } else {
                    setAccommodations(prev => prev.map(a => a.id === id ? { ...a, is_verified: true } : a));
                }
            } catch (err) {
                console.error("Failed to verify", err);
                alert("Failed to verify. Ensure you have permission.");
            }
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Supply Management</h2>
                        <p className="text-gray-500">Overview of all active venues and housing units.</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-l-4 border-l-indigo-500">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Total Venues</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{venues.length}</p>
                        <p className="text-xs text-indigo-600 mt-1">Study Spaces</p>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-blue-500">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Total Housing</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{accommodations.length}</p>
                        <p className="text-xs text-blue-600 mt-1">Hostels & PGs</p>
                    </Card>
                    <Card className="p-6 border-l-4 border-l-green-500">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Total Capacity</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {/* Rough estimate or robust calc */}
                            {venues.length * 50 + accommodations.length * 20}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Approx. Inventory</p>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('VENUES')}
                            className={`${activeTab === 'VENUES'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Reading Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab('ACCOMMODATIONS')}
                            className={`${activeTab === 'ACCOMMODATIONS'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Accommodations (Housing)
                        </button>
                    </nav>
                </div>

                {/* Content Table */}
                <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-gray-400">Loading supply data...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeTab === 'VENUES' ? (
                                        venues.length > 0 ? venues.map(v => (
                                            <tr key={v.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 mr-4 bg-gray-100 rounded-lg overflow-hidden">
                                                            {v.imageUrl ? <img src={v.imageUrl} alt="" className="h-full w-full object-cover" /> : <Building2 className="p-2 h-full w-full text-gray-400" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{v.name}</div>
                                                            <div className="text-gray-500 text-xs">Prop ID: {v.id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-900">{v.city || 'N/A'}</div>
                                                    <div className="text-xs">{v.area || v.address}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">₹{v.priceStart}/mo</td>
                                                <td className="px-6 py-4 text-gray-500">{v.contactPhone}</td>
                                                <td className="px-6 py-4">
                                                    {v.is_verified ? (
                                                        <Badge variant="success">Verified</Badge>
                                                    ) : v.status === 'REJECTED' ? (
                                                        <Badge variant="neutral" className="bg-red-100 text-red-700">Rejected</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Pending</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        onClick={() => navigate(`/super-admin/reading-rooms/${v.id}/review`)}
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan={6} className="px-6 py-8 text-center bg-gray-50/50">No reading rooms found.</td></tr>
                                    ) : (
                                        accommodations.length > 0 ? accommodations.map(a => (
                                            <tr key={a.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 mr-4 bg-gray-100 rounded-lg overflow-hidden">
                                                            {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-full w-full object-cover" /> : <Building2 className="p-2 h-full w-full text-gray-400" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{a.name}</div>
                                                            <div className="text-gray-500 text-xs">{a.type} • {a.gender}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-900">{a.city || 'N/A'}</div>
                                                    <div className="text-xs">{a.address}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">₹{a.price}/mo</td>
                                                <td className="px-6 py-4 text-gray-500">{a.contactPhone}</td>
                                                <td className="px-6 py-4">
                                                    {a.is_verified ? (
                                                        <Badge variant="success">Verified</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Pending</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        onClick={() => navigate(`/super-admin/accommodations/${a.id}/review`)}
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : <tr><td colSpan={6} className="px-6 py-8 text-center bg-gray-50/50">No accommodations found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        );
    };


    const BookingsView = () => {
        const [bookings, setBookings] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            loadBookings();
        }, []);

        const loadBookings = async () => {
            setLoading(true);
            try {
                const bData = await bookingService.getMyBookings();
                setBookings(bData);
            } catch (err) {
                console.error("Failed to load bookings", err);
            } finally {
                setLoading(false);
            }
        };

        const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const pendingSettlement = bookings.reduce((sum, b) => (!b.settlementStatus || b.settlementStatus === 'NOT_SETTLED') ? sum + (b.amount * 0.9) : sum, 0);

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Booking Console</h2>
                        <p className="text-gray-500">Monitor all reservation activities, venue attribution, and settlements.</p>
                    </div>
                    <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> Export CSV</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Total Revenue (Gross)</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-indigo-600 mt-1">Lifetime Volume</p>
                    </Card>
                    <Card className="p-6">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Pending Payouts</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">₹{pendingSettlement.toLocaleString()}</p>
                        <p className="text-xs text-orange-600 mt-1">To Owners</p>
                    </Card>
                    <Card className="p-6">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Settled</h4>
                        {/* Placeholder for now */}
                        <p className="text-3xl font-bold text-gray-900 mt-2">₹0</p>
                        <p className="text-xs text-green-600 mt-1">Paid Out</p>
                    </Card>
                    <Card className="p-6">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Active Bookings</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {bookings.filter(b => b.status === "ACTIVE").length}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Ongoing</p>
                    </Card>
                </div>

                <Card className="p-0 overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">All Reservations</h3>
                        <div className="flex gap-2">
                            <input placeholder="Filter by Venue..." className="px-3 py-1 border rounded text-sm" />
                            <input placeholder="Filter by Owner..." className="px-3 py-1 border rounded text-sm" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-white text-xs uppercase text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Booking ID</th>
                                    <th className="px-6 py-4">Venue & Owner</th>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4">Date Range</th>
                                    <th className="px-6 py-4">Financials</th>
                                    <th className="px-6 py-4">Settlement</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading bookings...</td></tr>
                                ) : bookings.length > 0 ? bookings.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs">{b.id.slice(0, 8)}...</div>
                                            <div className="text-xs text-gray-400 mt-1">{b.transactionId ? 'Txn: ' + b.transactionId.slice(0, 8) : 'No Txn'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{b.venueName || 'Unknown Venue'}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" /> {b.ownerName || 'Unknown Owner'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {b.cabinId ? `Cabin ${b.cabinNumber}` : `Housing #${b.accommodationId?.slice(0, 6)}`}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="whitespace-nowrap">{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</div>
                                            <div className="text-gray-400">to {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">₹{b.amount}</div>
                                            <div className="text-xs text-gray-500 flex justify-between w-24 mt-1">
                                                <span>Net:</span>
                                                <span className="font-medium text-green-600">₹{Math.round(b.amount * 0.9)}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400">Comm: ₹{Math.round(b.amount * 0.1)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={b.settlementStatus === "SETTLED" ? "success" : b.settlementStatus === "ON_HOLD" ? "error" : "warning"}>
                                                {b.settlementStatus || 'NOT_SETTLED'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={b.status === "ACTIVE" ? "success" : b.status === "CANCELLED" ? "error" : "warning"}>
                                                {b.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center bg-gray-50/50">No bookings found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    const FinanceView = () => {
        const [activeTab, setActiveTab] = useState<'overview' | 'refunds'>('overview');
        const [bookings, setBookings] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);

        // Refunds state
        const [refunds, setRefunds] = useState<RefundAdmin[]>([]);
        const [refundsLoading, setRefundsLoading] = useState(false);
        const [refundFilter, setRefundFilter] = useState<string>('');
        const [processingId, setProcessingId] = useState<string | null>(null);

        useEffect(() => {
            loadFinancials();
        }, []);

        useEffect(() => {
            if (activeTab === 'refunds') {
                loadRefunds();
            }
        }, [activeTab, refundFilter]);

        const loadFinancials = async () => {
            setLoading(true);
            try {
                const transactionData = await bookingService.getMyBookings();
                setBookings(transactionData);
            } catch (err) {
                console.error("Failed to load financials", err);
            } finally {
                setLoading(false);
            }
        };

        const loadRefunds = async () => {
            setRefundsLoading(true);
            try {
                const data = await paymentService.getAllRefunds(refundFilter || undefined);
                setRefunds(data);
            } catch (err) {
                console.error("Failed to load refunds", err);
            } finally {
                setRefundsLoading(false);
            }
        };

        const handleRefundAction = async (refundId: string, newStatus: string) => {
            const notes = newStatus === 'REJECTED' ? prompt('Enter rejection reason:') : undefined;
            setProcessingId(refundId);
            try {
                await paymentService.updateRefundStatus(refundId, newStatus, notes || undefined);
                alert(`Refund status updated to ${newStatus}`);
                loadRefunds();
            } catch (err) {
                console.error("Failed to update refund", err);
                alert("Failed to update refund status");
            } finally {
                setProcessingId(null);
            }
        };

        // --- Metrics Calculation ---
        const totalVolume = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const platformRevenue = totalVolume * 0.10;
        const payoutObligation = totalVolume * 0.90;

        // Refund stats
        const pendingRefunds = refunds.filter(r => ['REQUESTED', 'UNDER_REVIEW'].includes(r.status)).length;
        const processedRefunds = refunds.filter(r => r.status === 'PROCESSED').length;
        const totalRefundAmount = refunds.filter(r => r.status === 'PROCESSED').reduce((sum, r) => sum + r.amount, 0);

        // --- Chart Data ---
        const chartDataMap: { [key: string]: number } = {};
        bookings.forEach(b => {
            if (!b.startDate) return;
            const dateKey = b.startDate.substring(0, 10);
            chartDataMap[dateKey] = (chartDataMap[dateKey] || 0) + (b.amount || 0);
        });
        const data = Object.keys(chartDataMap).sort().map(date => ({
            name: date,
            revenue: chartDataMap[date]
        }));

        const statusColors: Record<string, string> = {
            REQUESTED: 'bg-yellow-100 text-yellow-700',
            UNDER_REVIEW: 'bg-blue-100 text-blue-700',
            APPROVED: 'bg-green-100 text-green-700',
            REJECTED: 'bg-red-100 text-red-700',
            PROCESSED: 'bg-emerald-100 text-emerald-700',
            FAILED: 'bg-red-100 text-red-700'
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Finance & Refunds</h2>
                        <p className="text-gray-500">Revenue capture, payouts, and refund management.</p>
                    </div>
                    <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> Export Report</Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-4">
                    <Button variant={activeTab === 'overview' ? 'primary' : 'outline'} onClick={() => setActiveTab('overview')}>
                        <DollarSign className="w-4 h-4 mr-2" /> Overview
                    </Button>
                    <Button variant={activeTab === 'refunds' ? 'primary' : 'outline'} onClick={() => setActiveTab('refunds')}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Refunds
                        {pendingRefunds > 0 && <Badge variant="warning" className="ml-2">{pendingRefunds}</Badge>}
                    </Button>
                </div>

                {activeTab === 'overview' && (
                    <>
                        {/* Top Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Gross Volume (GMV)</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">₹{totalVolume.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6 border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Net Revenue (Est.)</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">₹{platformRevenue.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6 border-t-4 border-t-orange-500 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Refunds Processed</p>
                                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">₹{totalRefundAmount.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                        <RotateCcw className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="mt-4 text-sm text-gray-500">{processedRefunds} refunds completed</div>
                            </Card>
                        </div>

                        {/* Revenue Chart */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
                            <div className="h-80 w-full">
                                {data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                                        <Activity className="w-10 h-10 mb-2 opacity-20" />
                                        <p>No transaction data available yet</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </>
                )}

                {activeTab === 'refunds' && (
                    <div className="space-y-6">
                        {/* Refund Filters */}
                        <div className="flex gap-2 flex-wrap">
                            {['', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED', 'REJECTED'].map(status => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant={refundFilter === status ? 'primary' : 'outline'}
                                    onClick={() => setRefundFilter(status)}
                                >
                                    {status || 'All'}
                                </Button>
                            ))}
                        </div>

                        {/* Refunds Table */}
                        <Card className="p-0 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Venue</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Requested</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {refundsLoading ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading refunds...</td></tr>
                                    ) : refunds.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No refund requests found.</td></tr>
                                    ) : refunds.map(refund => (
                                        <tr key={refund.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{refund.user_name}</div>
                                                <div className="text-xs text-gray-500">{refund.user_email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{refund.venue_name}</td>
                                            <td className="px-6 py-4 font-bold text-indigo-600">₹{refund.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-gray-600 max-w-[150px] truncate" title={refund.reason_text || refund.reason}>
                                                {refund.reason_text || refund.reason.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[refund.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {refund.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(refund.requested_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {refund.status === 'REQUESTED' && (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => handleRefundAction(refund.id, 'UNDER_REVIEW')} disabled={processingId === refund.id}>
                                                            Review
                                                        </Button>
                                                    </>
                                                )}
                                                {['REQUESTED', 'UNDER_REVIEW'].includes(refund.status) && (
                                                    <>
                                                        <Button size="sm" variant="primary" onClick={() => handleRefundAction(refund.id, 'APPROVED')} disabled={processingId === refund.id}>
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleRefundAction(refund.id, 'REJECTED')} disabled={processingId === refund.id}>
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {refund.status === 'APPROVED' && (
                                                    <Button size="sm" variant="primary" onClick={() => handleRefundAction(refund.id, 'PROCESSED')} disabled={processingId === refund.id}>
                                                        Mark Processed
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}
            </div>
        );
    };

    const TrustView = () => {
        const [venues, setVenues] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);
        const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'reminders' | 'audit'>('overview');

        // Trust data states
        const [flags, setFlags] = useState<any[]>([]);
        const [reminders, setReminders] = useState<any[]>([]);
        const [auditLog, setAuditLog] = useState<any[]>([]);
        const [auditTotal, setAuditTotal] = useState(0);

        // Action states
        const [actionLoading, setActionLoading] = useState<string | null>(null);
        const [selectedFlag, setSelectedFlag] = useState<any | null>(null);
        const [resolveModalOpen, setResolveModalOpen] = useState(false);
        const [resolveNotes, setResolveNotes] = useState('');

        // Audit filters
        const [auditActionFilter, setAuditActionFilter] = useState('');
        const [auditEntityFilter, setAuditEntityFilter] = useState('');

        useEffect(() => {
            loadAllData();
        }, []);

        const loadAllData = async () => {
            setLoading(true);
            try {
                // Load venues for compliance check
                const v = await supplyService.getAllReadingRooms();
                setVenues(v);

                // Load trust data from backend
                const { trustService } = await import('../services/trustService');

                const [flagsData, remindersData, auditData] = await Promise.all([
                    trustService.getAllFlags().catch(() => []),
                    trustService.getAllReminders().catch(() => []),
                    trustService.getAuditLog({ limit: 50 }).catch(() => ({ entries: [], total: 0 }))
                ]);

                setFlags(flagsData);
                setReminders(remindersData);
                setAuditLog(auditData.entries || []);
                setAuditTotal(auditData.total || 0);
            } catch (err) {
                console.error("Trust data load failed", err);
            } finally {
                setLoading(false);
            }
        };

        // --- Compliance Analysis ---
        const flaggedVenues = venues.filter(v => {
            const hasPhone = !!v.contactPhone;
            const hasImage = !!v.imageUrl;
            const hasDesc = v.description && v.description.length > 5;
            return !hasPhone || !hasImage || !hasDesc;
        });

        const unverifiedUsers = state.users.filter(u => !u.phone);

        // Scores
        const venueComplianceScore = Math.round(((venues.length - flaggedVenues.length) / (venues.length || 1)) * 100);
        const userVerificationRate = Math.round(((state.users.length - unverifiedUsers.length) / (state.users.length || 1)) * 100);

        // --- Action Handlers ---
        const handleFlagVenue = async (venue: any) => {
            if (!confirm(`Flag "${venue.name}" for compliance issues?`)) return;

            setActionLoading(venue.id);
            try {
                const { trustService } = await import('../services/trustService');

                // Determine flag type based on issues
                let flagType = 'other';
                if (!venue.contactPhone) flagType = 'missing_phone';
                else if (!venue.imageUrl) flagType = 'missing_images';
                else if (!venue.description || venue.description.length <= 5) flagType = 'weak_description';

                await trustService.createFlag(
                    'reading_room',
                    venue.id,
                    flagType as any,
                    'Flagged for compliance issues',
                    state.currentUser?.id,
                    state.currentUser?.name
                );

                alert(`✅ Flag created for "${venue.name}". Owner will see restrictions.`);
                loadAllData();
            } catch (err: any) {
                console.error("Flag creation failed", err);
                alert(`❌ Failed to create flag: ${err.response?.data?.detail || err.message}`);
            } finally {
                setActionLoading(null);
            }
        };

        const handleRemindUser = async (user: any) => {
            if (!confirm(`Send verification reminder to "${user.name}"?`)) return;

            setActionLoading(user.id);
            try {
                const { trustService } = await import('../services/trustService');

                await trustService.sendReminder(
                    user.id,
                    'phone',
                    ['phone'],
                    'Please complete your phone verification to continue using the platform.',
                    true, // blocks listings
                    true, // blocks payments
                    false, // blocks bookings
                    state.currentUser?.id,
                    state.currentUser?.name
                );

                alert(`✅ Reminder sent to "${user.name}". User will see verification block.`);
                loadAllData();
            } catch (err: any) {
                console.error("Reminder send failed", err);
                alert(`❌ Failed to send reminder: ${err.response?.data?.detail || err.message}`);
            } finally {
                setActionLoading(null);
            }
        };

        const handleResolveFlag = async (action: 'approve' | 'reject' | 'escalate') => {
            if (!selectedFlag) return;

            setActionLoading(selectedFlag.id);
            try {
                const { trustService } = await import('../services/trustService');

                await trustService.resolveFlag(
                    selectedFlag.id,
                    action,
                    resolveNotes,
                    state.currentUser?.id,
                    state.currentUser?.name
                );

                const actionText = action === 'approve' ? 'resolved' : action === 'reject' ? 'rejected' : 'escalated';
                alert(`✅ Flag ${actionText} successfully.`);
                setResolveModalOpen(false);
                setSelectedFlag(null);
                setResolveNotes('');
                loadAllData();
            } catch (err: any) {
                console.error("Flag resolution failed", err);
                alert(`❌ Failed to resolve flag: ${err.response?.data?.detail || err.message}`);
            } finally {
                setActionLoading(null);
            }
        };

        const loadAuditLog = async () => {
            try {
                const { trustService } = await import('../services/trustService');
                const data = await trustService.getAuditLog({
                    actionType: auditActionFilter || undefined,
                    entityType: auditEntityFilter || undefined,
                    limit: 100
                });
                setAuditLog(data.entries || []);
                setAuditTotal(data.total || 0);
            } catch (err) {
                console.error("Audit log load failed", err);
            }
        };

        useEffect(() => {
            if (activeTab === 'audit') {
                loadAuditLog();
            }
        }, [activeTab, auditActionFilter, auditEntityFilter]);

        // Count active issues
        const activeFlags = flags.filter(f => f.status === 'active' || f.status === 'owner_resubmitted');
        const pendingReminders = reminders.filter(r => r.status === 'pending');

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Trust & Safety</h2>
                        <p className="text-gray-500">Platform compliance, risk monitoring, and moderation.</p>
                    </div>
                    <div className="flex gap-2">
                        {['overview', 'flags', 'reminders', 'audit'].map(tab => (
                            <Button
                                key={tab}
                                variant={activeTab === tab ? 'primary' : 'outline'}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                {tab === 'overview' && 'Overview'}
                                {tab === 'flags' && `Flags (${activeFlags.length})`}
                                {tab === 'reminders' && `Reminders (${pendingReminders.length})`}
                                {tab === 'audit' && 'Audit Log'}
                            </Button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <>
                        {/* Safety Pulse */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700">Compliance Score</h3>
                                    {venueComplianceScore > 80 ? <CheckCircle className="text-green-500 w-6 h-6" /> : <AlertTriangle className="text-orange-500 w-6 h-6" />}
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-extrabold text-gray-900">{venueComplianceScore}%</span>
                                    <span className="text-sm text-gray-500 mb-1">of venues meet standards</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                                    <div className={`h-2 rounded-full ${venueComplianceScore > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${venueComplianceScore}%` }}></div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700">Identity Health</h3>
                                    <Users className="text-indigo-500 w-6 h-6" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-extrabold text-gray-900">{userVerificationRate}%</span>
                                    <span className="text-sm text-gray-500 mb-1">users phone verified</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${userVerificationRate}%` }}></div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-red-50 border border-red-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-red-800">Active Issues</h3>
                                    <Flag className="text-red-600 w-6 h-6" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-extrabold text-red-900">{activeFlags.length + pendingReminders.length}</span>
                                    <span className="text-sm text-red-700/80 mb-1">require attention</span>
                                </div>
                                <p className="text-xs text-red-600 mt-4">Flags: {activeFlags.length} | Reminders: {pendingReminders.length}</p>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Flagged Venues */}
                            <Card className="p-0 overflow-hidden h-fit">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-500" /> Venue Risks
                                    </h3>
                                    <Badge variant="error">{flaggedVenues.length} Issues</Badge>
                                </div>
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="bg-white text-xs uppercase text-gray-700 font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3">Venue</th>
                                            <th className="px-6 py-3">Issue</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan={3} className="px-6 py-4 text-center">Scanning...</td></tr>
                                        ) : flaggedVenues.slice(0, 5).map(v => (
                                            <tr key={v.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{v.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {!v.contactPhone && <Badge variant="warning">No Phone</Badge>}
                                                        {!v.imageUrl && <Badge variant="warning">No Image</Badge>}
                                                        {(!v.description || v.description.length <= 5) && <Badge variant="warning">Weak Desc</Badge>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleFlagVenue(v)}
                                                        isLoading={actionLoading === v.id}
                                                    >
                                                        Flag
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {flaggedVenues.length === 0 && !loading && (
                                            <tr><td colSpan={3} className="px-6 py-8 text-center text-green-600">All venues compliant.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>

                            {/* Unverified Users */}
                            <Card className="p-0 overflow-hidden h-fit">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" /> Identity Checks
                                    </h3>
                                    <Badge variant="warning">{unverifiedUsers.length} Unverified</Badge>
                                </div>
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="bg-white text-xs uppercase text-gray-700 font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Missing</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {unverifiedUsers.slice(0, 5).map(u => (
                                            <tr key={u.id}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{u.name}</div>
                                                    <div className="text-xs">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">Phone Number</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-indigo-600"
                                                        onClick={() => handleRemindUser(u)}
                                                        isLoading={actionLoading === u.id}
                                                    >
                                                        Remind
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {unverifiedUsers.length === 0 && (
                                            <tr><td colSpan={3} className="px-6 py-8 text-center text-green-600">All users verified.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </>
                )}

                {activeTab === 'flags' && (
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">All Trust Flags</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-3">Entity</th>
                                    <th className="px-6 py-3">Flag Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Raised</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {flags.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No flags recorded.</td></tr>
                                ) : flags.map(flag => (
                                    <tr key={flag.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{flag.entity_name}</div>
                                            <div className="text-xs text-gray-500">{flag.entity_type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="warning">{flag.flag_type?.replace('_', ' ')}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={flag.status === 'active' ? 'error' : flag.status === 'resolved' ? 'success' : 'warning'}>
                                                {flag.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(flag.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(flag.status === 'active' || flag.status === 'owner_resubmitted') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setSelectedFlag(flag); setResolveModalOpen(true); }}
                                                >
                                                    Resolve
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                {activeTab === 'reminders' && (
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">All Reminders</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Blocks</th>
                                    <th className="px-6 py-3">Sent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reminders.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No reminders sent.</td></tr>
                                ) : reminders.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{r.user_name}</div>
                                            <div className="text-xs text-gray-500">{r.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="info">{r.reminder_type}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={r.status === 'pending' ? 'warning' : r.status === 'completed' ? 'success' : 'outline'}>
                                                {r.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {r.blocks_listings && <span className="bg-red-100 text-red-700 px-1 rounded mr-1">Listings</span>}
                                            {r.blocks_payments && <span className="bg-red-100 text-red-700 px-1 rounded mr-1">Payments</span>}
                                            {r.blocks_bookings && <span className="bg-red-100 text-red-700 px-1 rounded">Bookings</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(r.sent_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                {activeTab === 'audit' && (
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Audit Log ({auditTotal} entries)</h3>
                            <div className="flex gap-2">
                                <select
                                    className="text-sm border rounded px-2 py-1"
                                    value={auditActionFilter}
                                    onChange={(e) => setAuditActionFilter(e.target.value)}
                                >
                                    <option value="">All Actions</option>
                                    <option value="flag_raised">Flag Raised</option>
                                    <option value="flag_resolved">Flag Resolved</option>
                                    <option value="reminder_sent">Reminder Sent</option>
                                    <option value="owner_resubmitted">Owner Resubmitted</option>
                                </select>
                                <select
                                    className="text-sm border rounded px-2 py-1"
                                    value={auditEntityFilter}
                                    onChange={(e) => setAuditEntityFilter(e.target.value)}
                                >
                                    <option value="">All Entities</option>
                                    <option value="reading_room">Reading Room</option>
                                    <option value="accommodation">Accommodation</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-3">Timestamp</th>
                                    <th className="px-6 py-3">Actor</th>
                                    <th className="px-6 py-3">Action</th>
                                    <th className="px-6 py-3">Entity</th>
                                    <th className="px-6 py-3">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {auditLog.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No audit entries found.</td></tr>
                                ) : auditLog.map(entry => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{entry.actor_name}</div>
                                            <div className="text-xs text-gray-500">{entry.actor_role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline">{entry.action_type?.replace('_', ' ')}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {entry.entity_name && <div className="font-medium">{entry.entity_name}</div>}
                                            <div className="text-gray-500">{entry.entity_type}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                                            {entry.action_description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                {/* Resolve Flag Modal */}
                <Modal isOpen={resolveModalOpen} onClose={() => setResolveModalOpen(false)} title="Resolve Flag">
                    {selectedFlag && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium text-gray-900">{selectedFlag.entity_name}</p>
                                <p className="text-sm text-gray-500">Flag Type: {selectedFlag.flag_type}</p>
                                {selectedFlag.owner_notes && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                        <p className="font-medium text-blue-800">Owner Notes:</p>
                                        <p className="text-blue-700">{selectedFlag.owner_notes}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                                <textarea
                                    value={resolveNotes}
                                    onChange={(e) => setResolveNotes(e.target.value)}
                                    className="w-full border rounded-lg p-2 text-sm"
                                    rows={3}
                                    placeholder="Add notes about this resolution..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleResolveFlag('approve')}
                                    isLoading={actionLoading === selectedFlag.id}
                                >
                                    ✓ Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-orange-600 border-orange-200"
                                    onClick={() => handleResolveFlag('reject')}
                                    isLoading={actionLoading === selectedFlag.id}
                                >
                                    ✗ Reject
                                </Button>
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    onClick={() => handleResolveFlag('escalate')}
                                    isLoading={actionLoading === selectedFlag.id}
                                >
                                    ⚠ Escalate
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    };

    const AnalyticsView = () => {
        // Data Prep
        const totalUsers = state.users.length;
        const totalVenues = state.readingRooms.length; // From prop state (might need refreshing if relying on supplyService for fresh, but prop is okay for general)
        const totalBookings = state.bookings.length;

        // User Distribution
        const students = state.users.filter(u => u.role === 'STUDENT').length;
        const admins = state.users.filter(u => u.role === 'ADMIN').length;
        const superAdmins = state.users.filter(u => u.role === 'SUPER_ADMIN').length;

        const userPieData = [
            { name: 'Students', value: students, color: '#4F46E5' }, // Indigo
            { name: 'Venue Owners', value: admins, color: '#10B981' }, // Emerald
            { name: 'Staff', value: superAdmins, color: '#F59E0B' }, // Amber
        ];

        // Capacity Utilization (Mock logic for demonstration until we have granular capacity data in state)
        // We know total cabins from supply service (or we can estimate from venues * avg)
        // Let's use a rough estimate based on venues in state
        const estCapacity = totalVenues * 50;
        const activeUtil = state.bookings.filter(b => b.status === 'ACTIVE').length;
        const utilizationRate = estCapacity > 0 ? Math.round((activeUtil / estCapacity) * 100) : 0;

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Analytics Studio</h2>
                        <p className="text-gray-500">Deep dive into platform performance and user behavior.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">Last 30 Days</Button>
                        <Button><ExternalLink className="w-4 h-4 mr-2" /> Export Data</Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</h3>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 flex items-center">
                            <Activity className="w-3 h-3 mr-1" /> +{state.users.length} this month
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Venues</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalVenues}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Building2 className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Across top cities</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Bookings</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Conversion Rate: 2.5%</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Utilization</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{utilizationRate}%</h3>
                            </div>
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{activeUtil} active / {estCapacity} cap</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Distribution Chart */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-6">User Demographics</h3>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={userPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {userPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-gray-900">{totalUsers}</span>
                                <span className="text-xs text-gray-500 uppercase">Users</span>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            {userPieData.map(item => (
                                <div key={item.name} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Growth Chart (Mock) */}
                    <Card className="col-span-2 p-6">
                        <h3 className="font-bold text-gray-900 mb-6">Platform Growth</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Jan', users: 65, bookings: 40 },
                                    { name: 'Feb', users: 59, bookings: 80 },
                                    { name: 'Mar', users: 80, bookings: 120 },
                                    { name: 'Apr', users: 81, bookings: 160 },
                                    { name: 'May', users: 56, bookings: 190 },
                                    { name: 'Jun', users: 55, bookings: 230 },
                                    { name: 'Jul', users: 40, bookings: 290 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="bookings" name="Bookings" fill="#818CF8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="users" name="New Users" fill="#34D399" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    const SettingsView = () => {
        // Mock Settings State
        const [config, setConfig] = useState({
            platformName: 'StudySpace',
            supportEmail: 'support@studyspace.com',
            maintenanceMode: false,
            registrationsOpen: true,
            currency: 'INR'
        });

        const handleSave = () => {
            // Mock API call
            alert("Settings saved successfully!");
        };

        const toggleSetting = (key: keyof typeof config) => {
            setConfig(prev => ({ ...prev, [key]: !prev[key as keyof typeof config] }));
        };

        return (
            <div className="space-y-6 animate-in fade-in max-w-4xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
                        <p className="text-gray-500">Configure global application preferences.</p>
                    </div>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* General Settings */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Globe className="w-5 h-5 mr-2 text-gray-500" /> General Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Platform Name"
                                value={config.platformName}
                                onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                            />
                            <Input
                                label="Support Email"
                                value={config.supportEmail}
                                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:ring-2 focus:ring-indigo-500"
                                    value={config.currency}
                                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* System Controls */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-gray-500" /> System Controls
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">Maintenance Mode</div>
                                    <div className="text-xs text-gray-500">Disable access for all non-admin users.</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={config.maintenanceMode ? 'danger' : 'outline'}
                                    onClick={() => toggleSetting('maintenanceMode')}
                                >
                                    {config.maintenanceMode ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">New Registrations</div>
                                    <div className="text-xs text-gray-500">Allow new users to sign up.</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={config.registrationsOpen ? 'primary' : 'outline'}
                                    onClick={() => toggleSetting('registrationsOpen')}
                                >
                                    {config.registrationsOpen ? 'Open' : 'Closed'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Security & Data */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Lock className="w-5 h-5 mr-2 text-gray-500" /> Security & Data
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <div className="font-medium text-gray-900">Admin Password</div>
                                    <div className="text-xs text-gray-500">Change your super admin password.</div>
                                </div>
                                <Button variant="outline" size="sm">Update Password</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900">System Cache</div>
                                    <div className="text-xs text-gray-500">Clear temporary data and cached queries.</div>
                                </div>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Clear Cache</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-10">
            <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/ads" element={<SuperAdminAdsView
                    ads={ads}
                    isCreatingAd={isCreatingAd}
                    setIsCreatingAd={setIsCreatingAd}
                    newAd={newAd}
                    setNewAd={setNewAd}
                    onCreate={handleCreateAd}
                    onDelete={handleDeleteAd}
                    onEdit={handleEditAd}
                    onToggle={handleToggleAd}
                />} />
                <Route path="/tickets" element={<SupportManagerView />} />
                <Route path="/featured" element={<Navigate to="/super-admin/promotions" replace />} />
                <Route path="/promotions" element={<PromotionManagerView />} />
                <Route path="/plans" element={<SubscriptionPlansView />} />
                <Route path="/users" element={<UsersView />} />
                <Route path="/cities" element={<CitiesView />} />
                <Route path="/locations" element={<LocationManagement />} />
                <Route path="/supply" element={<SupplyView />} />
                <Route path="/reading-rooms/:id/review" element={<SuperAdminReadingRoomReview />} />
                <Route path="/bookings" element={<BookingsView />} />
                <Route path="/finance" element={<FinanceView />} />
                <Route path="/trust" element={<TrustView />} />
                <Route path="/analytics" element={<AnalyticsView />} />
                <Route path="/settings" element={<SettingsView />} />
            </Routes>
        </div>
    );
};
