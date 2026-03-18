import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, FlatList
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getBirthdayPlan, updateBirthdayPlan, addBirthdayGuest, updateGuest, deleteGuest } from '../api/birthdays';
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

  const handleUpdateGuest = async (guestId: string, updates: Partial<BirthdayGuest>) => {
    const guest = plan?.guests.find(g => g.id === guestId);
    if (!guest) return;

    const finalStatus = updates.status !== undefined ? updates.status : guest.status;
    const finalAdults = updates.additionalAdults !== undefined ? updates.additionalAdults : guest.additionalAdults;
    const finalChildren = updates.additionalChildren !== undefined ? updates.additionalChildren : guest.additionalChildren;

    try {
      await updateGuest(guestId, finalStatus, finalAdults, finalChildren);
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

  const confirmedGuestsList = plan?.guests.filter(g => g.status === 'Confirmed') || [];
  const maybeGuestsList = plan?.guests.filter(g => g.status === 'Maybe') || [];
  const pendingGuestsList = plan?.guests.filter(g => g.status === 'Pending') || [];

  const totalMainGuests = plan?.guests.length || 0;
  const confirmedAdults = confirmedGuestsList.reduce((acc, g) => acc + 1 + g.additionalAdults, 0);
  const confirmedChildren = confirmedGuestsList.reduce((acc, g) => acc + g.additionalChildren, 0);
  const totalConfirmed = confirmedAdults + confirmedChildren;

  const maybeAdults = maybeGuestsList.reduce((acc, g) => acc + 1 + g.additionalAdults, 0);
  const maybeChildren = maybeGuestsList.reduce((acc, g) => acc + g.additionalChildren, 0);
  const totalMaybe = maybeAdults + maybeChildren;

  // Suggestions logic
  const chairsNeeded = totalConfirmed;
  const platesNeeded = Math.ceil((confirmedAdults * 1.5) + (confirmedChildren * 1.0));

  const renderGuestItem = (guest: BirthdayGuest) => (
    <View key={guest.id} style={styles.guestItem}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.guestName, guest.status === 'Confirmed' && styles.confirmedText]}>
          {guest.name}
        </Text>
        <View style={styles.subGuestRow}>
          <Text style={styles.subGuestLabel}>Adults:</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: Math.max(0, guest.additionalAdults - 1) })}>
            <Text style={styles.counterBtn}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>{1 + guest.additionalAdults}</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: guest.additionalAdults + 1 })}>
            <Text style={styles.counterBtn}>+</Text>
          </TouchableOpacity>

          <Text style={[styles.subGuestLabel, { marginLeft: 10 }]}>Children:</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: Math.max(0, guest.additionalChildren - 1) })}>
            <Text style={styles.counterBtn}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>{guest.additionalChildren}</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: guest.additionalChildren + 1 })}>
            <Text style={styles.counterBtn}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statusButtons}>
        <TouchableOpacity 
          onPress={() => handleUpdateGuest(guest.id, { status: 'Confirmed' })}
          style={[styles.statusBtn, guest.status === 'Confirmed' && styles.statusBtnConfirmed]}
        >
          <Text style={styles.statusEmoji}>✅</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleUpdateGuest(guest.id, { status: 'Maybe' })}
          style={[styles.statusBtn, guest.status === 'Maybe' && styles.statusBtnMaybe]}
        >
          <Text style={styles.statusEmoji}>❓</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleUpdateGuest(guest.id, { status: 'Pending' })}
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

  return (
    <ScrollView style={styles.container}>
      {/* ── Planning Summary ✨ ── */}
      <View style={[styles.card, styles.statsCard]}>
        <Text style={styles.sectionTitle}>Planning Summary ✨</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalConfirmed}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
            <Text style={styles.statSub}>({confirmedAdults}A, {confirmedChildren}C)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMaybe}</Text>
            <Text style={styles.statLabel}>Maybe</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{chairsNeeded}</Text>
            <Text style={styles.statLabel}>Chairs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{platesNeeded}</Text>
            <Text style={styles.statLabel}>Plates/Food</Text>
          </View>
        </View>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>💡 Suggestion: Order approx. {platesNeeded} plates for {totalConfirmed} confirmed guests.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>Party for {child?.name} 🥳</Text>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={() => plan && handleUpdatePlan({})}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.badge}>{totalConfirmed} Confirmed</Text>
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

        {confirmedGuestsList.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Confirmed ({confirmedGuestsList.length})</Text>
          </View>
        )}
        {confirmedGuestsList.map(renderGuestItem)}

        {maybeGuestsList.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>❓ Maybe ({maybeGuestsList.length})</Text>
          </View>
        )}
        {maybeGuestsList.map(renderGuestItem)}

        {pendingGuestsList.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ Pending ({pendingGuestsList.length})</Text>
          </View>
        )}
        {pendingGuestsList.map(renderGuestItem)}

        {totalMainGuests === 0 && (
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
  saveBtn: { backgroundColor: '#4ECDC4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addGuestRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  addBtn: { backgroundColor: '#FF6B6B', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  statsCard: { backgroundColor: '#6C63FF22', borderBottomWidth: 4, borderBottomColor: '#6C63FF' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statItem: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#6C63FF22' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#6C63FF' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginTop: 2 },
  statSub: { fontSize: 10, color: '#aaa' },
  tipBox: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#4ECDC4' },
  tipText: { fontSize: 13, color: '#555', fontStyle: 'italic' },
  subGuestRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  subGuestLabel: { fontSize: 11, color: '#888', marginRight: 6 },
  counterBtn: { fontSize: 18, color: '#FF6B6B', fontWeight: '800', paddingHorizontal: 8 },
  counterText: { fontSize: 14, fontWeight: '700', color: '#333', minWidth: 20, textAlign: 'center' },
  guestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
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
