import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { parseScan } from '../lib/parseScan';
import { createScan } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirm'>;

export default function ConfirmScreen({ route, navigation }: Props) {
  const { rawScan, scanType } = route.params;
  const [parsed] = useState(() => parseScan(rawScan));
  const [modelNo, setModelNo] = useState(parsed.modelNo);
  const [serialNo, setSerialNo] = useState(parsed.serialNo);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!modelNo.trim() || !serialNo.trim()) {
      Alert.alert('Missing info', 'Please fill in both model no. and serial no.');
      return;
    }
    setSaving(true);
    try {
      await createScan({
        modelNo: modelNo.trim(),
        serialNo: serialNo.trim(),
        rawScan,
        scanType,
      });
      Alert.alert('Saved', 'Scan saved to the cloud.', [
        { text: 'Scan another', onPress: () => navigation.popToTop() },
      ]);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Model No.</Text>
        <TextInput
          style={styles.input}
          value={modelNo}
          onChangeText={setModelNo}
          autoCapitalize="characters"
          placeholder="e.g. ABC-1234"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Serial No.</Text>
        <TextInput
          style={styles.input}
          value={serialNo}
          onChangeText={setSerialNo}
          autoCapitalize="characters"
          placeholder="e.g. SN00012345"
        />
      </View>

      <View style={styles.rawBox}>
        <Text style={styles.rawLabel}>Raw scan ({scanType})</Text>
        <Text style={styles.raw}>{rawScan}</Text>
      </View>

      {saving ? <ActivityIndicator /> : <Button title="Save to cloud" onPress={onSave} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  rawBox: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  rawLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  raw: { fontSize: 13, color: '#444' },
});
