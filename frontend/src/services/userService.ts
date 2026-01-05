import api from './api';
import { User } from '../types';

export const userService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get('/users/');
        // Mapping backend response to frontend User type if strictly needed,
        // but typically they match. 
        // Backend UserResponse: id, email, name, role, avatar_url, phone
        // Frontend User: id, name, email, role, avatarUrl, phone...
        return response.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatar_url,
            phone: u.phone,
            verificationStatus: u.verification_status
        }));
    },

    getUserById: async (userId: string): Promise<User | null> => {
        try {
            const response = await api.get(`/users/${userId}`);
            const u = response.data;
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatarUrl: u.avatar_url,
                phone: u.phone,
                verificationStatus: u.verification_status
            } as User;
        } catch (e) {
            console.error('Failed to fetch user:', e);
            return null;
        }
    }
};
