import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, StatusBar, Alert } from 'react-native';
import { Photo } from '../types';
import { deletePhoto } from '../api/photos';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoViewerScreen({ route, navigation }: any) {
  const { photos, initialIndex } = route.params as { photos: Photo[]; initialIndex: number };
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const currentPhoto = photos[currentIndex];

  const handleDelete = () => {
    Alert.alert('Delete Photo', 'Remove this memory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePhoto(currentPhoto.id);
          navigation.goBack(); // Close viewer
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.error || 'Failed to delete photo.');
        }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Swipeable image */}
      <FlatList
        ref={flatListRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />

      {/* Photo info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoDate}>
              {new Date(currentPhoto.uploadedAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
            <Text style={styles.infoBy}>Uploaded by {currentPhoto.uploadedBy}</Text>
            {currentPhoto.notes && <Text style={styles.infoNotes}>{currentPhoto.notes}</Text>}
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteEmoji}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  infoBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, paddingBottom: 40 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoDate: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoBy: { color: '#ccc', fontSize: 13, marginTop: 4 },
  infoNotes: { color: '#ddd', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  deleteBtn: { padding: 10, marginLeft: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  deleteEmoji: { fontSize: 20 },
  counter: { color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
