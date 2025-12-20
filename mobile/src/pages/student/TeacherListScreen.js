import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import LoadingScreen from '../../components/LoadingScreen';
import COLORS from '../../constants/colors';
import teacherAPI from '../../services/teacherAPI';
import profileAPI from '../../services/profileAPI';

/**
 * Teacher List Screen
 * Browse and search teachers with filters
 */
const TeacherListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showFavoritesOnly: false,
    sortBy: 'experience', // experience, priceLow, priceHigh, popular
  });

  useEffect(() => {
    loadTeachers();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [teachers, searchQuery, filters, favorites]);

  const loadTeachers = async () => {
    try {
      const response = await teacherAPI.getTeachersList();

      if (response.success) {
        setTeachers(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load teachers');
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      Alert.alert('Error', 'Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await profileAPI.getFavorites();

      if (response.success && response.data) {
        // Handle response format: { favourites: [] } or direct array
        const favData = response.data.favourites || response.data || [];
        const favArray = Array.isArray(favData) ? favData : [];
        setFavorites(favArray);
        console.log('Loaded favorites:', favArray);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    }
  };

  const applyFilters = () => {
    let result = [...teachers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (teacher) => {
          // Search in name
          const firstNameMatch = teacher.firstName?.toLowerCase().includes(query);
          const lastNameMatch = teacher.lastName?.toLowerCase().includes(query);

          // Search in subjects - handle both string and object formats
          const subjectsMatch = teacher.teacherProfile?.subjects?.some((s) => {
            if (typeof s === 'string') {
              return s.toLowerCase().includes(query);
            } else if (typeof s === 'object' && s !== null) {
              return (s.name || s.text || s.label || '').toLowerCase().includes(query);
            }
            return false;
          });

          // Search in specializations - handle both string and object formats
          const specializationsMatch = teacher.teacherProfile?.specializations?.some((s) => {
            if (typeof s === 'string') {
              return s.toLowerCase().includes(query);
            } else if (typeof s === 'object' && s !== null) {
              return (s.name || s.text || s.label || '').toLowerCase().includes(query);
            }
            return false;
          });

          return firstNameMatch || lastNameMatch || subjectsMatch || specializationsMatch;
        }
      );
    }

    // Favorites filter
    if (filters.showFavoritesOnly && Array.isArray(favorites) && favorites.length > 0) {
      result = result.filter((teacher) => {
        const teacherId = teacher._id || teacher.id;
        // Favorites can be IDs (strings) or objects with _id
        return favorites.some(fav => {
          if (typeof fav === 'string') {
            return fav === teacherId;
          }
          return fav._id === teacherId || fav === teacherId;
        });
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'experience':
        result.sort(
          (a, b) =>
            (b.teacherProfile?.experience || 0) -
            (a.teacherProfile?.experience || 0)
        );
        break;
      case 'priceLow':
        result.sort(
          (a, b) =>
            (a.teacherProfile?.hourlyRate || 0) -
            (b.teacherProfile?.hourlyRate || 0)
        );
        break;
      case 'priceHigh':
        result.sort(
          (a, b) =>
            (b.teacherProfile?.hourlyRate || 0) -
            (a.teacherProfile?.hourlyRate || 0)
        );
        break;
      case 'popular':
        result.sort(
          (a, b) =>
            (b.teacherProfile?.totalStudents || 0) -
            (a.teacherProfile?.totalStudents || 0)
        );
        break;
    }

    setFilteredTeachers(result);
  };

  const toggleFavorite = async (teacherId) => {
    try {
      const isFavorite = favorites.some(
        (fav) => {
          if (typeof fav === 'string') return fav === teacherId;
          return fav._id === teacherId || fav === teacherId;
        }
      );

      if (isFavorite) {
        await profileAPI.removeFavorite(teacherId);
        setFavorites(favorites.filter((fav) => {
          if (typeof fav === 'string') return fav !== teacherId;
          return (fav._id || fav) !== teacherId;
        }));
      } else {
        await profileAPI.addFavorite(teacherId);
        setFavorites([...favorites, teacherId]);
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeachers();
    loadFavorites();
  };

  const isFavorite = (teacherId) => {
    if (!Array.isArray(favorites)) return false;
    return favorites.some((fav) => {
      if (typeof fav === 'string') return fav === teacherId;
      return fav._id === teacherId || fav === teacherId;
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading teachers..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Find Teachers" showNotification />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.gray[500]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray[400]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[500]} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options"
            size={24}
            color={showFilters ? COLORS.primary : COLORS.gray[700]}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FilterChip
                label="Experience"
                active={filters.sortBy === 'experience'}
                onPress={() => setFilters({ ...filters, sortBy: 'experience' })}
              />
              <FilterChip
                label="Price (Low-High)"
                active={filters.sortBy === 'priceLow'}
                onPress={() => setFilters({ ...filters, sortBy: 'priceLow' })}
              />
              <FilterChip
                label="Price (High-Low)"
                active={filters.sortBy === 'priceHigh'}
                onPress={() => setFilters({ ...filters, sortBy: 'priceHigh' })}
              />
              <FilterChip
                label="Popular"
                active={filters.sortBy === 'popular'}
                onPress={() => setFilters({ ...filters, sortBy: 'popular' })}
              />
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.favoritesToggle}
            onPress={() =>
              setFilters({
                ...filters,
                showFavoritesOnly: !filters.showFavoritesOnly,
              })
            }
          >
            <Ionicons
              name={filters.showFavoritesOnly ? 'checkbox' : 'square-outline'}
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.favoritesToggleText}>Show Favorites Only</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Teachers List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.teachersContainer}>
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <TeacherCard
                key={teacher._id}
                teacher={teacher}
                isFavorite={isFavorite(teacher._id)}
                onToggleFavorite={() => toggleFavorite(teacher._id)}
                onBookSession={() =>
                  navigation.navigate('BookClass', { teacherId: teacher._id })
                }
                onMessage={() =>
                  navigation.navigate('Chat', {
                    participantId: teacher._id,
                    participantName: `${teacher.firstName} ${teacher.lastName}`.trim()
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={64} color={COLORS.gray[400]} />
              <Text style={styles.emptyStateText}>
                {searchQuery || filters.showFavoritesOnly
                  ? 'No teachers found'
                  : 'No teachers available'}
              </Text>
              {filters.showFavoritesOnly && (
                <TouchableOpacity
                  onPress={() =>
                    setFilters({ ...filters, showFavoritesOnly: false })
                  }
                >
                  <Text style={styles.emptyStateLink}>Show all teachers</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Filter Chip Component
 */
const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/**
 * Teacher Card Component
 */
const TeacherCard = ({
  teacher,
  isFavorite,
  onToggleFavorite,
  onBookSession,
  onMessage,
}) => {
  const profile = teacher.teacherProfile || {};
  const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();

  // Safe extraction for experience - check multiple field names
  const experience = typeof profile.experience === 'object' && profile.experience !== null
    ? (profile.experience.years || profile.experience.value || 0)
    : (profile.experience || profile.experienceYears || profile.yearsOfExperience || 0);

  // Safe extraction for totalStudents - check multiple field names
  const totalStudents = typeof profile.totalStudents === 'object' && profile.totalStudents !== null
    ? (profile.totalStudents.count || profile.totalStudents.value || 0)
    : (profile.totalStudents || profile.studentCount || 0);

  // Safe extraction for hourlyRate - check multiple field names
  const hourlyRate = typeof profile.hourlyRate === 'object' && profile.hourlyRate !== null
    ? (profile.hourlyRate.amount || profile.hourlyRate.value || 0)
    : (profile.hourlyRate || profile.rate || profile.pricePerHour || profile.price || 0);

  // Get profile photo URL
  const photoUrl = profile.photoUrl || teacher.avatar || profile.photo;

  return (
    <View style={styles.teacherCard}>
      {/* Header with Avatar and Favorite */}
      <View style={styles.cardHeader}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {fullName.charAt(0)?.toUpperCase() || 'T'}
            </Text>
          </View>
        )}
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.teacherName}>{fullName || 'Teacher'}</Text>
        </View>
        <TouchableOpacity
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? COLORS.error : COLORS.gray[400]}
          />
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <Text style={styles.bioText}>
        {profile.bio || 'Experienced educator dedicated to student success.'}
      </Text>

      {/* Subjects */}
      {profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 && (
        <View style={styles.subjectsContainer}>
          {profile.subjects.slice(0, 3).map((subject, index) => {
            const subjectName = typeof subject === 'object' && subject !== null
              ? (subject.text || subject.name || subject.label || 'Subject')
              : subject;
            return (
              <View key={index} style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{subjectName}</Text>
              </View>
            );
          })}
          {profile.subjects.length > 3 && (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>
                +{profile.subjects.length - 3} more
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Institution */}
      {profile.institution && (
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={14} color={COLORS.gray[600]} />
          <Text style={styles.infoText}>{profile.institution}</Text>
        </View>
      )}

      {/* Experience and Students Stats */}
      {(experience > 0 || totalStudents >= 0) && (
        <View style={styles.statsRow}>
          {experience > 0 && (
            <View style={styles.stat}>
              <Ionicons name="ribbon-outline" size={16} color={COLORS.primary} />
              <Text style={styles.statText}>{experience}y exp</Text>
            </View>
          )}
          {totalStudents >= 0 && (
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color={COLORS.primary} />
              <Text style={styles.statText}>{totalStudents} students</Text>
            </View>
          )}
        </View>
      )}

      {/* Boards */}
      {profile.boards && Array.isArray(profile.boards) && profile.boards.length > 0 && (
        <View style={styles.boardsSection}>
          <Text style={styles.sectionLabel}>Boards</Text>
          <View style={styles.boardsContainer}>
            {profile.boards.map((board, index) => {
              const boardName = typeof board === 'object' && board !== null
                ? (board.text || board.name || board.label || 'Board')
                : board;
              return (
                <View key={index} style={styles.boardChip}>
                  <Text style={styles.boardText}>{boardName}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Specializations */}
      {profile.specializations && Array.isArray(profile.specializations) && profile.specializations.length > 0 && (
        <View style={styles.specializationsSection}>
          <Text style={styles.sectionLabel}>Specializations</Text>
          <View style={styles.specializationsContainer}>
            {profile.specializations.slice(0, 3).map((spec, index) => {
              const specName = typeof spec === 'object' && spec !== null
                ? (spec.text || spec.name || spec.label || 'Specialization')
                : spec;
              return (
                <View key={index} style={styles.specializationChip}>
                  <Text style={styles.specializationText}>{specName}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Available Days - Extract from availability array */}
      {profile.availability && Array.isArray(profile.availability) && profile.availability.length > 0 && (
        <View style={styles.availabilitySection}>
          <Text style={styles.sectionLabel}>Available Days</Text>
          <View style={styles.daysContainer}>
            {profile.availability.map(slot => {
              if (typeof slot === 'object' && slot !== null) {
                return slot.day;
              }
              return slot;
            }).filter((day, index, self) => day && self.indexOf(day) === index).map((day, index) => (
              <View key={index} style={styles.dayChip}>
                <Ionicons name="calendar-outline" size={12} color="#2563eb" />
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Email */}
      {teacher.email && (
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color={COLORS.gray[600]} />
          <Text style={styles.infoText} numberOfLines={1}>{teacher.email}</Text>
        </View>
      )}

      {/* Location */}
      {profile.location && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray[600]} />
          <Text style={styles.infoText}>{profile.location}</Text>
        </View>
      )}

      {/* Rate per Hour */}
      {hourlyRate > 0 && (
        <View style={styles.rateContainer}>
          <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
          <Text style={styles.rateText}>₹{hourlyRate}</Text>
          <Text style={styles.rateLabel}>per hour</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={onMessage}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.gray[700]} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.bookButton]}
          onPress={onBookSession}
        >
          <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
          <Text style={styles.bookButtonText}>Book Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoritesToggleText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  teachersContainer: {
    padding: 16,
  },
  teacherCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  avatarInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  teacherExperience: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  teacherBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  boardsSection: {
    marginBottom: 12,
  },
  boardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boardChip: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  boardText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
  },
  specializationsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  specializationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dayText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  rateText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  messageButton: {
    backgroundColor: COLORS.gray[100],
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  bookButton: {
    backgroundColor: COLORS.primary,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 16,
  },
  // ... (previous styles)
  avatarInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
  },
  teacherBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  boardsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  boardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boardChip: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  boardText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
  },
  specializationsSection: {
    marginBottom: 12,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  specializationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align to baseline
    marginBottom: 16,
    gap: 4,
    marginTop: 8,
  },
  rateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default TeacherListScreen;
