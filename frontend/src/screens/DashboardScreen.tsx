import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getLogs } from '../api/logs';
import { LogEntry } from '../types';

const typeEmoji: Record<string, string> = { Food: '🍼', Nappy: '🧷', Sleep: '😴' };

export default function DashboardScreen({ navigation }: any) {
  const { fullName, signOut } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await getLogs(1, 10);
      setLogs(data.items);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchLogs(); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetchLogs(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {fullName} 👋</Text>
          <Text style={styles.sub}>Here's today's summary</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick-action buttons */}
      <View style={styles.actions}>
        {['Food', 'Nappy', 'Sleep'].map((type) => (
          <TouchableOpacity key={type} style={styles.actionBtn}
            onPress={() => navigation.navigate('AddLog', { type })}>
            <Text style={styles.actionEmoji}>{typeEmoji[type]}</Text>
            <Text style={styles.actionLabel}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#333' },
  sub: { fontSize: 14, color: '#888', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FF6B6B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
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
});
