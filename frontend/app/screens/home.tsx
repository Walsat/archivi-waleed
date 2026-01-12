import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DepartmentCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: string[];
  count: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const departments: DepartmentCategory[] = [
    {
      id: 'ministry',
      title: 'كتب الوزارة',
      icon: 'business',
      color: '#1565C0',
      gradient: ['#1565C0', '#1976D2'],
      count: 0,
    },
    {
      id: 'governorate',
      title: 'كتب المحافظة',
      icon: 'home',
      color: '#2E7D32',
      gradient: ['#2E7D32', '#388E3C'],
      count: 0,
    },
    {
      id: 'agricultural',
      title: 'كتب الشعب الزراعية',
      icon: 'leaf',
      color: '#558B2F',
      gradient: ['#558B2F', '#689F38'],
      count: 0,
    },
    {
      id: 'land',
      title: 'كتب دائرة الأراضي',
      icon: 'map',
      color: '#F57C00',
      gradient: ['#F57C00', '#FB8C00'],
      count: 0,
    },
    {
      id: 'complaints',
      title: 'كتب الشكاوي',
      icon: 'alert-circle',
      color: '#D32F2F',
      gradient: ['#D32F2F', '#E53935'],
      count: 0,
    },
    {
      id: 'integrity',
      title: 'كتب النزاهة',
      icon: 'shield-checkmark',
      color: '#7B1FA2',
      gradient: ['#7B1FA2', '#8E24AA'],
      count: 0,
    },
    {
      id: 'courts',
      title: 'كتب المحاكم',
      icon: 'hammer',
      color: '#5D4037',
      gradient: ['#5D4037', '#6D4C41'],
      count: 0,
    },
  ];

  const handleCategoryPress = (category: DepartmentCategory) => {
    router.push(`/screens/category-documents?category=${encodeURIComponent(category.title)}&color=${category.color}`);
  };

  const handleLogout = () => {
    logout();
    router.replace('/screens/login');
  };

  const renderDepartmentCard = ({ item, index }: { item: DepartmentCategory; index: number }) => (
    <TouchableOpacity
      style={[styles.departmentCard, { marginRight: index % 2 === 0 ? 8 : 0 }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={32} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{item.count} وثيقة</Text>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-back" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>نظام الأرشفة الإلكترونية</Text>
              <Text style={styles.headerSubtitle}>مديرية زراعة صلاح الدين</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/screens/statistics')} style={styles.statsButton}>
            <Ionicons name="stats-chart" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>أهلاً وسهلاً</Text>
          <Text style={styles.welcomeText}>اختر القسم المطلوب لإدارة الكتب والوثائق</Text>
        </View>

        {/* Departments Grid */}
        <View style={styles.departmentsSection}>
          <Text style={styles.sectionTitle}>الأقسام الحكومية</Text>
          
          <FlatList
            data={departments}
            renderItem={renderDepartmentCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContent}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/screens/upload-document')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="add-circle" size={28} color="#fff" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>إضافة كتاب جديد</Text>
              <Text style={styles.quickActionText}>رفع وأرشفة كتاب رسمي</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/screens/all-documents')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="search" size={28} color="#fff" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>بحث في الكتب</Text>
              <Text style={styles.quickActionText}>البحث في جميع الأقسام</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Info Footer */}
        <View style={styles.footerInfo}>
          <View style={styles.footerIcon}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          </View>
          <Text style={styles.footerText}>
            جميع البيانات محفوظة بشكل آمن • يعمل بدون إنترنت
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  departmentsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'right',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridContent: {
    paddingBottom: 8,
  },
  departmentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'right',
  },
  cardBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  cardArrow: {
    marginRight: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'right',
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerIcon: {
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
