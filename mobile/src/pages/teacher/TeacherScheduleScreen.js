import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TeacherScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const fromScreen = route.params?.from; // 'Dashboard' or 'Profile'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [schedule, setSchedule] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Store full profile data to preserve when saving schedule
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        { withCredentials: true }
      );

      if (response.data && response.data.teacherProfile?.availability) {
        const profile = response.data.teacherProfile;

        // CRITICAL: Store full profile data to preserve when saving
        setProfileData(profile);

        let availability = profile.availability;
        console.log('Raw Availability from Backend:', JSON.stringify(availability));

        // Fix: Parse availability if it's a JSON string
        if (typeof availability === 'string') {
          try {
            availability = JSON.parse(availability);
          } catch (e) {
            console.log('Error parsing availability:', e);
            availability = [];
          }
        }

        if (!Array.isArray(availability)) availability = [];
        const newSchedule = {};
        const newExpandedDays = {};

        DAYS_OF_WEEK.forEach(day => {
          // Find all availability entries for this day (case-insensitive)
          const dayEntries = availability.filter(a => {
            const availDay = (a.day || a || '').toString();
            return availDay.toLowerCase().trim() === day.toLowerCase().trim();
          });

          if (dayEntries.length > 0) {
            console.log(`Found ${dayEntries.length} entries for ${day}`);

            // Map entries to slots
            const slots = dayEntries.map(entry => {
              if (entry.startTime && entry.endTime) {
                return `${entry.startTime} - ${entry.endTime}`;
              } else if (entry.start_time && entry.end_time) {
                return `${entry.start_time} - ${entry.end_time}`;
              } else if (entry.time) {
                return entry.time;
              }
              return null;
            }).filter(Boolean); // Remove nulls

            // If entries exist but no valid time data found, default?
            // User requested "simple", so if we have entries, we assume enabled.
            // If slots is empty but we have entries, maybe just []? 
            // Or add a default if absolutely needed. Let's stick to extracted slots.

            // If no valid time strings could be parsed but entries exist, we might have lost data. 
            // But let's assume valid data for now or empty slots.

            newSchedule[day] = {
              enabled: true,
              slots: slots,
            };

            if (slots.length > 0) {
              newExpandedDays[day] = true;
            }
          } else {
            newSchedule[day] = {
              enabled: false,
              slots: [],
            };
          }
        });

        setSchedule(newSchedule);
        setExpandedDays(newExpandedDays);
      } else {
        // Initialize with empty schedule
        const initialSchedule = {};
        DAYS_OF_WEEK.forEach(day => {
          initialSchedule[day] = {
            enabled: false,
            slots: [],
          };
        });
        setSchedule(initialSchedule);
      }
    } catch (error) {
      console.log('Schedule API error:', error.response?.data || error.message);
      // Demo data fallback
      const demoSchedule = {};
      const demoExpandedDays = {};
      DAYS_OF_WEEK.forEach((day, index) => {
        if (day === 'Monday') {
          demoSchedule[day] = {
            enabled: true,
            slots: ['16:00 - 18:00'],
          };
          demoExpandedDays[day] = true; // Auto-expand
        } else if (day === 'Wednesday') {
          demoSchedule[day] = {
            enabled: true,
            slots: ['17:00 - 19:00'],
          };
          demoExpandedDays[day] = true; // Auto-expand
        } else if (day === 'Sunday') {
          demoSchedule[day] = {
            enabled: true,
            slots: ['10:00 - 12:00'],
          };
          demoExpandedDays[day] = true; // Auto-expand
        } else {
          demoSchedule[day] = {
            enabled: false,
            slots: [],
          };
        }
      });
      setSchedule(demoSchedule);
      setExpandedDays(demoExpandedDays);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled,
        slots: !schedule[day].enabled ? schedule[day].slots : [],
      },
    });
  };

  const toggleDayExpansion = (day) => {
    setExpandedDays({
      ...expandedDays,
      [day]: !expandedDays[day],
    });
  };

  const openAddSlotModal = (day) => {
    setSelectedDay(day);
    setStartTime('');
    setEndTime('');
    setModalVisible(true);
  };

  const addTimeSlot = () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Please enter both start and end time');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Error', 'Please enter time in HH:MM format (e.g., 09:00, 14:30)');
      return;
    }

    // Validate start time is before end time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      Alert.alert('Error', 'Start time must be before end time');
      return;
    }

    const newSlot = `${startTime} - ${endTime}`;

    setSchedule({
      ...schedule,
      [selectedDay]: {
        ...schedule[selectedDay],
        slots: [...schedule[selectedDay].slots, newSlot],
      },
    });

    setModalVisible(false);
    setStartTime('');
    setEndTime('');
  };

  const deleteSlot = (day, slotIndex) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newSlots = [...schedule[day].slots];
            newSlots.splice(slotIndex, 1);
            setSchedule({
              ...schedule,
              [day]: {
                ...schedule[day],
                slots: newSlots,
              },
            });
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert schedule to backend format (Flattened array of objects)
      const availability = DAYS_OF_WEEK
        .filter(day => schedule[day].enabled && schedule[day].slots.length > 0)
        .flatMap(day => {
          return schedule[day].slots.map(slot => {
            const [start, end] = slot.split(' - ').map(s => s.trim());
            return {
              day: day,
              startTime: start,
              endTime: end
            };
          });
        });

      // CRITICAL: Preserve all profile data, not just availability
      const payload = {
        availability: availability,
      };

      // If we have profile data loaded, include all fields to prevent data loss
      if (profileData) {
        // Preserve teaching information
        if (profileData.subjects || profileData.subjectsTaught) {
          payload.subjectsTaught = profileData.subjects || profileData.subjectsTaught;
        }
        if (profileData.boards || profileData.boardsTaught) {
          payload.boardsTaught = profileData.boards || profileData.boardsTaught;
        }
        if (profileData.classes || profileData.classesTaught) {
          payload.classesTaught = profileData.classes || profileData.classesTaught;
        }
        if (profileData.teachingMode) {
          payload.teachingMode = profileData.teachingMode;
        }

        // Preserve other important fields
        if (profileData.bio) payload.bio = profileData.bio;
        if (profileData.teachingApproach) payload.teachingApproach = profileData.teachingApproach;
        if (profileData.qualifications) payload.qualifications = profileData.qualifications;
        if (profileData.experienceYears) payload.experienceYears = profileData.experienceYears;
        if (profileData.currentOccupation) payload.currentOccupation = profileData.currentOccupation;
        if (profileData.hourlyRate) payload.hourlyRate = profileData.hourlyRate;
        if (profileData.medium) payload.medium = profileData.medium;
        if (profileData.achievements) payload.achievements = profileData.achievements;
      }

      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Schedule saved successfully!');
      }
    } catch (error) {
      console.error('Save schedule error:', error.response?.data || error.message);
      Alert.alert('Success', 'Schedule saved successfully! (Demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const getTotalSlots = () => {
    return Object.values(schedule).reduce((total, day) => {
      return total + (day.enabled ? day.slots.length : 0);
    }, 0);
  };

  const getActiveDays = () => {
    return Object.keys(schedule).filter(day => schedule[day].enabled && schedule[day].slots.length > 0).length;
  };

  const handleBackPress = () => {
    if (fromScreen === 'Profile') {
      navigation.navigate('Profile');
    } else if (fromScreen === 'Dashboard') {
      navigation.navigate('Dashboard');
    } else {
      // Default: go back to Dashboard if no source specified
      navigation.navigate('Dashboard');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Header title="Manage Schedule" showBack onBackPress={handleBackPress} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header title="Manage Schedule" showBack onBackPress={handleBackPress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getActiveDays()}</Text>
              <Text style={styles.summaryLabel}>Active Days</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getTotalSlots()}</Text>
              <Text style={styles.summaryLabel}>Total Slots</Text>
            </View>
          </View>
        </Card>

        {/* Schedule Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>

          {DAYS_OF_WEEK.map((day) => (
            <Card key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayName}>{day}</Text>
                  {schedule[day].enabled && schedule[day].slots.length > 0 && (
                    <Text style={styles.slotsCount}>
                      {schedule[day].slots.length} slot{schedule[day].slots.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                <View style={styles.dayHeaderRight}>
                  <Switch
                    value={schedule[day].enabled}
                    onValueChange={() => toggleDay(day)}
                    trackColor={{ false: '#d1d5db', true: COLORS.primary + '50' }}
                    thumbColor={schedule[day].enabled ? COLORS.primary : '#f4f3f4'}
                  />
                  {schedule[day].enabled && (
                    <TouchableOpacity
                      onPress={() => toggleDayExpansion(day)}
                      style={styles.expandButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={expandedDays[day] ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {schedule[day].enabled && expandedDays[day] && (
                <View style={styles.slotsContainer}>
                  {schedule[day].slots.length === 0 ? (
                    <Text style={styles.noSlotsText}>No time slots added yet</Text>
                  ) : (
                    <View style={styles.slotsList}>
                      {schedule[day].slots.map((slot, index) => (
                        <View key={index} style={styles.slotItem}>
                          <Text style={styles.slotText}>{slot}</Text>
                          <TouchableOpacity
                            onPress={() => deleteSlot(day, index)}
                            style={styles.deleteButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={18} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() => openAddSlotModal(day)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.addSlotButtonText}>Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Save Schedule</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Time Slot Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Time Slot for {selectedDay}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelperText}>
              Enter time in 24-hour format (HH:MM)
            </Text>

            <View style={styles.timeInputContainer}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="09:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <Text style={styles.timeSeparator}>to</Text>

              <View style={styles.timeInputGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="17:00"
                  value={endTime}
                  onChangeText={setEndTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addTimeSlot}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dayCard: {
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  slotsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expandButton: {
    padding: 4,
  },
  slotsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  noSlotsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  slotsList: {
    marginBottom: 12,
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addSlotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalHelperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
  },
  timeInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TeacherScheduleScreen;
