import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { createLog } from '../api/logs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const typeEmoji: Record<string, string> = { Food: '🍼', Nappy: '🧷', Sleep: '😴' };

export default function AddLogScreen({ route, navigation }: any) {
  const { selectedChildId } = useAuth();
  const { theme } = useTheme();
  const presetType = route.params?.type || 'Food';
  const [type, setType] = useState<string>(presetType);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'No child selected.');
      return;
    }
    setLoading(true);
    try {
      await createLog(selectedChildId, {
        type: type as any,
        timestamp: new Date().toISOString(),
        durationMinutes: type === 'Sleep' && duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Log entry added!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add New Log 📝</Text>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>What's the little one up to?</Text>
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>ACTIVITY TYPE</Text>
        <View style={styles.typeRow}>
          {['Food', 'Nappy', 'Sleep'].map((t) => (
            <TouchableOpacity key={t} 
              style={[
                styles.typeBtn, 
                { backgroundColor: theme.colors.card },
                type === t && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '11', borderWidth: 2 }
              ]}
              onPress={() => setType(t)}>
              <Text style={styles.typeEmoji}>{typeEmoji[t]}</Text>
              <Text style={[styles.typeText, { color: type === t ? theme.colors.primary : theme.colors.textSecondary }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </div>

        {type === 'Sleep' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>DURATION (MINUTES)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]} 
              placeholder="e.g. 60" 
              value={duration} 
              onChangeText={setDuration}
              keyboardType="numeric" 
              placeholderTextColor="#999" 
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>NOTES</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border, height: 120, textAlignVertical: 'top' }]} 
            placeholder="How did it go? (optional)" 
            value={notes}
            onChangeText={setNotes} 
            multiline 
            placeholderTextColor="#999" 
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Confirm Entry'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  headerSub: { fontSize: 16, marginTop: 4, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 10, marginTop: 20, letterSpacing: 1 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', elevation: 2 },
  typeEmoji: { fontSize: 28, marginBottom: 8 },
  typeText: { fontWeight: '800', fontSize: 14 },
  inputGroup: { marginTop: 10 },
  input: { borderRadius: 18, padding: 18, fontSize: 16, borderWidth: 1 },
  button: { borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 40, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  cancelBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
  cancelText: { color: '#aaa', fontWeight: '700', fontSize: 16 },
});
