import { Listing, Bounty, UserProfile, Category } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.details || errorData.error || errorMessage;
    } catch (e) {
      // If it's not JSON, it might be an HTML error page or plain text
      const text = await response.text().catch(() => 'No response body');
      console.error(`API Error [${path}]: Status ${response.status} ${response.statusText}`, text.substring(0, 500));
      errorMessage = `Server Error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Listings
  async getListings(category?: Category, userId?: string): Promise<Listing[]> {
    let path = '/listings';
    const params = new URLSearchParams();
    if (category && category !== 'ALL' as any) params.append('category', category);
    if (userId) params.append('userId', userId);
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    return request<Listing[]>(path);
  },

  async createListing(data: any, token: string): Promise<Listing> {
    return request<Listing>('/listings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateListing(id: string, data: Partial<Listing>, token: string): Promise<Listing> {
    return request<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteListing(id: string, token: string): Promise<void> {
    await request(`/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Bounties
  async getBounties(userId?: string): Promise<Bounty[]> {
    let path = '/bounties';
    if (userId) path += `?userId=${userId}`;
    return request<Bounty[]>(path);
  },

  async createBounty(data: any, token: string): Promise<Bounty> {
    return request<Bounty>('/bounties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async updateBounty(id: string, data: Partial<Bounty>, token: string): Promise<Bounty> {
    return request<Bounty>(`/bounties/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  async deleteBounty(id: string, token: string): Promise<void> {
    await request(`/bounties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Users
  async getUserProfile(uid: string): Promise<UserProfile> {
    return request<UserProfile>(`/users/${uid}`);
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>, token: string): Promise<void> {
    await request(`/users/${uid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};
