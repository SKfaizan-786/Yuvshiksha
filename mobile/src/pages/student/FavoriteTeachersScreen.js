import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import LoadingScreen from '../../components/LoadingScreen';
import COLORS from '../../constants/colors';
import teacherAPI from '../../services/teacherAPI';
import profileAPI from '../../services/profileAPI';

/**
 * Favorite Teachers Screen
 * Displays a list of student's favorite teachers
 */
const FavoriteTeachersScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [favoriteTeachers, setFavoriteTeachers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterFavorites();
    }, [teachers, favorites]);

    const loadData = async () => {
        try {
            const [teachersRes, favoritesRes] = await Promise.all([
                teacherAPI.getTeachersList(),
                profileAPI.getFavorites()
            ]);

            if (teachersRes.success) {
                setTeachers(teachersRes.data || []);
            }

            if (favoritesRes.success && favoritesRes.data) {
                const favData = favoritesRes.data.favourites || favoritesRes.data || [];
                setFavorites(Array.isArray(favData) ? favData : []);
            }
        } catch (error) {
            console.error('Error loading favorite teachers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterFavorites = () => {
        if (teachers.length > 0 && favorites.length > 0) {
            const filtered = teachers.filter(teacher => {
                const teacherId = teacher._id || teacher.id;
                // Check if teacher ID is in favorites list (handling objects or strings)
                return favorites.some(fav => {
                    if (typeof fav === 'string') return fav === teacherId;
                    return (fav._id || fav) === teacherId;
                });
            });
            setFavoriteTeachers(filtered);
        } else {
            setFavoriteTeachers([]);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const removeFavorite = async (teacherId) => {
        try {
            await profileAPI.removeFavorite(teacherId);
            setFavorites(prev => prev.filter(id => {
                if (typeof id === 'string') return id !== teacherId;
                return (id._id || id) !== teacherId;
            }));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    if (loading) {
        return <LoadingScreen message="Loading favorites..." />;
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Header title="Favorite Teachers" showNotification={false} showBack={true} />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Math.max(20, insets.bottom + 20) }
                ]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {favoriteTeachers.length > 0 ? (
                    <View style={styles.listContainer}>
                        {favoriteTeachers.map(teacher => (
                            <TeacherCard
                                key={teacher._id}
                                teacher={teacher}
                                onRemove={() => removeFavorite(teacher._id)}
                                onBook={() => navigation.navigate('BookClass', { teacherId: teacher._id })}
                                onMessage={() => navigation.navigate('Chat', {
                                    participantId: teacher._id,
                                    participantName: `${teacher.firstName} ${teacher.lastName}`.trim()
                                })}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="heart-dislike-outline" size={48} color={COLORS.gray[400]} />
                        </View>
                        <Text style={styles.emptyTitle}>No Favorite Teachers Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            You haven't added any teachers to your favorites list. Browse teachers and tap the heart icon to save them here for quick access.
                        </Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => navigation.navigate('StudentTabs', { screen: 'Teachers' })}
                        >
                            <Text style={styles.browseButtonText}>Browse Teachers</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// Reused & Simplified Teacher Card with Enhanced Styling
const TeacherCard = ({ teacher, onRemove, onBook, onMessage }) => {
    const profile = teacher.teacherProfile || {};
    const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    const photoUrl = profile.photoUrl || teacher.avatar;

    // Safe extraction - matching TeacherListScreen logic exactly
    const experience = typeof profile.experience === 'object' && profile.experience !== null
        ? (profile.experience.years || profile.experience.value || 0)
        : (profile.experience || profile.experienceYears || profile.yearsOfExperience || 0);

    const hourlyRate = typeof profile.hourlyRate === 'object' && profile.hourlyRate !== null
        ? (profile.hourlyRate.amount || profile.hourlyRate.value || 0)
        : (profile.hourlyRate || profile.rate || profile.pricePerHour || profile.price || 0);

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{fullName.charAt(0)?.toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{fullName}</Text>
                        <TouchableOpacity style={styles.favButton} onPress={onRemove}>
                            <Ionicons name="heart" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>

                    {profile.institution && (
                        <Text style={styles.institution} numberOfLines={1}>
                            <Ionicons name="school-outline" size={12} color={COLORS.textSecondary} /> {profile.institution}
                        </Text>
                    )}

                    <View style={styles.statsRow}>
                        {experience > 0 && (
                            <View style={styles.statBadge}>
                                <Ionicons name="ribbon-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.statText}>{experience} Years Exp</Text>
                            </View>
                        )}
                        {hourlyRate > 0 && (
                            <View style={[styles.statBadge, styles.priceBadge]}>
                                <Ionicons name="cash-outline" size={14} color={COLORS.success} />
                                <Text style={[styles.statText, styles.priceText]}>₹{hourlyRate}/hr</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Subjects Chips */}
            {profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 && (
                <View style={styles.subjectsRow}>
                    {profile.subjects.slice(0, 3).map((sub, i) => {
                        const label = typeof sub === 'object' ? (sub.name || sub.text || 'Subject') : sub;
                        return (
                            <View key={i} style={styles.chip}>
                                <Text style={styles.chipText}>{label}</Text>
                            </View>
                        );
                    })}
                    {profile.subjects.length > 3 && (
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>+{profile.subjects.length - 3}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.msgBtn]} onPress={onMessage}>
                    <Ionicons name="chatbubble-outline" size={18} color={COLORS.textPrimary} />
                    <Text style={styles.msgBtnText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.bookBtn]} onPress={onBook}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
                    <Text style={styles.bookBtnText}>Book Session</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' }, // Lighter background
    scrollContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
    listContainer: { gap: 16 },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 60,
    },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    browseButton: {
        backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    browseButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 16 },

    // Card Styles
    card: {
        backgroundColor: COLORS.white, borderRadius: 20, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        marginBottom: 4,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.gray[200] },
    avatarPlaceholder: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary + '15',
        justifyContent: 'center', alignItems: 'center'
    },
    avatarText: { fontSize: 26, fontWeight: '700', color: COLORS.primary },
    infoContainer: { flex: 1, marginLeft: 16 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
    favButton: { marginTop: -4 },

    institution: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    statBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8
    },
    priceBadge: { backgroundColor: COLORS.success + '10' },
    statText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
    priceText: { color: COLORS.success },

    subjectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    chipText: { fontSize: 12, color: '#475569', fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },

    actions: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    msgBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#e2e8f0' },
    bookBtn: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    msgBtnText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
    bookBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
});

export default FavoriteTeachersScreen;
