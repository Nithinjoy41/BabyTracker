import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, FlatList, Modal,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addChild } from '../api/children';
import { joinFamily } from '../api/auth';
import { Child } from '../types';

export default function ChildPickerScreen({ navigation }: any) {
  const { children, selectChild, setChildren, joinFamilySuccess, refreshChildren, signOut } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  
  const [showAddChild, setShowAddChild] = useState(false);
  const [showJoinFamily, setShowJoinFamily] = useState(false);
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddChild = async () => {
    if (!childName.trim() || !childDob.trim()) {
      Alert.alert('Required', 'Please enter name and date of birth (YYYY-MM-DD).');
      return;
    }
    setLoading(true);
    try {
      const { data } = await addChild(childName.trim(), childDob.trim());
      const updated = [...children, data];
      setChildren(updated);
      setShowAddChild(false);
      setChildName('');
      setChildDob('');
      if (updated.length === 1) {
        selectChild(updated[0].id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Could not add child.');
    }
    setLoading(false);
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      setErrorMsg('Please enter an invite code.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const { data } = await joinFamily(inviteCode.trim());
      await joinFamilySuccess(data);
      setShowJoinFamily(false);
      setInviteCode('');
    } catch (e: any) {
      let msg = e.response?.data?.error || e.message || 'Check connection';
      if (e.response?.data?.errors) {
        const firstErr = Object.values(e.response.data.errors)[0];
        if (Array.isArray(firstErr)) msg = firstErr[0];
      }
      setErrorMsg(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    if (months < 1) return 'Newborn';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m old` : `${years} year${years > 1 ? 's' : ''} old`;
  };

  const handleSelectChild = async (id: string) => {
    try {
      await selectChild(id);
      setTimeout(() => {
        if (navigation?.canGoBack()) navigation.goBack();
      }, 100);
    } catch (e) {
      Alert.alert('Error', 'Could not select child.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Immersive Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>BabyTracker 👶</Text>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSub}>Select a profile to continue tracking</Text>
      </View>

      <View style={styles.content}>
        {children.length > 0 ? (
          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.childCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
                onPress={() => handleSelectChild(item.id)}
              >
                <View style={[styles.emojiCircle, { backgroundColor: theme.colors.primary + '11' }]}>
                  <Text style={styles.childEmoji}>👶</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childName, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.childAge, { color: theme.colors.textSecondary }]}>{getAge(item.dateOfBirth)}</Text>
                </View>
                <Text style={[styles.arrow, { color: theme.colors.primary }]}>→</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍼</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No children yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Add your child or join a family with an invite code</Text>
          </View>
        )}
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShowAddChild(true)}>
          <Text style={styles.addBtnText}>+ Add Child Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.joinBtn, { borderColor: theme.colors.primary }]} onPress={() => setShowJoinFamily(true)}>
          <Text style={[styles.joinBtnText, { color: theme.colors.primary }]}>🔗 Join Existing Family</Text>
        </TouchableOpacity>
      </View>

      {/* Modals ... */}
      <Modal visible={showAddChild} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add New Child</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={childName}
              onChangeText={setChildName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Birthday (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={childDob}
              onChangeText={setChildDob}
            />
            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddChild} disabled={loading}>
              <Text style={styles.modalActionBtnText}>{loading ? 'Adding...' : 'Create Profile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddChild(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showJoinFamily} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Join Family</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Enter the 8-character invite code</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border, textAlign: 'center', letterSpacing: 4, fontWeight: '800' }]}
              placeholder="INVITECODE"
              placeholderTextColor="#999"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            {errorMsg && <Text style={styles.errorText}>❌ {errorMsg}</Text>}
            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: theme.colors.secondary }]} onPress={handleJoinFamily} disabled={loading}>
              <Text style={styles.modalActionBtnText}>{loading ? 'Joining...' : 'Join Family'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJoinFamily(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  headerTitle: { fontSize: 36, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  list: { paddingBottom: 150 },
  childCard: { 
    flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 16, marginBottom: 16, borderLeftWidth: 8, borderLeftColor: '#6C63FF', elevation: 4 
  },
  emojiCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  childEmoji: { fontSize: 28 },
  childName: { fontSize: 20, fontWeight: '900' },
  childAge: { fontSize: 14, marginTop: 2, fontWeight: '600' },
  arrow: { fontSize: 24, fontWeight: '900' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 100 },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '900' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 22 },
  footerActions: { position: 'absolute', bottom: 40, left: 24, right: 24, gap: 12 },
  addBtn: { borderRadius: 20, padding: 20, alignItems: 'center', elevation: 6 },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  joinBtn: { borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 2, backgroundColor: 'transparent' },
  joinBtnText: { fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  modalSubtitle: { fontSize: 15, marginBottom: 20 },
  input: { borderRadius: 18, padding: 18, fontSize: 16, marginBottom: 16, borderWidth: 1 },
  modalActionBtn: { borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 10, elevation: 4 },
  modalActionBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalCancel: { marginTop: 20, alignItems: 'center' },
  modalCancelText: { color: '#aaa', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#FF4D4D', marginBottom: 10, textAlign: 'center', fontWeight: '700' }
});
