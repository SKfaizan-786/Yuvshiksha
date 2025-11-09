import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';

const TeacherProfileFormScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Complete Profile" showBack />
      <View style={styles.content}>
        <Text>Teacher Profile Setup Form - TODO</Text>
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

export default TeacherProfileFormScreen;






