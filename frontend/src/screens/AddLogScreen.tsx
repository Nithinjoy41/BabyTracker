import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { createLog } from '../api/logs';

export default function AddLogScreen({ route, navigation }: any) {
  const presetType = route.params?.type || 'Food';
  const [type, setType] = useState<string>(presetType);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createLog({
        type,
        timestamp: new Date().toISOString(),
        durationMinutes: type === 'Sleep' && duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Log entry added!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {['Food', 'Nappy', 'Sleep'].map((t) => (
          <TouchableOpacity key={t} style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            onPress={() => setType(t)}>
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'Sleep' && (
        <>
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput style={styles.input} placeholder="e.g. 60" value={duration} onChangeText={setDuration}
            keyboardType="numeric" placeholderTextColor="#999" />
        </>
      )}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Any notes..." value={notes}
        onChangeText={setNotes} multiline placeholderTextColor="#999" />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Entry'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 2, borderColor: '#E0DFFF' },
  typeBtnActive: { borderColor: '#6C63FF', backgroundColor: '#F0EEFF' },
  typeText: { fontWeight: '600', color: '#888' },
  typeTextActive: { color: '#6C63FF' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0DFFF' },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
