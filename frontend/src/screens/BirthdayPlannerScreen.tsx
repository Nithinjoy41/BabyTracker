import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, FlatList
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getBirthdayPlan, updateBirthdayPlan, addBirthdayGuest, toggleGuest, deleteGuest } from '../api/birthdays';
import { BirthdayPlan, BirthdayGuest } from '../types';

export default function BirthdayPlannerScreen({ route }: any) {
  const { childId } = route.params || {};
  const { children } = useAuth();
  const child = children.find(c => c.id === childId);

  const [plan, setPlan] = useState<BirthdayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newGuest, setNewGuest] = useState('');

  const fetchPlan = async () => {
    if (!childId) return;
    try {
      const { data } = await getBirthdayPlan(childId);
      setPlan(data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch birthday plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, [childId]);

  const handleUpdatePlan = async (updates: Partial<BirthdayPlan>) => {
    if (!childId) return;
    try {
      const { data } = await updateBirthdayPlan(childId, updates);
      setPlan(data);
    } catch (e) {
      Alert.alert('Error', 'Could not update plan.');
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.trim() || !childId) return;
    try {
      await addBirthdayGuest(childId, newGuest.trim());
      setNewGuest('');
      fetchPlan();
    } catch (e) {
      Alert.alert('Error', 'Could not add guest.');
    }
  };

  const handleToggleGuest = async (guestId: string) => {
    try {
      await toggleGuest(guestId);
      fetchPlan();
    } catch (e) {
      Alert.alert('Error', 'Could not update guest.');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      await deleteGuest(guestId);
      fetchPlan();
    } catch (e) {
      Alert.alert('Error', 'Could not remove guest.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const confirmedCount = plan?.guests.filter(g => g.isConfirmed).length || 0;
  const totalGuests = plan?.guests.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Party for {child?.name} 🥳</Text>
        <Text style={styles.subtitle}>Let's make it a day to remember!</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Theme 🎨</Text>
          <TextInput
            style={styles.input}
            value={plan?.theme}
            onChangeText={(text) => setPlan(p => p ? { ...p, theme: text } : null)}
            onBlur={() => plan && handleUpdatePlan({ theme: plan.theme })}
            placeholder="e.g. Space Adventure, Jungle"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location 📍</Text>
          <TextInput
            style={styles.input}
            value={plan?.location}
            onChangeText={(text) => setPlan(p => p ? { ...p, location: text } : null)}
            onBlur={() => plan && handleUpdatePlan({ location: plan.location })}
            placeholder="e.g. Home, Local Park"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes 📝</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={plan?.notes}
            onChangeText={(text) => setPlan(p => p ? { ...p, notes: text } : null)}
            onBlur={() => plan && handleUpdatePlan({ notes: plan.notes })}
            placeholder="Cake details, decoration ideas..."
          />
        </View>
      </View>

      <View style={[styles.card, styles.guestCard]}>
        <View style={styles.row}>
          <Text style={styles.title}>Guest List 👥</Text>
          <Text style={styles.badge}>{confirmedCount} / {totalGuests} Confirmed</Text>
        </View>

        <View style={styles.addGuestRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={newGuest}
            onChangeText={setNewGuest}
            placeholder="Add new guest name..."
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddGuest}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {plan?.guests.map((guest) => (
          <View key={guest.id} style={styles.guestItem}>
            <TouchableOpacity 
              style={[styles.check, guest.isConfirmed && styles.checked]} 
              onPress={() => handleToggleGuest(guest.id)}
            >
              {guest.isConfirmed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.guestName, guest.isConfirmed && styles.strikethrough]}>
              {guest.name}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteGuest(guest.id)}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF2F2', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#FFEBEB', borderRadius: 12, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#FFF9F9' },
  textArea: { height: 80, textAlignVertical: 'top' },
  guestCard: { borderLeftWidth: 6, borderLeftColor: '#FF6B6B' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { backgroundColor: '#FFEBEB', color: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  addGuestRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  addBtn: { backgroundColor: '#FF6B6B', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  guestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FF6B6B', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#FF6B6B' },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: '900' },
  guestName: { flex: 1, fontSize: 16, color: '#333' },
  strikethrough: { textDecorationLine: 'line-through', color: '#aaa' },
  deleteIcon: { fontSize: 18 },
});
