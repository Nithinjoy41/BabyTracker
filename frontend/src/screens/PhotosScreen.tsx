import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { getPhotos, uploadPhoto, deletePhoto } from '../api/photos';
import { Photo } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3;

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await getPhotos(1, 50);
      setPhotos(data.items);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetch(); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    try {
      await uploadPhoto(result.assets[0].uri);
      fetch();
    } catch (e: any) {
      Alert.alert('Upload Failed', e.response?.data?.error || 'Something went wrong.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this photo?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePhoto(id); fetch(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadBtnText}>📷 Upload Photo</Text>
      </TouchableOpacity>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.imageWrapper} onLongPress={() => handleDelete(item.id)}>
            <Image source={{ uri: item.url }} style={styles.image} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No photos yet. Upload your first!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 12 },
  uploadBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imageWrapper: { margin: 4, borderRadius: 10, overflow: 'hidden' },
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 10 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
});
