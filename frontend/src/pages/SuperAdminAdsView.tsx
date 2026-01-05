import React, { useState, useEffect } from 'react';
import { Ad, AdCategoryEntity, TargetAudience } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { Plus, Trash2, Users, ExternalLink, Sparkles, AlertTriangle, Loader2, Monitor, Smartphone, Info, Edit2, ToggleLeft, ToggleRight, Eye, MousePointerClick, Link as LinkIcon } from 'lucide-react';

interface SuperAdminAdsViewProps {
    ads: Ad[];
    isCreatingAd: boolean;
    setIsCreatingAd: (isOpen: boolean) => void;
    newAd: Partial<Ad>;
    setNewAd: (ad: Partial<Ad> | ((prev: Partial<Ad>) => Partial<Ad>)) => void;
    onCreate: (e: React.FormEvent) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onEdit?: (ad: Ad) => void;
    onToggle?: (id: string) => Promise<void>;
}

export const SuperAdminAdsView: React.FC<SuperAdminAdsViewProps> = ({
    ads,
    isCreatingAd,
    setIsCreatingAd,
    newAd,
    setNewAd,
    onCreate,
    onDelete,
    onEdit,
    onToggle
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [urlWarning, setUrlWarning] = useState('');
    const [imageWarning, setImageWarning] = useState('');

    // Dynamic categories from backend
    const [categories, setCategories] = useState<AdCategoryEntity[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:8000/ad-categories/');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Failed to fetch ad categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Helper to get category name by ID
    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return 'Uncategorized';
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || categoryId;
    };

    // Group categories by group for better UX in dropdown
    const groupedCategories: Record<string, AdCategoryEntity[]> = categories.reduce((acc, cat) => {
        const group = cat.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(cat);
        return acc;
    }, {} as Record<string, AdCategoryEntity[]>);

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
            // Show preview using blob URL (for display only)
            const objectUrl = URL.createObjectURL(file);
            setNewAd(prev => ({ ...prev, imageUrl: objectUrl }));
            // Warn that blob URLs won't work - need to use direct URL
            setImageWarning('⚠️ File uploads create temporary previews. For the ad to work, paste a direct image URL (https://...) below.');
        }
    };

    const handleUrlChange = (val: string) => {
        setNewAd(prev => ({ ...prev, imageUrl: val }));
        if (val && val.startsWith('blob:')) {
            setUrlWarning('This is a temporary preview URL. Please paste a permanent image URL.');
        } else if (val && !val.startsWith('http')) {
            setUrlWarning('URL should start with http:// or https://');
        } else {
            setUrlWarning('');
            setImageWarning(''); // Clear upload warning if a proper URL is entered
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
                    <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <Input label="Campaign Title" value={newAd.title || ''} onChange={e => setNewAd(prev => ({ ...prev, title: e.target.value }))} required placeholder="e.g. Summer Discount 2024" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                rows={3}
                                value={newAd.description || ''}
                                onChange={e => setNewAd(prev => ({ ...prev, description: e.target.value }))}
                                required
                                placeholder="Ad copy text..."
                            />
                        </div>

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
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            // Validate file size (2MB max)
                                            if (file.size > 2 * 1024 * 1024) {
                                                setImageWarning('File exceeds 2MB. Consider compressing the image.');
                                            }
                                            // Validate dimensions
                                            const img = new Image();
                                            img.onload = () => {
                                                const w = img.width;
                                                const h = img.height;
                                                let warning = '⚠️ File uploads show a preview only. Paste a direct image URL (https://...) below to save the ad.';
                                                if (w < 1080 || h < 400) {
                                                    warning += ` Also: Image is ${w}×${h}px (recommended min 1200×400px).`;
                                                } else if (w / h < 1.5 || w / h > 4) {
                                                    warning += ` Also: Aspect ratio ${(w / h).toFixed(1)}:1 may cause cropping.`;
                                                }
                                                setImageWarning(warning);
                                            };
                                            img.src = URL.createObjectURL(file);
                                            setNewAd(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                                        }
                                    }}
                                />
                            </div>

                            {/* Image Size Guidelines - Always Visible */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2 text-sm">
                                        <p className="font-semibold text-blue-900">Recommended Image Specifications</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="w-4 h-4 text-blue-600" />
                                                <span><strong>Desktop:</strong> 1200 × 400 px (3:1)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-blue-600" />
                                                <span><strong>Mobile:</strong> 1080 × 600 px (16:9)</span>
                                            </div>
                                        </div>
                                        <p className="text-blue-700 text-xs">
                                            <strong>Max Size:</strong> 2 MB &nbsp;•&nbsp; <strong>Formats:</strong> JPG, PNG, WebP &nbsp;•&nbsp;
                                            <span className="text-blue-600">Single image auto-scales for all devices</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Image Dimension Warning */}
                            {imageWarning && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <span className="text-sm">{imageWarning}</span>
                                </div>
                            )}

                            <div className="relative">
                                <Input
                                    label=""
                                    value={newAd.imageUrl || ''}
                                    onChange={e => handleUrlChange(e.target.value)}
                                    placeholder="Or paste direct Image URL..."
                                    className="text-xs"
                                />
                                {urlWarning && (
                                    <div className="absolute right-3 top-3 text-red-500 text-xs flex items-center bg-white px-1">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> {urlWarning}
                                    </div>
                                )}
                            </div>

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
                                        onChange={e => setNewAd(prev => ({ ...prev, link: e.target.value }))}
                                        required
                                        placeholder="https://..."
                                    />
                                </div>
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

                        <Input label="CTA Button Text" value={newAd.ctaText || ''} onChange={e => setNewAd(prev => ({ ...prev, ctaText: e.target.value }))} placeholder="e.g. Book Now" />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            {categoriesLoading ? (
                                <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-gray-50">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span className="text-sm text-gray-500">Loading categories...</span>
                                </div>
                            ) : (
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border"
                                    value={newAd.categoryId || ''}
                                    onChange={e => setNewAd(prev => ({ ...prev, categoryId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select a category...</option>
                                    {Object.entries(groupedCategories).map(([group, cats]) => (
                                        <optgroup key={group} label={`${group === 'Student' ? '🎓' : group === 'Housing' ? '🏠' : group === 'Business' ? '💼' : '⭐'} ${group}`}>
                                            {cats.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                            <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border" value={newAd.targetAudience} onChange={e => setNewAd(prev => ({ ...prev, targetAudience: e.target.value as any }))}>
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
                    <Card key={ad.id} className={`p-0 overflow-hidden flex flex-col h-full group hover:shadow-lg transition-shadow ${ad.isActive === false ? 'opacity-60' : ''}`}>
                        <div className="h-40 overflow-hidden relative bg-gray-100">
                            <img
                                src={ad.imageUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                alt={ad.title}
                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Found')}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <Badge variant="info" className="bg-white/90 backdrop-blur-sm shadow-sm">{getCategoryName(ad.categoryId)}</Badge>
                            </div>
                            {ad.isActive === false && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded">PAUSED</span>
                                </div>
                            )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{ad.title}</h3>
                                    {onToggle && (
                                        <button
                                            onClick={() => onToggle(ad.id)}
                                            className={`p-1 rounded transition-colors ${ad.isActive !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title={ad.isActive !== false ? 'Click to pause' : 'Click to resume'}
                                        >
                                            {ad.isActive !== false ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{ad.description}</p>
                            </div>

                            {/* Analytics */}
                            <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1" title="Impressions">
                                    <Eye className="w-3 h-3" />
                                    <span>{ad.impressionCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Clicks">
                                    <MousePointerClick className="w-3 h-3" />
                                    <span>{ad.clickCount || 0}</span>
                                </div>
                                {ad.impressionCount && ad.impressionCount > 0 && (
                                    <span className="text-indigo-600 font-medium" title="Click-through rate">
                                        {((ad.clickCount || 0) / ad.impressionCount * 100).toFixed(1)}% CTR
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    <Users className="w-3 h-3" /> {ad.targetAudience}
                                </div>
                                <div className="flex items-center gap-1">
                                    {onEdit && (
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50" onClick={() => onEdit(ad)} title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(ad.id)} title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
