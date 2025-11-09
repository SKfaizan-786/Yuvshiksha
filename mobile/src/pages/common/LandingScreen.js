import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';

/**
 * Landing Screen
 * First screen users see when they open the app
 */
const LandingScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Yuvshiksha</Text>
          <Text style={styles.subtitle}>
            Connect with Expert Teachers for Personalized Learning
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="📚"
            title="Find Teachers"
            description="Browse through verified and experienced teachers"
          />
          <FeatureItem
            icon="📅"
            title="Book Classes"
            description="Schedule classes at your convenience"
          />
          <FeatureItem
            icon="💬"
            title="Stay Connected"
            description="Chat with teachers in real-time"
          />
          <FeatureItem
            icon="💰"
            title="Secure Payments"
            description="Safe and secure payment gateway"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Signup')}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <Button
            title="I Already Have an Account"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actions: {
    marginTop: 'auto',
  },
  button: {
    marginBottom: 12,
  },
});

export default LandingScreen;






