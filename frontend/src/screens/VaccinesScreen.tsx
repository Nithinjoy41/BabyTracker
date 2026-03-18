import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getVaccines, createVaccine, deleteVaccine } from '../api/vaccines';
import { useAuth } from '../contexts/AuthContext';
import { Vaccine } from '../types';

export default function VaccinesScreen() {
  const { selectedChildId } = useAuth();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!selectedChildId) return;
    try {
      const { data } = await getVaccines(selectedChildId, 1, 50);
      setVaccines(data.items);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetch(); }, [selectedChildId]));

  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  const handleAdd = async () => {
    if (!name || !selectedChildId) return Alert.alert('Error', 'Name is required.');
    setLoading(true);
    try {
      await createVaccine(selectedChildId, { name, date: new Date().toISOString(), notes: notes || undefined });
      setShowAdd(false); setName(''); setNotes('');
      fetch();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed.');
    } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this vaccine record?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteVaccine(id); fetch(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Text style={styles.addBtnText}>＋ Add Vaccine</Text>
      </TouchableOpacity>

      <FlatList
        data={vaccines}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.emoji}>💉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              <Text style={styles.meta}>{item.createdBy} · {new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteEmoji}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vaccines recorded.</Text>}
      />

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Vaccine</Text>
            <TextInput style={styles.input} placeholder="Vaccine Name" value={name} onChangeText={setName} placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Notes (optional)" value={notes} onChangeText={setNotes} placeholderTextColor="#999" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 12 },
  addBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  notes: { fontSize: 13, color: '#888', marginTop: 2 },
  meta: { fontSize: 11, color: '#aaa', marginTop: 4 },
  deleteBtn: { padding: 8, marginLeft: 8 },
  deleteEmoji: { fontSize: 20, opacity: 0.6 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#F5F5FF', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0DFFF' },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { textAlign: 'center', color: '#888', marginTop: 12, fontSize: 14 },
});
