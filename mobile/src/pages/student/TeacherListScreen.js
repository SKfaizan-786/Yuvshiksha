import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';

const TeacherListScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Find Teachers" showNotification />
      <View style={styles.content}>
        <Text>Teacher List Screen - TODO</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherListScreen;






