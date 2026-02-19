import { StyleSheet, Text, View } from 'react-native';
import { Header } from '../../components/ui/Header';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function ScanScreen() {
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Scan Tag" />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Scan QR or NFC tag to contact owner.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
    },
});
