import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs, deleteLog } from '../api/logs';
import { LogEntry } from '../types';

const typeEmoji: Record<string, string> = { Food: '🍼', Nappy: '🧷', Sleep: '😴' };

export default function HistoryScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (p = 1) => {
    try {
      const { data } = await getLogs(p, 20);
      setLogs(p === 1 ? data.items : [...logs, ...data.items]);
      setTotal(data.totalCount);
      setPage(p);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchLogs(1); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetchLogs(1); setRefreshing(false); };
  const loadMore = () => { if (logs.length < total) fetchLogs(page + 1); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteLog(id); fetchLogs(1); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id)}>
            <Text style={styles.emoji}>{typeEmoji[item.type] || '📝'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{item.type}{item.durationMinutes ? ` – ${item.durationMinutes} min` : ''}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              <Text style={styles.meta}>{item.createdBy} · {new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', padding: 12 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 12 },
  type: { fontSize: 16, fontWeight: '600', color: '#333' },
  notes: { fontSize: 13, color: '#888', marginTop: 2 },
  meta: { fontSize: 11, color: '#aaa', marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
});
