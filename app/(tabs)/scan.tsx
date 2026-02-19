import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function ScanScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    // Permission hooks
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // Reset scanned state when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setScanned(false);
        });
        return unsubscribe;
    }, [navigation]);

    if (!permission) {
        // Camera permissions are still loading.
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
                <Text style={[styles.message, { color: theme.text }]}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" style={{ marginTop: 20 }} />
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;

        // Filter: Only accept our tags
        if (data.startsWith('TAG-') || data.includes('carcard.app/scan/')) {
            setScanned(true);

            // Extract code if it's a URL (future proofing)
            let code = data;
            if (data.includes('/scan/')) {
                code = data.split('/scan/')[1];
            }

            // Navigate to the public scan page logic
            // which will handle redirection to register if it's a new tag
            router.push(`/scan/${code}`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Scan Tag" />
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.middleContainer}>
                            <View style={styles.unfocusedContainer}></View>
                            <View style={styles.focusedContainer}>
                                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderColor: theme.primary }]} />
                                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderColor: theme.primary }]} />
                                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: theme.primary }]} />
                                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderColor: theme.primary }]} />
                            </View>
                            <View style={styles.unfocusedContainer}></View>
                        </View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>
                </CameraView>

                {scanned && (
                    <View style={styles.scannedOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={{ color: '#fff', marginTop: 10 }}>Processing...</Text>
                        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} style={{ marginTop: 20 }} />
                    </View>
                )}

                <View style={styles.instructions}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Align QR code within the frame</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    middleContainer: {
        flexDirection: 'row',
        height: 250,
    },
    focusedContainer: {
        width: 250,
        height: 250,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
    },
    scannedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    }
});
