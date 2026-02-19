import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
    const { mode, toggleMode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Profile" />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Settings and Preferences.</Text>
                <Button
                    title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
                    onPress={toggleMode}
                    style={{ marginTop: 20 }}
                />
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
        padding: 20,
    },
    text: {
        fontSize: 16,
    },
});
