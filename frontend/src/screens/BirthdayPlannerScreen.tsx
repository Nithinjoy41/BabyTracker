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
    if (!childId) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
    
    // Optimistic Update
    const updatedPlanState = { ...plan, ...updates };
    
    const apiPayload = {
      theme: updates.theme !== undefined ? updates.theme : plan.theme,
      location: updates.location !== undefined ? updates.location : plan.location,
      notes: updates.notes !== undefined ? updates.notes : plan.notes,
      foodAndDrinks: updates.foodAndDrinks !== undefined ? updates.foodAndDrinks : plan.foodAndDrinks,
      aiSummary: updates.aiSummary !== undefined ? updates.aiSummary : plan.aiSummary,
      date: updates.date !== undefined ? updates.date : plan.date,
    };

    setPlan(updatedPlanState);
    setSaving(true);
    try {
      const { data } = await updateBirthdayPlan(childId, apiPayload);
      setPlan(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not update plan.');
      fetchPlan();
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = () => {
    if (!plan) return;
    const themeStr = plan.theme || 'unthemed';
    const locStr = plan.location || 'somewhere special';
    const summary = `Get ready for ${child?.name}'s epic ${themeStr} celebration! 🎈 We're hosting ${stats.confirmed} friends at ${locStr} for a day of magic and cake. It's going to be a blast! ✨`;
    handleUpdatePlan({ aiSummary: summary });
  };

  const handleAddGuest = async () => {
    if (!newGuest.trim() || !childId) return;
    setSaving(true);
    try {
      const { data } = await addBirthdayGuest(childId, newGuest.trim());
      setNewGuest('');
      // Update local state with the new guest returned from API
      if (plan) {
        setPlan({
          ...plan,
          guests: [...plan.guests, data]
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not add guest.');
      fetchPlan(); // Rollback/Sync on error
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGuest = async (guestId: string, updates: Partial<BirthdayGuest>) => {
    if (!plan) return;
    const guestIndex = plan.guests.findIndex(g => g.id === guestId);
    if (guestIndex === -1) return;

    const guest = plan.guests[guestIndex];
    const finalStatus = updates.status !== undefined ? updates.status : guest.status;
    const finalAdults = updates.additionalAdults !== undefined ? updates.additionalAdults : guest.additionalAdults;
    const finalChildren = updates.additionalChildren !== undefined ? updates.additionalChildren : guest.additionalChildren;
    const finalSubGuests = updates.subGuests !== undefined ? updates.subGuests : (guest.subGuests || '');

    // Optimistic Update
    const updatedGuests = [...plan.guests];
    updatedGuests[guestIndex] = { 
      ...guest, 
      status: finalStatus, 
      additionalAdults: finalAdults, 
      additionalChildren: finalChildren,
      subGuests: finalSubGuests
    };
    setPlan({ ...plan, guests: updatedGuests });

    try {
      await updateGuest(guestId, finalStatus, finalAdults, finalChildren, finalSubGuests);
      // No need to fetchPlan() on success as we updated locally
    } catch (e) {
      Alert.alert('Error', 'Could not update guest.');
      fetchPlan(); // Re-sync on error
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!plan) return;
    
    // Optimistic delete
    const updatedGuests = plan.guests.filter(g => g.id !== guestId);
    setPlan({ ...plan, guests: updatedGuests });

    try {
      await deleteGuest(guestId);
    } catch (e) {
      Alert.alert('Error', 'Could not remove guest.');
      fetchPlan(); // Rollback on error
    }
  };


  const stats = useMemo(() => {
    if (!plan) return { confirmed: 0, maybe: 0, chairs: 0, food: 0, adults: 0, children: 0 };
    
    const confirmedList = plan.guests.filter(g => g.status === 'Confirmed');
    const maybeList = plan.guests.filter(g => g.status === 'Maybe');

    const confirmedAdults = confirmedList.reduce((acc, g) => acc + 1 + g.additionalAdults, 0);
    const confirmedChildren = confirmedList.reduce((acc, g) => acc + g.additionalChildren, 0);
    
    const maybeAdults = maybeList.reduce((acc, g) => acc + 1 + g.additionalAdults, 0);
    const maybeChildren = maybeList.reduce((acc, g) => acc + g.additionalChildren, 0);

    // Food calculation: 1 plate per adult, 0.5 per child, plus 5 buffer
    // Example: 30 adults + 10 children = 35 + 5 = 40 plates
    const baseFood = confirmedAdults + (confirmedChildren * 0.5);
    const recommendedFood = Math.ceil(baseFood + 5);

    return {
      confirmed: confirmedAdults + confirmedChildren,
      maybe: maybeAdults + maybeChildren,
      chairs: confirmedAdults + confirmedChildren, // One chair per soul
      food: recommendedFood,
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
    <View key={guest.id} style={[styles.guestCardItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.guestHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.guestName, { color: theme.colors.text }, guest.status === 'Confirmed' && styles.confirmedText]}>
            {guest.name}
          </Text>
          <View style={styles.statusBadge}>
             <Text style={styles.statusEmoji}>{guest.status === 'Confirmed' ? '✅ Confirmed' : guest.status === 'Maybe' ? '❓ Maybe' : '⏳ Pending'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert('Remove Guest', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => handleDeleteGuest(guest.id) }
            ]);
          }} 
          style={styles.smallDeleteBtn}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.guestActions}>
        <View style={styles.counterGroup}>
          <Text style={[styles.subGuestLabel, { color: theme.colors.textSecondary }]}>Adults</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: Math.max(0, guest.additionalAdults - 1) })} style={styles.circleBtn}>
              <Text style={styles.counterBtn}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.counterText, { color: theme.colors.text }]}>{1 + guest.additionalAdults}</Text>
            <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalAdults: guest.additionalAdults + 1 })} style={styles.circleBtn}>
              <Text style={styles.counterBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.counterGroup}>
          <Text style={[styles.subGuestLabel, { color: theme.colors.textSecondary }]}>Children</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: Math.max(0, guest.additionalChildren - 1) })} style={styles.circleBtn}>
              <Text style={styles.counterBtn}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.counterText, { color: theme.colors.text }]}>{guest.additionalChildren}</Text>
            <TouchableOpacity onPress={() => handleUpdateGuest(guest.id, { additionalChildren: guest.additionalChildren + 1 })} style={styles.circleBtn}>
              <Text style={styles.counterBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {(guest.additionalAdults > 0 || guest.additionalChildren > 0 || guest.subGuests) && (
        <TextInput
          style={[styles.subNamesInput, { backgroundColor: theme.colors.background + '55', color: theme.colors.text }]}
          placeholder="Enter names for extra guests..."
          placeholderTextColor="#aaa"
          defaultValue={guest.subGuests}
          onEndEditing={(e) => handleUpdateGuest(guest.id, { subGuests: e.nativeEvent.text })}
        />
      )}

      <View style={styles.statusPicker}>
        {['Confirmed', 'Maybe', 'Pending'].map((status) => (
          <TouchableOpacity 
            key={status}
            onPress={() => handleUpdateGuest(guest.id, { status: status as any })}
            style={[
              styles.statusOption, 
              { borderColor: theme.colors.border },
              guest.status === status && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
            ]}
          >
            <Text style={[styles.statusOptionText, guest.status === status && { color: '#FFF' }]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Statistics - High Level */}
        <View style={[styles.immersiveStats, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.heroTitle}>Planning for {child?.name}</Text>
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{stats.adults}</Text>
              <Text style={styles.mainStatLabel}>Adults</Text>
            </View>
            <StatDivider />
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{stats.children}</Text>
              <Text style={styles.mainStatLabel}>Children</Text>
            </View>
            <StatDivider />
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{stats.food}</Text>
              <Text style={styles.mainStatLabel}>Plates</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardHeader}>
               <Text style={[styles.cardTitle, { color: theme.colors.text }]}>General Details 🎈</Text>
               <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.colors.secondary }]} 
                onPress={() => handleUpdatePlan({ date: dateText })}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Update Plan'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>PARTY THEME</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={plan?.theme}
                onChangeText={(text) => setPlan(p => p ? { ...p, theme: text } : null)}
                onBlur={() => plan && handleUpdatePlan({ theme: plan.theme })}
                placeholder="e.g. Under the Sea"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>LOCATION</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={plan?.location}
                onChangeText={(text) => setPlan(p => p ? { ...p, location: text } : null)}
                onBlur={() => plan && handleUpdatePlan({ location: plan.location })}
                placeholder="e.g. Home or Venue Name"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>DATE</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={dateText}
                  onChangeText={setDateText}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>NOTES</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
              multiline
              value={plan?.notes}
              onChangeText={(text) => setPlan(p => p ? { ...p, notes: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ notes: plan.notes })}
              placeholder="Gifts, entertainment, or special requests..."
            />
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 20 }]}>Menu & Catering 🍕</Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>FOOD & DRINKS</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
              multiline
              value={plan?.foodAndDrinks}
              onChangeText={(text) => setPlan(p => p ? { ...p, foodAndDrinks: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ foodAndDrinks: plan.foodAndDrinks })}
              placeholder="Cake, snacks, drinks list..."
            />
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>AI Summary ✨</Text>
              <TouchableOpacity style={[styles.aiBtn, { backgroundColor: theme.colors.primary }]} onPress={handleGenerateSummary}>
                <Text style={styles.aiBtnText}>Suggest</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, fontStyle: 'italic' }]}
              multiline
              value={plan?.aiSummary}
              onChangeText={(text) => setPlan(p => p ? { ...p, aiSummary: text } : null)}
              onBlur={() => plan && handleUpdatePlan({ aiSummary: plan.aiSummary })}
              placeholder="Magic summary will appear here..."
            />
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 20 }]}>Guest List 👥</Text>
            
            <View style={styles.addGuestRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={newGuest}
                onChangeText={setNewGuest}
                placeholder="Enter guest name..."
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddGuest}>
                <Text style={styles.addBtnText}>Invite</Text>
              </TouchableOpacity>
            </View>

            {['Confirmed', 'Maybe', 'Pending'].map(status => {
              const list = plan?.guests.filter(g => g.status === status) || [];
              if (list.length === 0) return null;
              return (
                <View key={status} style={styles.listSection}>
                  <Text style={[styles.listHeader, { color: theme.colors.primary }]}>{status.toUpperCase()} – {list.length}</Text>
                  {list.map(renderGuestItem)}
                </View>
              );
            })}
          </View>
        </View>
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

