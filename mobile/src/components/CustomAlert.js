import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

/**
 * Beautiful Custom Alert Modal
 * Replaces React Native's basic Alert with a professional, animated modal
 * 
 * @param {boolean} visible - Whether modal is visible
 * @param {string} type - 'success', 'error', 'warning', 'confirm'
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Array} buttons - Array of button objects: [{ text, onPress, style }]
 * @param {function} onClose - Called when modal should close
 */
const CustomAlert = ({
    visible,
    type = 'success',
    title,
    message,
    buttons = [],
    onClose
}) => {
    const [scaleAnim] = React.useState(new Animated.Value(0.8));
    const [opacityAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const getIconConfig = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle', color: '#10b981', bg: '#10b98115' };
            case 'error':
                return { name: 'close-circle', color: '#ef4444', bg: '#ef444415' };
            case 'warning':
                return { name: 'warning', color: '#f59e0b', bg: '#f59e0b15' };
            case 'confirm':
                return { name: 'help-circle', color: COLORS.primary, bg: COLORS.primary + '15' };
            default:
                return { name: 'information-circle', color: COLORS.primary, bg: COLORS.primary + '15' };
        }
    };

    const iconConfig = getIconConfig();

    // Default buttons if none provided
    const modalButtons = buttons.length > 0 ? buttons : [
        { text: 'OK', onPress: onClose, style: 'default' }
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                        <Ionicons name={iconConfig.name} size={56} color={iconConfig.color} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        {modalButtons.map((button, index) => {
                            const isDestructive = button.style === 'destructive';
                            const isCancel = button.style === 'cancel';
                            const isPrimary = button.style === 'default' || (!isDestructive && !isCancel);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isPrimary && styles.buttonPrimary,
                                        isDestructive && styles.buttonDestructive,
                                        isCancel && styles.buttonCancel,
                                        modalButtons.length === 1 && styles.buttonFull,
                                    ]}
                                    onPress={() => {
                                        button.onPress?.();
                                        if (!button.preventClose) {
                                            onClose?.();
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            isPrimary && styles.buttonTextPrimary,
                                            isDestructive && styles.buttonTextDestructive,
                                            isCancel && styles.buttonTextCancel,
                                        ]}
                                    >
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonFull: {
        flex: 1,
    },
    buttonPrimary: {
        backgroundColor: COLORS.primary,
    },
    buttonDestructive: {
        backgroundColor: '#ef4444',
    },
    buttonCancel: {
        backgroundColor: COLORS.gray?.[100] || '#f3f4f6',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextPrimary: {
        color: '#fff',
    },
    buttonTextDestructive: {
        color: '#fff',
    },
    buttonTextCancel: {
        color: COLORS.textPrimary,
    },
});

export default CustomAlert;
