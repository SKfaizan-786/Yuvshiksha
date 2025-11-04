import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';

const TeacherProfileEditScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Profile" showBack />
      <View style={styles.content}>
        <Text>Teacher Profile Edit Screen - TODO</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherProfileEditScreen;