const StatDivider = () => <View style={styles.statDivider} />;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  immersiveStats: { padding: 40, paddingTop: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10, alignItems: 'center' },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 24, textAlign: 'center' },
  mainStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  mainStat: { alignItems: 'center', paddingHorizontal: 15 },
  mainStatValue: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  mainStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  contentWrapper: { padding: 20 },
  card: { padding: 24, borderRadius: 32, marginBottom: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  inputGroup: { marginBottom: 20 },
  input: { borderWidth: 1.5, borderRadius: 20, padding: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  addGuestRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  addBtn: { borderRadius: 18, paddingHorizontal: 24, justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '900' },
  listSection: { marginTop: 10 },
  listHeader: { fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  aiBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  aiBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  guestCardItem: { borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1 },
  guestHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  guestName: { fontSize: 18, fontWeight: '800' },
  statusBadge: { marginTop: 4 },
  statusEmoji: { fontSize: 11, fontWeight: '700', color: '#888' },
  smallDeleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  guestActions: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  counterGroup: { flex: 1 },
  subGuestLabel: { fontSize: 10, fontWeight: '900', marginBottom: 8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  counterBtn: { fontSize: 20, fontWeight: '700', color: '#6C63FF' },
  counterText: { fontSize: 16, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  subNamesInput: { borderRadius: 15, padding: 12, fontSize: 13, marginBottom: 16, fontStyle: 'italic' },
  statusPicker: { flexDirection: 'row', gap: 8 },
  statusOption: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statusOptionText: { fontSize: 11, fontWeight: '800', color: '#888' },
  confirmedText: { color: '#4CAF50' },
  statItem: { flex: 1, minWidth: '45%', borderRadius: 18, padding: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginTop: 4 },
  statSub: { fontSize: 9, color: '#aaa' },
});
