import { Platform } from 'react-native';

const systemFont = Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
});

export const typography = {
    h1: {
        fontFamily: systemFont,
        fontSize: 32,
        fontWeight: '700' as '700',
        lineHeight: 40,
    },
    h2: {
        fontFamily: systemFont,
        fontSize: 24,
        fontWeight: '600' as '600',
        lineHeight: 32,
    },
    h3: {
        fontFamily: systemFont,
        fontSize: 20,
        fontWeight: '600' as '600',
        lineHeight: 28,
    },
    body: {
        fontFamily: systemFont,
        fontSize: 16,
        fontWeight: '400' as '400',
        lineHeight: 24,
    },
    caption: {
        fontFamily: systemFont,
        fontSize: 12,
        fontWeight: '400' as '400',
        lineHeight: 16,
    },
};
