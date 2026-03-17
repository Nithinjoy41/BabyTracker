import { Platform } from 'react-native';
import client from './client';
import { Photo, PagedResult } from '../types';

export const getPhotos = (page = 1, pageSize = 20) =>
  client.get<PagedResult<Photo>>('/photos', { params: { page, pageSize } });

export const uploadPhoto = async (uri: string, notes?: string) => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);
  }

  if (notes) formData.append('notes', notes);

  return client.post<Photo>('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deletePhoto = (id: string) => client.delete(`/photos/${id}`);
