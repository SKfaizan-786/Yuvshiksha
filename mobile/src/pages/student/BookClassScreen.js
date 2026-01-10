import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../components/Header';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import COLORS from '../../constants/colors';
import teacherAPI from '../../services/teacherAPI';
import bookingAPI from '../../services/bookingAPI';

/**
 * Calendar Modal Component
 * Allows users to select a date from a calendar, with specific days blocked based on teacher availability.
 */
const CalendarModal = ({ visible, onClose, onSelectDate, selectedDate, availableDays }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onSelectDate(newDate);
    onClose();
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const startDay = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Header for Day Names
    const headerRow = shortDayNames.map((day, index) => (
      <Text key={index} style={styles.calendarDayHeader}>{day}</Text>
    ));

    // Empty cells for start padding
    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
    }

    // Day cells
    for (let i = 1; i <= totalDays; i++) {
      const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayOfWeekName = dayNames[tempDate.getDay()];

      // Availability Logic
      // If availableDays is empty, assume all unavailable (or all available? User said "only those days are clickable")
      // Website logic: if availableDays is populated, strictly filter.
      let isAvailable = false;
      if (availableDays.length > 0) {
        isAvailable = availableDays.includes(dayOfWeekName);
      } else {
        // Fallback: if no specific days set, maybe allow all? 
        // Or strictly allow none? Let's assume strict based on user request.
        isAvailable = false;
      }

      // Disable past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (tempDate < today) isAvailable = false;

      const isSelected = selectedDate &&
        selectedDate.getDate() === i &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDaySelected,
            !isAvailable && styles.calendarDayDisabled
          ]}
          onPress={() => isAvailable && handleSelectDate(i)}
          disabled={!isAvailable}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            !isAvailable && styles.calendarDayTextDisabled
          ]}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={styles.calendarWeekRow}>{headerRow}</View>
        <View style={styles.calendarGrid}>{days}</View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {renderCalendarDays()}

          {/* Footer */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Book Class Screen
 * Schedule sessions with teachers
 */
const BookClassScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { teacherId } = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacher, setTeacher] = useState(null);

  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadTeacherDetails();
  }, []);

  useEffect(() => {
    if (teacher && selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, teacher]);

  const loadTeacherDetails = async () => {
    try {
      const response = await teacherAPI.getTeacherById(teacherId);
      if (response.success) {
        const teacherData = response.data;
        setTeacher(teacherData);

        // Extract available days
        const availability = teacherData.teacherProfile?.availability || [];
        const days = availability.map((a) => (typeof a === 'string' ? a : a.day));
        setAvailableDays(days);

        // Set first subject as default
        if (teacherData.teacherProfile?.subjects?.length > 0) {
          const firstSubject = teacherData.teacherProfile.subjects[0];
          const subjectValue = typeof firstSubject === 'object' && firstSubject !== null
            ? (firstSubject.text || firstSubject.name || firstSubject.label || '')
            : firstSubject;
          setSelectedSubject(subjectValue);
        }
      } else {
        Alert.alert('Error', 'Failed to load teacher details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error loading teacher:', error);
      Alert.alert('Error', 'Failed to load teacher details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true);
      // Fix: Use local date string instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('Fetching slots for:', dateStr);
      const response = await bookingAPI.getTeacherAvailability(teacherId, dateStr);

      if (response.success) {
        const slots = response.data?.availableSlots || response.data?.slots || response.availableSlots || response.slots || [];
        const slotsArray = Array.isArray(slots) ? slots : [];
        setAvailableSlots(slotsArray);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('❌ Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };


  const toggleSlot = (slot) => {
    const slotStr = typeof slot === 'object' ? (slot.time || slot.text) : slot;

    if (selectedSlots.includes(slotStr)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotStr));
    } else {
      setSelectedSlots([...selectedSlots, slotStr]);
    }
  };

  const calculateTotalAmount = () => {
    const hourlyRate = teacher?.teacherProfile?.hourlyRate || 0;
    return selectedSlots.length * hourlyRate;
  };

  const handleBookSession = async () => {
    if (!selectedSubject) return Alert.alert('Required', 'Please select a subject');
    if (!selectedDate) return Alert.alert('Required', 'Please select a date');
    if (selectedSlots.length === 0) return Alert.alert('Required', 'Please select at least one time slot');

    try {
      setSubmitting(true);
      const bookingData = {
        teacherId,
        subject: selectedSubject,
        date: selectedDate.toISOString(),
        slots: selectedSlots, // Changed from timeSlots to slots
        notes,
        totalAmount: calculateTotalAmount(),
      };

      const response = await bookingAPI.createBooking(bookingData);

      if (response.success) {
        Alert.alert('Success', 'Booking request sent successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('StudentTabs', { screen: 'Dashboard' }) }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading teacher details..." />;
  if (!teacher) return null;

  const profile = teacher.teacherProfile || {};
  const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
  const totalAmount = calculateTotalAmount();

  // Get teacher avatar with multiple fallbacks (like website)
  const teacherAvatar = profile.photoUrl || profile.profilePicture ||
    teacher.avatar || teacher.photoUrl || null;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Book a Class" showBack />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Teacher Info Card - Enhanced */}
        <View style={styles.teacherCard}>
          {/* Avatar */}
          <View style={styles.teacherAvatarSection}>
            {teacherAvatar ? (
              <Image
                source={{ uri: teacherAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {fullName.charAt(0)?.toUpperCase() || 'T'}
                </Text>
              </View>
            )}
          </View>

          {/* Teacher Details */}
          <View style={styles.teacherDetailsSection}>
            {/* Name */}
            <Text style={styles.teacherName} numberOfLines={1}>{fullName}</Text>

            {/* Subjects with icon */}
            {profile.subjects && profile.subjects.length > 0 && (
              <View style={styles.subjectsRow}>
                <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} style={styles.iconFixed} />
                <Text style={styles.subjectsText} numberOfLines={2}>
                  {profile.subjects.map((subject) => {
                    return typeof subject === 'object' && subject !== null
                      ? (subject.text || subject.name || subject.label || 'Subject')
                      : subject;
                  }).join(', ')}
                </Text>
              </View>
            )}

            {/* Price */}
            {profile.hourlyRate && (
              <View style={styles.priceRow}>
                <Ionicons name="cash-outline" size={14} color={COLORS.primary} style={styles.iconFixed} />
                <Text style={styles.priceText}>₹{profile.hourlyRate}/hour</Text>
              </View>
            )}

            {/* Bio */}
            <Text style={styles.bioText} numberOfLines={3}>
              {profile.bio || `Experienced ${profile.subjects?.[0] ? (typeof profile.subjects[0] === 'object' ? (profile.subjects[0].text || profile.subjects[0].name || profile.subjects[0].label || '') : profile.subjects[0]) : ''} teacher with a passion for teaching`.replace('  ', ' ')}
            </Text>
          </View>
        </View>

        {/* 1. Subject Selection */}
        {profile.subjects && profile.subjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              1. Select Subject <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.subjectsContainer}>
              {profile.subjects.map((subject, index) => {
                // Handle if subject is an object
                const subjectValue = typeof subject === 'object' && subject !== null
                  ? (subject.text || subject.name || subject.label || 'Subject')
                  : subject;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subjectChip,
                      selectedSubject === subjectValue && styles.subjectChipActive,
                    ]}
                    onPress={() => setSelectedSubject(subjectValue)}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        selectedSubject === subjectValue && styles.subjectChipTextActive,
                      ]}
                    >
                      {subjectValue}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 2. Date Selection (Custom Modal Trigger) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Date <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowCalendar(true)}>
            <View style={styles.dateSelectorContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.dateSelectorLabel}>Date</Text>
                <Text style={styles.dateSelectorValue}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
                    : 'Tap to select date'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedSlots([]); // Clear slots
          }}
          selectedDate={selectedDate}
          availableDays={availableDays}
        />

        {/* 3. Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Select Time Slots <Text style={styles.required}>*</Text></Text>
          {loadingSlots ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: 20 }} />
          ) : !selectedDate ? (
            <Text style={styles.helperText}>Please select a date first</Text>
          ) : availableSlots.length > 0 ? (
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot, index) => {
                const slotStr = typeof slot === 'object' ? (slot.time || slot.text) : slot;
                const isSelected = selectedSlots.includes(slotStr);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => toggleSlot(slot)}
                  >
                    <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                      {slotStr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptySlots}>
              <Ionicons name="time-outline" size={30} color={COLORS.gray[400]} />
              <Text style={styles.emptySlotsText}>No slots available for this date</Text>
            </View>
          )}
        </View>

        {/* 4. Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Additional Notes <Text style={styles.optional}>(Optional)</Text></Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requirements or questions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Selected Slots:</Text>
            <Text style={styles.summaryValue}>{selectedSlots.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate per Hour:</Text>
            <Text style={styles.summaryValue}>₹{profile.hourlyRate}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
            <Text style={styles.summaryTotalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Fixed Button */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title={submitting ? 'Confirming...' : `Book for ₹${totalAmount}`}
          onPress={handleBookSession}
          disabled={!selectedSubject || !selectedDate || selectedSlots.length === 0 || submitting}
          loading={submitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use background color
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teacherAvatarSection: {
    marginRight: 12,
    paddingTop: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray[200],
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  teacherDetailsSection: {
    flex: 1,
    paddingRight: 4,
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  teacherName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  iconFixed: {
    marginTop: 2,
  },
  subjectsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  subjectsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  bioText: {
    fontSize: 12,
    color: COLORS.gray[600],
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 2,
  },
  teacherDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginTop: -8,
  },
  required: {
    color: COLORS.error,
  },
  optional: {
    color: COLORS.textSecondary,
    fontWeight: 'normal',
    fontSize: 13,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  subjectChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subjectChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Date Selector Button
  dateSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: COLORS.white, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.gray[200]
  },
  dateSelectorContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primary + '10',
    alignItems: 'center', justifyContent: 'center'
  },
  dateSelectorLabel: { fontSize: 12, color: COLORS.textSecondary },
  dateSelectorValue: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },

  // Calendar Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  calendarContainer: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5
  },
  calendarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  calendarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  navButton: { padding: 5 },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.285714%', // Exactly 100% / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    marginBottom: 4,
  },
  calendarDaySelected: { backgroundColor: COLORS.primary },
  calendarDayDisabled: { opacity: 0.3 },
  calendarDayText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  calendarDayTextSelected: { color: COLORS.white, fontWeight: '700' },
  calendarDayTextDisabled: { color: COLORS.gray[400] },
  closeButton: { marginTop: 20, alignSelf: 'center', padding: 10 },
  closeButtonText: { color: COLORS.textSecondary, fontWeight: '600' },

  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    width: '30%', // Grid of 3
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  slotChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotChipDisabled: {
    backgroundColor: COLORS.gray[50],
    borderColor: COLORS.gray[100],
    opacity: 0.6,
  },
  slotChipText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  slotChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  slotChipTextDisabled: {
    color: COLORS.gray[400],
  },
  slotCheck: {
    marginLeft: 2,
  },
  emptySlots: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12
  },
  emptySlotsText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 13
  },
  helperText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 120,
    backgroundColor: COLORS.gray[50],
    textAlignVertical: 'top',
  },
  summaryCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.primary + '05', // Very light primary tint
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '20',
    paddingTop: 16,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '800',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    // paddingBottom set dynamically with safe area insets
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default BookClassScreen;
