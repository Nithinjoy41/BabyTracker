import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, FlatList, Modal,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { addChild } from '../api/children';
import { joinFamily } from '../api/auth';
import { Child } from '../types';

export default function ChildPickerScreen({ navigation }: any) {
  const { children, selectChild, setChildren, joinFamilySuccess, refreshChildren, signOut } = useAuth();
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
      // Auto-select if it's the only child
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
      console.log('[JOIN] Starting join for code:', inviteCode.trim());
      
      const { data } = await joinFamily(inviteCode.trim());
      console.log('[JOIN] Success, payload:', data);
      
      await joinFamilySuccess(data);
      console.log('[JOIN] Session updated');
      
      setShowJoinFamily(false);
      setInviteCode('');
    } catch (e: any) {
      console.error('[JOIN] Failed:', e);
      let msg = e.response?.data?.error || e.message || 'Check connection';
      
      // Handle FluentValidation structure
      if (e.response?.data?.errors) {
        const firstErr = Object.values(e.response.data.errors)[0];
        if (Array.isArray(firstErr)) msg = firstErr[0];
      }
      
      setErrorMsg(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', `Could not join: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshChildren = async () => {
    setLoading(true); // Added setLoading(true) here
    try {
      await refreshChildren();
    } catch (e) {
      Alert.alert('Error', 'Could not refresh children.');
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
      console.log('[PICKER] Selecting child:', id);
      await selectChild(id);
      console.log('[PICKER] Child selected, waiting for nav switch...');
      
      // On mobile web/browsers, state propagation can sometimes be racey with navigation.
      // We only call goBack if we are in the "Switch Child" mode (not initial).
      setTimeout(() => {
        if (navigation?.canGoBack()) {
          console.log('[PICKER] Can go back, popping screen');
          navigation.goBack();
        } else {
          console.log('[PICKER] Initial picker, expecting stack replace');
        }
      }, 100);
    } catch (e) {
      console.error('[PICKER] Select failed:', e);
      Alert.alert('Error', 'Could not select child.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👶 Your Children</Text>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {children.length > 0 ? (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.childCard} onPress={() => handleSelectChild(item.id)}>
              <Text style={styles.childEmoji}>👶</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{item.name}</Text>
                <Text style={styles.childAge}>{getAge(item.dateOfBirth)}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍼</Text>
          <Text style={styles.emptyTitle}>No children yet</Text>
          <Text style={styles.emptySubtitle}>Add your child or join a family with an invite code</Text>
          <TouchableOpacity onPress={handleRefreshChildren} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄 Tap to Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddChild(true)}>
          <Text style={styles.addBtnText}>+ Add Child</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoinFamily(true)}>
          <Text style={styles.joinBtnText}>🔗 Join Family</Text>
        </TouchableOpacity>
      </View>

      {/* Add Child Modal */}
      <Modal visible={showAddChild} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Child</Text>
            <TextInput
              style={styles.input}
              placeholder="Child's name"
              placeholderTextColor="#aaa"
              value={childName}
              onChangeText={setChildName}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of birth (YYYY-MM-DD)"
              placeholderTextColor="#aaa"
              value={childDob}
              onChangeText={setChildDob}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddChild} disabled={loading}>
              <Text style={styles.modalBtnText}>{loading ? 'Adding...' : 'Add Child'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddChild(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Family Modal */}
      <Modal visible={showJoinFamily} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Family</Text>
            <Text style={styles.modalSubtitle}>Enter the invite code shared by a family member</Text>
            <TextInput
              style={styles.input}
              placeholder="Invite code (e.g. A1B2C3D4)"
              placeholderTextColor="#aaa"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            {errorMsg && (
              <Text style={{ color: '#FF4D4D', marginBottom: 10, textAlign: 'center' }}>
                ❌ {errorMsg}
              </Text>
            )}
            <TouchableOpacity style={styles.modalBtn} onPress={handleJoinFamily} disabled={loading}>
              <Text style={styles.modalBtnText}>{loading ? 'Joining...' : 'Join Family'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJoinFamily(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#333' },
  logoutBtn: { backgroundColor: '#FF6B6B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 100 },
  childCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 18, marginBottom: 12,
    elevation: 3, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  childEmoji: { fontSize: 36, marginRight: 14 },
  childName: { fontSize: 20, fontWeight: '700', color: '#333' },
  childAge: { fontSize: 14, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#6C63FF', fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
  actions: { position: 'absolute', bottom: 30, left: 16, right: 16, gap: 10 },
  addBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  joinBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#6C63FF' },
  joinBtnText: { color: '#6C63FF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14,
    fontSize: 16, marginBottom: 12, color: '#333',
  },
  modalBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#888', textAlign: 'center', marginTop: 14, fontSize: 15 },
  refreshBtn: { marginTop: 20, backgroundColor: '#E0E0FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  refreshText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
});
