import api from './api';
import { Ad, TargetAudience } from '../types';

export interface AdCreatePayload {
  title: string;
  description: string;
  image_url: string;
  cta_text: string;
  link: string;
  category_id?: string;
  target_audience: TargetAudience;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface AdUpdatePayload {
  title?: string;
  description?: string;
  image_url?: string;
  cta_text?: string;
  link?: string;
  category_id?: string;
  target_audience?: TargetAudience;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

export const adService = {
  // Get all ads (for admin, include inactive)
  getAllAds: async (includeInactive = false): Promise<Ad[]> => {
    const response = await api.get('/ads/', {
      params: { include_inactive: includeInactive }
    });
    return response.data.map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.image_url,
      ctaText: ad.cta_text,
      link: ad.link,
      categoryId: ad.category_id,
      targetAudience: ad.target_audience,
      isActive: ad.is_active,
      createdAt: ad.created_at,
      startDate: ad.start_date,
      endDate: ad.end_date,
      impressionCount: ad.impression_count || 0,
      clickCount: ad.click_count || 0,
    }));
  },

  // Get single ad
  getAd: async (adId: string): Promise<Ad> => {
    const response = await api.get(`/ads/${adId}`);
    const ad = response.data;
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.image_url,
      ctaText: ad.cta_text,
      link: ad.link,
      categoryId: ad.category_id,
      targetAudience: ad.target_audience,
      isActive: ad.is_active,
      createdAt: ad.created_at,
      startDate: ad.start_date,
      endDate: ad.end_date,
      impressionCount: ad.impression_count || 0,
      clickCount: ad.click_count || 0,
    };
  },

  // Create new ad (accepts frontend camelCase Ad format, converts to snake_case)
  createAd: async (ad: Partial<Ad>): Promise<Ad> => {
    const payload = {
      title: ad.title,
      description: ad.description,
      image_url: ad.imageUrl,
      cta_text: ad.ctaText,
      link: ad.link,
      category_id: ad.categoryId,
      target_audience: ad.targetAudience,
      is_active: ad.isActive ?? true,
      start_date: ad.startDate,
      end_date: ad.endDate,
    };
    const response = await api.post('/ads/', payload);
    return response.data;
  },

  // Update ad
  updateAd: async (adId: string, payload: AdUpdatePayload): Promise<Ad> => {
    const response = await api.put(`/ads/${adId}`, payload);
    return response.data;
  },

  // Toggle ad active status
  toggleAd: async (adId: string): Promise<{ id: string; is_active: boolean }> => {
    const response = await api.patch(`/ads/${adId}/toggle`);
    return response.data;
  },

  // Track impression
  trackImpression: async (adId: string): Promise<void> => {
    await api.post(`/ads/${adId}/impression`);
  },

  // Track click
  trackClick: async (adId: string): Promise<void> => {
    await api.post(`/ads/${adId}/click`);
  },

  // Delete ad
  deleteAd: async (adId: string): Promise<void> => {
    await api.delete(`/ads/${adId}`);
  },

  // Legacy method name for backward compatibility
  getAds: async (): Promise<Ad[]> => {
    return adService.getAllAds(false);
  },
};

// Standalone function for targeting ads (used in StudentDashboard, ReadingRoomDetail, BookCabin)
export const getTargetedAd = (
  ads: Ad[],
  userRole: string,
  hasActiveBooking: boolean,
  placement: string
): Ad | null => {
  if (!ads || ads.length === 0) return null;

  const role = (userRole || '').toUpperCase();

  // Filter by audience
  const targetedAds = ads.filter(ad => {
    if (ad.targetAudience === 'ALL') return true;
    if (ad.targetAudience === 'STUDENT' && role === 'STUDENT') return true;
    if (ad.targetAudience === 'ADMIN' && (role === 'ADMIN' || role === 'OWNER')) return true;
    return false;
  });

  if (targetedAds.length === 0) return null;

  // Return random ad from filtered list
  return targetedAds[Math.floor(Math.random() * targetedAds.length)];
};
