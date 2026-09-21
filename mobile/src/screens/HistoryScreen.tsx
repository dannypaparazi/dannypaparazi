import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listScans, type ScanRecord } from '../api/client';

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScans(await listScans());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={scans}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={scans.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.model}>{item.modelNo}</Text>
            <Text style={styles.serial}>SN: {item.serialNo}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No scans yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: 'crimson', padding: 16 },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  model: { fontSize: 16, fontWeight: '600' },
  serial: { fontSize: 14, color: '#444', marginTop: 2 },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#888' },
});
