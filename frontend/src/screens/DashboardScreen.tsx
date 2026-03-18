import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getLogs, deleteLog } from '../api/logs';
import { generateInvite, getFamily, removeMember } from '../api/family';
import { LogEntry, Family } from '../types';

const typeEmoji: Record<string, string> = { Food: '🍼', Nappy: '🧷', Sleep: '😴' };

export default function DashboardScreen({ navigation }: any) {
  const { fullName, selectedChildId, children, signOut } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<any>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);

  // Easter Egg logic
  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 5) {
      setLogoClicks(0);
      navigation.navigate('BabyPacman', { babyName: selectedChild?.name || 'Leo' });
    } else {
      setLogoClicks(newCount);
    }
  };

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

  const handleDeleteLog = (id: string) => {
    Alert.alert('Delete Log', 'Remove this activity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteLog(id);
          fetchLogs();
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.error || 'Failed to delete log.');
        }
      }},
    ]);
  };

  const fetchFamily = async () => {
    setLoadingFamily(true);
    try {
      const { data } = await getFamily();
      setFamilyData(data);
    } catch {}
    setLoadingFamily(false);
  };

  const handleOpenFamily = () => {
    fetchFamily();
    setShowInviteModal(true);
  };

  const handleRemoveMember = (userId: string, name: string) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${name} from the family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await removeMember(userId);
          fetchFamily();
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.error || 'Failed to remove member.');
        }
      }},
    ]);
  };

  const birthdayBanner = useMemo(() => {
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
          style={[styles.birthdayBanner, { backgroundColor: '#FF6B6B' }]}
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
  }, [selectedChild, selectedChildId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── IMMERSIVE HEADER ── */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleLogoClick}>
             <Text style={styles.logoText}>BabyTracker 👶</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
               <Text style={styles.iconEmoji}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ChildPicker')} style={styles.iconBtn}>
               <Text style={styles.iconEmoji}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.iconBtn}>
               <Text style={styles.iconEmoji}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hi {fullName?.split(' ')[0] || 'Parent'} 👋</Text>
          <Text style={styles.subGreeting}>{selectedChild?.name} is doing great today!</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          {['Food', 'Nappy', 'Sleep'].map((type) => (
            <TouchableOpacity key={type} 
              style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('AddLog', { type })}>
              <View style={[styles.emojiCircle, { backgroundColor: theme.colors.primary + '11' }]}>
                <Text style={styles.actionEmoji}>{typeEmoji[type]}</Text>
              </View>
              <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>{type}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('BirthdayPlanner', { childId: selectedChildId })}>
            <View style={[styles.emojiCircle, { backgroundColor: '#FF6B6B22' }]}>
              <Text style={styles.actionEmoji}>🎂</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>Birthday</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={handleOpenFamily}>
            <View style={[styles.emojiCircle, { backgroundColor: theme.colors.secondary + '11' }]}>
              <Text style={styles.actionEmoji}>👥</Text>
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.textSecondary }]}>Family</Text>
          </TouchableOpacity>
        </View>

        {birthdayBanner}

        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
          <TouchableOpacity onPress={onRefresh}>
             <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs yet. Start by tracking an activity above!</Text>
          </View>
        ) : (
          logs.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onLongPress={() => handleDeleteLog(item.id)}
              delayLongPress={500}
              activeOpacity={0.7}
              style={[styles.logCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
               <View style={[styles.logEmojiCircle, { backgroundColor: theme.colors.primary + '08' }]}>
                 <Text style={styles.logEmoji}>{typeEmoji[item.type] || '📝'}</Text>
               </View>
               <View style={{ flex: 1 }}>
                 <View style={styles.logRow}>
                    <Text style={[styles.logType, { color: theme.colors.text }]}>{item.type}</Text>
                    <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                 </View>
                 {item.notes ? <Text style={[styles.logNotes, { color: theme.colors.textSecondary }]}>{item.notes}</Text> : null}
                 <Text style={styles.logMeta}>{item.createdBy} · {item.durationMinutes ? `${item.durationMinutes} min` : 'Just now'}</Text>
               </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Family / Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Family Management 👥</Text>
            
            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              {loadingFamily ? <ActivityIndicator color={theme.colors.primary} /> : (
                familyData?.members?.map((m: any) => (
                  <View key={m.userId} style={styles.memberRow}>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.memberName, { color: theme.colors.text }]}>{m.fullName} {m.userId === selectedChildId ? '(You)' : ''}</Text>
                       <Text style={styles.memberRole}>{m.role}</Text>
                    </View>
                    {m.role !== 'Owner' && (
                      <TouchableOpacity onPress={() => handleRemoveMember(m.userId, m.fullName)}>
                         <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.separator} />

            {generatedCode ? (
              <View style={styles.codeContainer}>
                <Text style={styles.codeTitle}>Success! Share this code:</Text>
                <Text style={styles.codeText}>{generatedCode}</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => setGeneratedCode(null)}>
                  <Text style={styles.doneBtnText}>Generate Another</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Invite a new member:</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Email (optional)"
                  placeholderTextColor="#aaa"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                />
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]} onPress={handleInvite} disabled={inviteLoading}>
                  <Text style={styles.modalBtnText}>{inviteLoading ? 'Generating...' : 'Invite'}</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 },
  iconEmoji: { fontSize: 18 },
  greetingContainer: { marginTop: 30 },
  greeting: { fontSize: 32, fontWeight: '900', color: '#fff' },
  subGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  actionCard: { flex: 1, minWidth: '45%', borderRadius: 24, padding: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  emojiCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontSize: 14, fontWeight: '800' },
  
  birthdayBanner: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30, elevation: 8, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  birthdayEmoji: { fontSize: 40, marginRight: 16 },
  birthdayTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  birthdaySub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  birthdayArrow: { color: '#fff', fontSize: 24, fontWeight: '900' },
  
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '900' },
  
  logCard: { flexDirection: 'row', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
  logEmojiCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  logEmoji: { fontSize: 22 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logType: { fontSize: 17, fontWeight: '800' },
  logTime: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  logNotes: { fontSize: 14, marginTop: 4, fontStyle: 'italic' },
  logMeta: { fontSize: 11, color: '#bbb', marginTop: 6, fontWeight: '600' },
  
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 16, fontStyle: 'italic' },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#333', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, color: '#777', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 18, padding: 18, fontSize: 16, marginBottom: 20, color: '#333' },
  modalBtn: { backgroundColor: '#6C63FF', borderRadius: 18, padding: 18, alignItems: 'center', elevation: 4 },
  modalBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cancelText: { color: '#aaa', textAlign: 'center', marginTop: 20, fontSize: 16, fontWeight: '600' },
  
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  memberName: { fontSize: 16, fontWeight: '700' },
  memberRole: { fontSize: 12, color: '#aaa', marginTop: 2 },
  removeText: { color: '#FF6B6B', fontWeight: '700', fontSize: 13 },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 20 },

  // Success state
  codeContainer: { alignItems: 'center', paddingVertical: 10 },
  codeTitle: { fontSize: 16, color: '#555', marginBottom: 10, fontWeight: '600' },
  codeText: { fontSize: 52, fontWeight: '900', color: '#6C63FF', letterSpacing: 8, marginVertical: 15 },
  codeInfo: { fontSize: 13, color: '#aaa', marginBottom: 30 },
  doneBtn: { backgroundColor: '#4ECDC4', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 60, elevation: 4 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
