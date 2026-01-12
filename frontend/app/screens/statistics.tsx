import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatisticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإحصائيات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="document" size={32} color="#fff" />
            <Text style={styles.overviewNumber}>{stats?.total_documents || 0}</Text>
            <Text style={styles.overviewLabel}>إجمالي الوثائق</Text>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.overviewNumber}>{stats?.total_users || 0}</Text>
            <Text style={styles.overviewLabel}>المستخدمين</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الوثائق حسب الفئة</Text>
          {stats?.by_category && Object.keys(stats.by_category).length > 0 ? (
            Object.entries(stats.by_category).map(([category, count]: [string, any]) => (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryName}>{category}</Text>
                </View>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{count}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد بيانات</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>آخر الوثائق</Text>
          {stats?.recent_documents && stats.recent_documents.length > 0 ? (
            stats.recent_documents.map((doc: any) => (
              <TouchableOpacity key={doc.id} style={styles.recentDoc} onPress={() => router.push(`/screens/document-details?id=${doc.id}`)}>
                <View style={styles.recentDocIcon}>
                  <Ionicons name="document-text" size={20} color="#4CAF50" />
                </View>
                <View style={styles.recentDocInfo}>
                  <Text style={styles.recentDocTitle} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.recentDocDate}>{new Date(doc.created_at).toLocaleDateString('ar-IQ')}</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color="#999" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد وثائق</Text>
          )}
        </View>

        <View style={styles.aiBanner}>
          <Ionicons name="sparkles" size={24} color="#4CAF50" />
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>ميزات الذكاء الاصطناعي</Text>
            <Text style={styles.aiBannerText}>
              • استخراج النصوص من الصور (OCR){'\n'}
              • تصنيف تلقائي للوثائق{'\n'}
              • ملخصات ذكية للمحتوى{'\n'}
              • بحث متقدم في المحتوى
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4CAF50', padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  overviewGrid: { flexDirection: 'row', padding: 16, gap: 16 },
  overviewCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  overviewNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  overviewLabel: { fontSize: 12, color: '#fff', marginTop: 4, opacity: 0.9 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginLeft: 8 },
  categoryName: { fontSize: 14, color: '#333' },
  categoryCount: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryCountText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  recentDoc: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recentDocIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  recentDocInfo: { flex: 1 },
  recentDocTitle: { fontSize: 14, color: '#333', marginBottom: 4 },
  recentDocDate: { fontSize: 12, color: '#999' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 16 },
  aiBanner: { flexDirection: 'row', backgroundColor: '#e8f5e9', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  aiBannerContent: { marginRight: 12, flex: 1 },
  aiBannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8, textAlign: 'right' },
  aiBannerText: { fontSize: 12, color: '#4CAF50', lineHeight: 20, textAlign: 'right' },
});
