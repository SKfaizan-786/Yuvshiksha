import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

/**
 * Reusable Card Component
 */
const Card = ({
  children,
  style,
  onPress,
  variant = 'default',
  elevation = 2,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        styles[`card_${variant}`],
        { elevation },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  card_default: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  card_elevated: {
    borderWidth: 0,
  },
  card_outlined: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 0,
  },
});

export default Card;






