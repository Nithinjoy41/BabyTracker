import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, FlatList
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getBirthdayPlan, updateBirthdayPlan, addBirthdayGuest, updateGuestStatus, deleteGuest } from '../api/birthdays';
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
    if (!childId || !plan) return;
    
    // Merge updates with current plan to send a full DTO
    const updatedPlan = {
      theme: updates.theme !== undefined ? updates.theme : plan.theme,
      location: updates.location !== undefined ? updates.location : plan.location,
      notes: updates.notes !== undefined ? updates.notes : plan.notes,
      date: updates.date !== undefined ? updates.date : plan.date,
    };

    setSaving(true);
    try {
      const { data } = await updateBirthdayPlan(childId, updatedPlan);
      setPlan(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not update plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.trim() || !childId) return;
    setSaving(true);
    try {
      await addBirthdayGuest(childId, newGuest.trim());
      setNewGuest('');
      fetchPlan();
    } catch (e) {
      Alert.alert('Error', 'Could not add guest.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (guestId: string, status: string) => {
    try {
      await updateGuestStatus(guestId, status);
      fetchPlan();
    } catch (e) {
      Alert.alert('Error', 'Could not update guest status.');
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

  const confirmedCount = plan?.guests.filter(g => g.status === 'Confirmed').length || 0;
  const totalGuests = plan?.guests.length || 0;

  const renderGuestItem = (guest: BirthdayGuest) => (
    <View key={guest.id} style={styles.guestItem}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.guestName, guest.status === 'Confirmed' && styles.confirmedText]}>
          {guest.name}
        </Text>
      </View>
      
      <View style={styles.statusButtons}>
        <TouchableOpacity 
          onPress={() => handleUpdateStatus(guest.id, 'Confirmed')}
          style={[styles.statusBtn, guest.status === 'Confirmed' && styles.statusBtnConfirmed]}
        >
          <Text style={styles.statusEmoji}>✅</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleUpdateStatus(guest.id, 'Maybe')}
          style={[styles.statusBtn, guest.status === 'Maybe' && styles.statusBtnMaybe]}
        >
          <Text style={styles.statusEmoji}>❓</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleUpdateStatus(guest.id, 'Pending')}
          style={[styles.statusBtn, guest.status === 'Pending' && styles.statusBtnPending]}
        >
          <Text style={styles.statusEmoji}>⏳</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleDeleteGuest(guest.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const confirmedGuests = plan?.guests.filter(g => g.status === 'Confirmed') || [];
  const maybeGuests = plan?.guests.filter(g => g.status === 'Maybe') || [];
  const pendingGuests = plan?.guests.filter(g => g.status === 'Pending' || g.status === 'Declined') || [];

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
          <Text style={styles.label}>Date 📅</Text>
          <TextInput
            style={styles.input}
            value={plan?.date ? new Date(plan.date).toISOString().split('T')[0] : ''}
            onChangeText={(text) => setPlan(p => p ? { ...p, date: text } : null)}
            onBlur={() => plan && handleUpdatePlan({ date: plan.date })}
            placeholder="YYYY-MM-DD"
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

        {saving && <Text style={styles.savingTag}>Saving changes...</Text>}
      </View>

      <View style={[styles.card, styles.guestCard]}>
        <View style={styles.row}>
          <Text style={styles.title}>Guest List 👥</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.badge}>{confirmedCount} / {totalGuests} Confirmed</Text>
            {saving && <Text style={styles.miniSaving}>Updating...</Text>}
          </View>
        </View>

        <View style={styles.addGuestRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={newGuest}
            onChangeText={setNewGuest}
            onSubmitEditing={handleAddGuest}
            placeholder="Add new guest name..."
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddGuest} disabled={saving}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {confirmedGuests.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Confirmed ({confirmedGuests.length})</Text>
          </View>
        )}
        {confirmedGuests.map(renderGuestItem)}

        {maybeGuests.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>❓ Maybe ({maybeGuests.length})</Text>
          </View>
        )}
        {maybeGuests.map(renderGuestItem)}

        {pendingGuests.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ Pending ({pendingGuests.length})</Text>
          </View>
        )}
        {pendingGuests.map(renderGuestItem)}

        {totalGuests === 0 && (
          <Text style={styles.emptyText}>No guests added yet. Type a name above to start your list!</Text>
        )}
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
  guestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  statusButtons: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  statusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  statusBtnConfirmed: { backgroundColor: '#E1F5FE', borderColor: '#03A9F4' },
  statusBtnMaybe: { backgroundColor: '#FFF9C4', borderColor: '#FBC02D' },
  statusBtnPending: { backgroundColor: '#F5F5F5', borderColor: '#CCC' },
  statusEmoji: { fontSize: 14 },
  guestName: { fontSize: 16, color: '#333', fontWeight: '500' },
  confirmedText: { color: '#03A9F4', fontWeight: '700' },
  deleteBtn: { padding: 4, marginLeft: 4 },
  deleteIcon: { fontSize: 16 },
  sectionHeader: { marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#FFEBEB', paddingBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FF6B6B', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20, fontStyle: 'italic' },
  savingTag: { fontSize: 12, color: '#FF6B6B', fontStyle: 'italic', marginTop: 10, textAlign: 'right' },
  miniSaving: { fontSize: 10, color: '#FF6B6B', fontStyle: 'italic' },
});
