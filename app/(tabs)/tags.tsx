import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TagCard } from '../../components/tag/TagCard';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { useTagStore } from '../../store/tagStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function TagsScreen() {
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { tags, fetchTags, togglePrivacy, isLoading } = useTagStore();

    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="My Tags" rightAction={<Button title="Add" variant="ghost" onPress={() => router.push('/register-tag')} />} />

            <FlatList
                data={tags}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TagCard
                        tag={item}
                        onTogglePrivacy={togglePrivacy}
                        onPress={() => router.push({ pathname: '/tag/[id]', params: { id: item._id } })}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="car-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tags found</Text>
                        <Button title="Register New Tag" onPress={() => router.push('/register-tag')} style={{ marginTop: 20 }} />
                    </View>
                }
                refreshing={isLoading}
                onRefresh={fetchTags}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
});
