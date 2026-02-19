import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Product, useShopStore } from '../../store/shopStore';
import { useThemeStore } from '../../store/themeStore';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function ShopScreen() {
    const router = useRouter();
    const { mode } = useThemeStore();
    const theme = colors[mode === 'dark' ? 'dark' : 'light'];
    const { products, fetchProducts, addToCart, cart, isLoading } = useShopStore();

    useEffect(() => {
        fetchProducts();
    }, []);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const renderProduct = ({ item }: { item: Product }) => (
        <Card variant="glass" style={styles.productCard}>
            <View style={styles.imageContainer}>
                <Ionicons name="pricetag" size={48} color={theme.textMuted} />
            </View>
            <View style={styles.productInfo}>
                <View style={styles.row}>
                    <Badge label={item.category} variant="info" />
                    <Text style={[styles.price, { color: theme.secondary }]}>₹{item.price}</Text>
                </View>
                <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>{item.description}</Text>
                <Button
                    title="Add to Cart"
                    onPress={() => addToCart(item)}
                    style={{ marginTop: 8, height: 36 }}
                    textStyle={{ fontSize: 14 }}
                />
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header
                title="Shop"
                rightAction={
                    <View>
                        <Button
                            title=""
                            variant="ghost"
                            icon={<Ionicons name="cart-outline" size={24} color={theme.text} />}
                            onPress={() => { }}
                        />
                        {totalItems > 0 && (
                            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                                <Text style={styles.badgeText}>{totalItems}</Text>
                            </View>
                        )}
                    </View>
                }
            />

            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={renderProduct}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                refreshing={isLoading}
                onRefresh={fetchProducts}
                ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: theme.textMuted }}>No products available</Text>
                    </View>
                }
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
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productCard: {
        flex: 0.48,
        marginBottom: spacing.md,
        padding: spacing.sm,
    },
    imageContainer: {
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    productInfo: {
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        ...typography.body,
        fontWeight: '600',
        fontSize: 14,
    },
    price: {
        fontWeight: 'bold',
    },
    description: {
        fontSize: 12,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
