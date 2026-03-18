import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function BabyPacman({ navigation, route }: any) {
  const { babyName } = route.params || { babyName: 'Baby' };
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Text style={styles.title}>{babyName}'s Adventure 🍎</Text>
      <Text style={styles.subtitle}>Coming soon! Eat the healthy snacks to grow big and strong!</Text>
      
      <View style={styles.placeholderGame}>
        <Text style={styles.gameIcon}>👶</Text>
        <Text style={styles.foodIcon}>🥦</Text>
        <Text style={styles.foodIcon}>🍎</Text>
        <Text style={styles.foodIcon}>🍌</Text>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Exit Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#AAA', textAlign: 'center', marginBottom: 40 },
  placeholderGame: { width: '100%', height: 300, borderWidth: 2, borderColor: '#333', borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 20 },
  gameIcon: { fontSize: 64 },
  foodIcon: { fontSize: 32 },
  backBtn: { marginTop: 50, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, backgroundColor: '#6C63FF' },
  backText: { color: '#FFF', fontWeight: '800', fontSize: 18 }
});
