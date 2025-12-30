import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

/**
 * Toast Notification Component
 * Shows success/error messages with auto-dismiss
 * 
 * @param {string} type - 'success' or 'error'
 * @param {string} message - Message to display
 * @param {boolean} visible - Whether toast is visible
 * @param {number} duration - Duration in ms before auto-dismiss (default: 3000)
 */
const Toast = ({ type = 'success', message, visible, duration = 3000, onHide }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onHide) onHide();
        });
    };

    if (!visible && translateY._value === -100) {
        return null;
    }

    const isSuccess = type === 'success';
    const backgroundColor = isSuccess ? COLORS.success || '#10b981' : COLORS.error || '#ef4444';
    const icon = isSuccess ? 'checkmark-circle' : 'alert-circle';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Ionicons name={icon} size={24} color="#fff" style={styles.icon} />
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    icon: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default Toast;
