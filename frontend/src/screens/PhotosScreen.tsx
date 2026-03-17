import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl, Dimensions, SectionList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { getPhotos, uploadPhoto, deletePhoto } from '../api/photos';
import { useAuth } from '../contexts/AuthContext';
import { Photo } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;
const COLS = 3;
const IMAGE_SIZE = (SCREEN_WIDTH - GAP * (COLS + 1)) / COLS;

interface PhotoSection {
  title: string;
  data: Photo[][];
}

function groupPhotosByMonth(photos: Photo[]): PhotoSection[] {
  const groups: Record<string, Photo[]> = {};
  photos.forEach(p => {
    const d = new Date(p.uploadedAt);
    const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return Object.entries(groups).map(([title, items]) => {
    const rows: Photo[][] = [];
    for (let i = 0; i < items.length; i += COLS) {
      rows.push(items.slice(i, i + COLS));
    }
    return { title, data: rows };
  });
}

export default function PhotosScreen({ navigation }: any) {
  const { selectedChildId } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    if (!selectedChildId) return;
    try {
      const { data } = await getPhotos(selectedChildId, 1, 200);
      setPhotos(data.items);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchPhotos(); }, [selectedChildId]));

  const onRefresh = async () => { setRefreshing(true); await fetchPhotos(); setRefreshing(false); };

  const handleUpload = async () => {
    if (!selectedChildId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    try {
      await uploadPhoto(selectedChildId, result.assets[0].uri);
      fetchPhotos();
    } catch (e: any) {
      Alert.alert('Upload Failed', e.response?.data?.error || 'Something went wrong.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this photo?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePhoto(id); fetchPhotos(); } },
    ]);
  };

  const sections = groupPhotosByMonth(photos);

  const openViewer = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    navigation.navigate('PhotoViewer', { photos, initialIndex: index });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadBtnText}>📷 Upload Photo</Text>
      </TouchableOpacity>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>No photos yet. Upload your first!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `row-${index}`}
          stickySectionHeadersEnabled={true}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.imageWrapper}
                  onPress={() => openViewer(photo)}
                  onLongPress={() => handleDelete(photo.id)}
                >
                  <Image source={{ uri: photo.url }} style={styles.image} />
                </TouchableOpacity>
              ))}
              {/* Fill empty spaces in last row */}
              {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.imagePlaceholder} />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  uploadBtn: { backgroundColor: '#6C63FF', margin: 8, borderRadius: 12, padding: 14, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHeader: { backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 12, paddingVertical: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', paddingHorizontal: GAP / 2 },
  imageWrapper: { margin: GAP / 2 },
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  imagePlaceholder: { width: IMAGE_SIZE, height: IMAGE_SIZE, margin: GAP / 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center' },
});
