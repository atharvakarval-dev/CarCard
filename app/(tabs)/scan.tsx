/**
 * ScanScreen — Polished Scanner UI
 *
 * Replaces the raw blue rectangle with:
 * - Rounded corner brackets with pulse animation
 * - Animated laser sweep line
 * - Instructional text below frame
 * - Full-screen camera with translucent status area
 * - Unified theme integration
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing, useAppTheme } from '../../theme/theme';
import { parseQrPayload } from '../../utils/qrCrypto';

const { width: SW, height: SH } = Dimensions.get('window');
const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

// ─── Animated Scanner Frame ──────────────────────────────────────────────────

function ScannerFrame() {
    const t = useAppTheme();
    const pulse = useRef(new Animated.Value(0.7)).current;
    const sweep = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation on corners
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
            ])
        ).start();

        // Laser sweep line
        Animated.loop(
            Animated.sequence([
                Animated.timing(sweep, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const cornerStyle = (position: object) => [
        styles.corner,
        position,
        { opacity: pulse, borderColor: t.primary },
    ];

    return (
        <View style={styles.frameContainer}>
            {/* Corner brackets */}
            <Animated.View style={cornerStyle({ top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH })} />
            <Animated.View style={cornerStyle({ top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH })} />
            <Animated.View style={cornerStyle({ bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH })} />
            <Animated.View style={cornerStyle({ bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH })} />

            {/* Laser sweep line */}
            <Animated.View
                style={[
                    styles.laserLine,
                    {
                        backgroundColor: t.primary,
                        transform: [{
                            translateY: sweep.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, FRAME_SIZE - 4],
                            }),
                        }],
                    },
                ]}
            />
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScanScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const t = useAppTheme();
    const insets = useSafeAreaInsets();

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
        return (
            <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={t.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: t.bg }]}>
                <View style={[styles.permissionContainer, { paddingTop: insets.top + 60 }]}>
                    <View style={[styles.permissionIcon, { backgroundColor: t.primaryMuted }]}>
                        <Ionicons name="camera-outline" size={48} color={t.primary} />
                    </View>
                    <Text style={[styles.permissionTitle, { color: t.text }]}>Camera Access Required</Text>
                    <Text style={[styles.permissionBody, { color: t.textSecondary }]}>
                        We need camera access to scan QR codes on CarCard tags.
                    </Text>
                    <Pressable
                        onPress={requestPermission}
                        style={[styles.permissionBtn, { backgroundColor: t.primary }]}
                        accessibilityLabel="Grant camera permission"
                        accessibilityRole="button"
                    >
                        <Text style={styles.permissionBtnText}>Allow Camera</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;

        const tagCode = parseQrPayload(data);

        if (tagCode) {
            setScanned(true);
            router.push(`/scan/${tagCode}`);
        } else {
            setScanned(true);
            Alert.alert(
                'Unrecognized QR Code',
                'This QR code is not a valid CarCard tag.',
                [{ text: 'Scan Again', onPress: () => setScanned(false) }]
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" />

            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            {/* Overlay */}
            <View style={StyleSheet.absoluteFill}>
                {/* Top dark area */}
                <View style={[styles.overlayDark, { height: (SH - FRAME_SIZE) / 2 - 40 }]}>
                    {/* Title */}
                    <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                        <Text style={styles.scanTitle}>Scan Tag</Text>
                    </View>
                </View>

                {/* Middle row */}
                <View style={styles.middleRow}>
                    <View style={styles.overlayDarkSide} />
                    <ScannerFrame />
                    <View style={styles.overlayDarkSide} />
                </View>

                {/* Bottom dark area */}
                <View style={[styles.overlayDark, { flex: 1, alignItems: 'center', paddingTop: spacing.lg }]}>
                    <Text style={styles.instructionText}>
                        Hold steady over the NFC tag or QR code
                    </Text>

                    {scanned && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.processingText}>Processing...</Text>
                            <Pressable
                                onPress={() => setScanned(false)}
                                style={[styles.scanAgainBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}
                                accessibilityLabel="Scan again"
                                accessibilityRole="button"
                            >
                                <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },

    // Overlay
    overlayDark: {
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    overlayDarkSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    middleRow: {
        flexDirection: 'row',
        height: FRAME_SIZE,
    },

    // Top bar
    topBar: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: spacing.md,
    },
    scanTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },

    // Frame
    frameContainer: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
    },
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: '#3B82F6',
        borderRadius: 4,
    },
    laserLine: {
        position: 'absolute',
        left: 8,
        right: 8,
        height: 2,
        borderRadius: 1,
        opacity: 0.6,
    },

    // Instructions
    instructionText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Processing overlay
    processingOverlay: {
        alignItems: 'center',
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    processingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    scanAgainBtn: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 4,
        borderRadius: radii.md,
        borderWidth: 1,
        minHeight: 44,
        justifyContent: 'center',
    },
    scanAgainText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    // Permission screen
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    permissionIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionBody: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 280,
    },
    permissionBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderRadius: radii.md,
        minHeight: 48,
        minWidth: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
