import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getLogs } from '../api/logs';
import { generateInvite } from '../api/family';
import { LogEntry } from '../types';

const typeEmoji: Record<string, string> = { Food: '🍼', Nappy: '🧷', Sleep: '😴' };

export default function DashboardScreen({ navigation }: any) {
  const { fullName, selectedChildId, children, signOut } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const fetchLogs = async () => {
    if (!selectedChildId) return;
    try {
      const { data } = await getLogs(selectedChildId, 1, 10);
      setLogs(data.items);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchLogs(); }, [selectedChildId]));

  const onRefresh = async () => { setRefreshing(true); await fetchLogs(); setRefreshing(false); };

  const handleInvite = async () => {
    setInviteLoading(true);
    setGeneratedCode(null);
    try {
      const { data } = await generateInvite(inviteEmail.trim() || undefined);
      setGeneratedCode(data.code);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Could not generate invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{selectedChild?.name}'s Dashboard 👶</Text>
          <Text style={styles.sub}>Logged in as {fullName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowInviteModal(true)} style={styles.inviteBtn}>
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChildPicker')} style={styles.switchBtn}>
            <Text style={styles.switchText}>Switch</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Birthday Banner */}
      {(() => {
        if (!selectedChild?.dateOfBirth) return null;
        const dob = new Date(selectedChild.dateOfBirth);
        const today = new Date();
        const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        
        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          return (
            <TouchableOpacity 
              style={styles.birthdayBanner}
              onPress={() => navigation.navigate('BirthdayPlanner', { childId: selectedChildId })}
            >
              <Text style={styles.birthdayEmoji}>🎂</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.birthdayTitle}>
                  {diffDays === 0 ? "It's Party Day! 🎈" : `${selectedChild.name}'s birthday is in ${diffDays} day${diffDays > 1 ? 's' : ''}!`}
                </Text>
                <Text style={styles.birthdaySub}>Tap to plan the perfect celebration ✨</Text>
              </View>
              <Text style={styles.birthdayArrow}>→</Text>
            </TouchableOpacity>
          );
        }
        return null;
      })()}

      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <Text style={styles.logEmoji}>{typeEmoji[item.type] || '📝'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.logType}>{item.type}{item.durationMinutes ? ` – ${item.durationMinutes} min` : ''}</Text>
              {item.notes ? <Text style={styles.logNotes}>{item.notes}</Text> : null}
              <Text style={styles.logMeta}>{item.createdBy} · {new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No logs yet. Tap a button above to start!</Text>}
      />

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite a Family Member 🔗</Text>
            
            {generatedCode ? (
              <View style={styles.codeContainer}>
                <Text style={styles.codeTitle}>Success! Share this code:</Text>
                <Text style={styles.codeText}>{generatedCode}</Text>
                <Text style={styles.codeInfo}>Invite expires in 7 days.</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => { setShowInviteModal(false); setGeneratedCode(null); }}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Enter an email to send an invite, or leave empty to just generate a code.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  placeholderTextColor="#aaa"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.modalBtn} onPress={handleInvite} disabled={inviteLoading}>
                  <Text style={styles.modalBtnText}>{inviteLoading ? 'Generating...' : 'Generate Invite'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#333' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 6 },
  inviteBtn: { backgroundColor: '#4ECDC4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  inviteText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  switchBtn: { backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  switchText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  logoutBtn: { backgroundColor: '#FF6B6B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  actionEmoji: { fontSize: 32 },
  actionLabel: { marginTop: 6, fontSize: 14, fontWeight: '600', color: '#555' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  logCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, alignItems: 'center' },
  logEmoji: { fontSize: 28, marginRight: 12 },
  logType: { fontSize: 16, fontWeight: '600', color: '#333' },
  logNotes: { fontSize: 13, color: '#888', marginTop: 2 },
  logMeta: { fontSize: 11, color: '#aaa', marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 12, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14,
    fontSize: 16, marginBottom: 16, color: '#333',
  },
  modalBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#888', textAlign: 'center', marginTop: 16, fontSize: 15 },
  
  // Success state
  codeContainer: { alignItems: 'center', paddingVertical: 10 },
  codeTitle: { fontSize: 16, color: '#555', marginBottom: 10 },
  codeText: { fontSize: 48, fontWeight: '800', color: '#6C63FF', letterSpacing: 4, marginVertical: 10 },
  codeInfo: { fontSize: 13, color: '#aaa', marginBottom: 24 },
  doneBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  birthdayBanner: {
    backgroundColor: '#FF6B6B',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  birthdayEmoji: { fontSize: 32, marginRight: 16 },
  birthdayTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  birthdaySub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  birthdayArrow: { color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 8 },
});
