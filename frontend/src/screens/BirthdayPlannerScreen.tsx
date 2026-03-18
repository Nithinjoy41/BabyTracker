import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getBirthdayPlan, updateBirthdayPlan, addBirthdayGuest, updateGuest, deleteGuest } from '../api/birthdays';
import { BirthdayPlan, BirthdayGuest } from '../types';

export default function BirthdayPlannerScreen({ route }: any) {
  const { childId } = route.params || {};
  const { children } = useAuth();
  const { theme, isDark } = useTheme();
  const child = children.find(c => c.id === childId);

  const [plan, setPlan] = useState<BirthdayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newGuest, setNewGuest] = useState('');

  // Local state for date to prevent jumping while typing
  const [dateText, setDateText] = useState('');

  const fetchPlan = async () => {
    if (!childId) return;
    try {
      const { data } = await getBirthdayPlan(childId);
      setPlan(data);
      if (data.date) {
        setDateText(new Date(data.date).toISOString().split('T')[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not fetch birthday plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, [childId]);

  const handleUpdatePlan = async (updates: Partial<BirthdayPlan>) => {
    if (!childId || !plan) return;
    
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
    
    // Sub-guests names
    let finalSubGuests = guest.additionalNames || '';
    if (updates.additionalNames !== undefined) {
      finalSubGuests = updates.additionalNames;
    }

    try {
      await updateGuest(guestId, finalStatus, finalAdults, finalChildren, finalSubGuests);
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

  const stats = useMemo(() => {
    if (!plan) return { confirmed: 0, maybe: 0, chairs: 0, food: 0, adults: 0, children: 0 };
    
    const confirmedList = plan.guests.filter(g => g.status === 'Confirmed');
    const maybeList = plan.guests.filter(g => g.status === 'Maybe');

    const confirmedAdults = confirmedList.reduce((acc, g) => acc + 1 + g.additionalAdults, 0);
    const confirmedChildren = confirmedList.reduce((acc, g) => acc + g.additionalChildren, 0);
    
    const maybeTotal = maybeList.reduce((acc, g) => acc + 1 + g.additionalAdults + g.additionalChildren, 0);

    return {
      confirmed: confirmedAdults + confirmedChildren,
      maybe: maybeTotal,
      chairs: confirmedAdults + confirmedChildren,
      food: Math.ceil((confirmedAdults * 1.5) + (confirmedChildren * 1.0)),
      adults: confirmedAdults,
      children: confirmedChildren
    };
  }, [plan]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderGuestItem = (guest: BirthdayGuest) => (
    <View key={guest.id} style={[styles.guestItem, { borderBottomColor: theme.colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.guestName, { color: theme.colors.text }, guest.status === 'Confirmed' && styles.confirmedText]}>
          {guest.name}
        </Text>
        
        <View style={styles.subGuestRow}>
          <Text style={styles.subGuestLabel}>Adults:</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: Math.max(0, guest.additionalAdults - 1) })}>
            <Text style={styles.counterBtn}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterText, { color: theme.colors.text }]}>{1 + guest.additionalAdults}</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: guest.additionalAdults + 1 })}>
            <Text style={styles.counterBtn}>+</Text>
          </TouchableOpacity>

          <Text style={[styles.subGuestLabel, { marginLeft: 10 }]}>Children:</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: Math.max(0, guest.additionalChildren - 1) })}>
            <Text style={styles.counterBtn}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterText, { color: theme.colors.text }]}>{guest.additionalChildren}</Text>
          <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: guest.additionalChildren + 1 })}>
            <Text style={styles.counterBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.subNamesInput}
          placeholder="Other names (comma separated)"
          placeholderTextColor="#aaa"
          defaultValue={guest.additionalNames}
          onEndEditing={(e) => handleUpdateGuest(guest.id, { additionalNames: e.nativeEvent.text })}
        />
      </View>
      
      <View style={styles.statusButtons}>
        {['Confirmed', 'Maybe', 'Pending'].map((status) => (
          <TouchableOpacity 
            key={status}
            onPress={() => handleUpdateGuest(guest.id, { status: status as any })}
            style={[
              styles.statusBtn, 
              guest.status === status && { backgroundColor: theme.colors.primary + '33', borderColor: theme.colors.primary }
            ]}
          >
            <Text style={styles.statusEmoji}>{status === 'Confirmed' ? '✅' : status === 'Maybe' ? '❓' : '⏳'}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          onPress={() => {
            Alert.alert('Remove Guest', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => handleDeleteGuest(guest.id) }
            ]);
          }} 
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* ── Immersive Planning Summary ✨ ── */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.primary + '22', borderBottomColor: theme.colors.primary }]}>
          <View style={styles.statsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Planning Summary ✨</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatBox value={stats.confirmed} label="Confirmed" sub={`(${stats.adults}A, ${stats.children}C)`} theme={theme} />
            <StatBox value={stats.maybe} label="Maybe" theme={theme} />
            <StatBox value={stats.chairs} label="Chairs" theme={theme} />
            <StatBox value={stats.food} label="Food Plates" color={theme.colors.secondary} theme={theme} />
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>💡 Suggestion: Aim for {stats.food} plates to cover everyone including buffers.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Party for {child?.name} 🥳</Text>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.colors.secondary }, saving && styles.saveBtnDisabled]} 
              onPress={() => handleUpdatePlan({ date: dateText })}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Theme 🎨</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={plan?.theme}
              onChangeText={(text) => setPlan(p => p ? { ...p, theme: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ theme: plan.theme })}
              placeholder="e.g. Space Adventure"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Location 📍</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={plan?.location}
              onChangeText={(text) => setPlan(p => p ? { ...p, location: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ location: plan.location })}
              placeholder="e.g. Local Park"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date 📅</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={dateText}
              onChangeText={setDateText}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes 📝</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
              multiline
              value={plan?.notes}
              onChangeText={(text) => setPlan(p => p ? { ...p, notes: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ notes: plan.notes })}
              placeholder="Cake details, ideas..."
            />
          </View>
        </View>

        <View style={[styles.card, styles.guestCard, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary }]}>
          <Text style={[styles.title, { color: theme.colors.text, marginBottom: 16 }]}>Guest List 👥</Text>
          
          <View style={styles.addGuestRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={newGuest}
              onChangeText={setNewGuest}
              placeholder="Add name..."
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddGuest}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {['Confirmed', 'Maybe', 'Pending'].map(status => {
            const list = plan?.guests.filter(g => g.status === status) || [];
            if (list.length === 0) return null;
            return (
              <View key={status}>
                <View style={[styles.sectionHeader, { borderBottomColor: theme.colors.primary + '44' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{status} ({list.length})</Text>
                </View>
                {list.map(renderGuestItem)}
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatBox({ value, label, sub, color, theme }: any) {
  return (
    <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.statValue, { color: color || theme.colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 20, borderRadius: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  statsCard: { padding: 20, borderRadius: 28, marginBottom: 20, elevation: 8 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, opacity: 0.6, marginTop: 4, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 16, padding: 14, fontSize: 16, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { backgroundColor: '#FFEBEB', color: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addGuestRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  addBtn: { borderRadius: 14, paddingHorizontal: 24, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { flex: 1, minWidth: '45%', borderRadius: 18, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginTop: 4 },
  statSub: { fontSize: 9, color: '#aaa' },
  tipBox: { backgroundColor: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 16, marginTop: 16 },
  tipText: { fontSize: 12, color: '#444', fontStyle: 'italic', fontWeight: '500' },
  guestCard: { borderLeftWidth: 8 },
  sectionHeader: { marginTop: 20, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase' },
  guestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  subGuestRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, opacity: 0.8 },
  subGuestLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginRight: 4 },
  counterBtn: { fontSize: 22, color: '#6C63FF', fontWeight: '700', paddingHorizontal: 12 },
  counterText: { fontSize: 15, fontWeight: '800', minWidth: 25, textAlign: 'center' },
  subNamesInput: { fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic', paddingVertical: 4 },
  guestName: { fontSize: 17, fontWeight: '700' },
  confirmedText: { color: '#4CAF50' },
  statusButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  statusEmoji: { fontSize: 16 },
  deleteBtn: { padding: 6, marginLeft: 4 },
  deleteIcon: { fontSize: 18 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 30, fontStyle: 'italic' },
  savingTag: { fontSize: 12, color: '#FF6B6B', fontStyle: 'italic', marginTop: 10, textAlign: 'right' },
  miniSaving: { fontSize: 10, color: '#FF6B6B', fontStyle: 'italic' },
});
