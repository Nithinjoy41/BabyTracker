import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { Photo } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoViewerScreen({ route, navigation }: any) {
  const { photos, initialIndex } = route.params as { photos: Photo[]; initialIndex: number };
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const currentPhoto = photos[currentIndex];

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
        <Text style={styles.infoDate}>
          {new Date(currentPhoto.uploadedAt).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </Text>
        <Text style={styles.infoBy}>Uploaded by {currentPhoto.uploadedBy}</Text>
        {currentPhoto.notes && <Text style={styles.infoNotes}>{currentPhoto.notes}</Text>}
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
  infoDate: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoBy: { color: '#ccc', fontSize: 13, marginTop: 4 },
  infoNotes: { color: '#ddd', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  counter: { color: '#888', fontSize: 12, marginTop: 8 },
});
