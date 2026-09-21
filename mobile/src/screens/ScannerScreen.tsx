import { useCallback, useRef } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const BARCODE_TYPES = [
  'qr',
  'code128',
  'code39',
  'code93',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'pdf417',
  'aztec',
  'datamatrix',
  'itf14',
  'codabar',
] as const;

export default function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      scannedRef.current = false;
    }, [])
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is needed to scan device labels.</Text>
        <Button title="Grant camera permission" onPress={requestPermission} />
      </View>
    );
  }

  const handleScanned = (result: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    navigation.navigate('Confirm', { rawScan: result.data, scanType: result.type });
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={handleScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point the camera at a QR code or barcode label</Text>
      </View>
      <Pressable style={styles.historyButton} onPress={() => navigation.navigate('History')}>
        <Text style={styles.historyButtonText}>History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', marginBottom: 8 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  hint: {
    color: 'white',
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  historyButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyButtonText: { color: 'white', fontWeight: '600' },
});
