import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  category: string;
  auto_category: string;
  owner_name: string;
  location: string;
  summary: string;
  created_at: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    'الكل',
    'سند ملكية',
    'عقد إيجار',
    'خريطة مساحية',
    'تقرير فني',
    'طلب خدمة',
    'شهادة',
    'أخرى',
  ];

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory && selectedCategory !== 'الكل') {
        params.category = selectedCategory;
      }

      const response = await api.get('/documents', { params });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('خطأ', 'فشل تحميل الوثائق');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/documents/search', {
        query: searchQuery,
        category: selectedCategory !== 'الكل' ? selectedCategory : null,
      });
      setDocuments(response.data.results);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('خطأ', 'فشل البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/screens/login');
        },
      },
    ]);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'image';
      case 'pdf':
        return 'document-text';
      case 'word':
        return 'document';
      default:
        return 'document';
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => router.push(`/screens/document-details?id=${item.id}`)}
    >
      <View style={styles.documentIcon}>
        <Ionicons name={getFileIcon(item.file_type) as any} size={32} color="#4CAF50" />
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.documentCategory} numberOfLines={1}>
          {item.auto_category || item.category || 'غير مصنف'}
        </Text>
        {item.summary && (
          <Text style={styles.documentSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        )}
        <Text style={styles.documentDate}>
          {new Date(item.created_at).toLocaleDateString('ar-IQ')}
        </Text>
      </View>
      <Ionicons name="chevron-back" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>الوثائق</Text>
          <Text style={styles.headerSubtitle}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/screens/statistics')}>
          <Ionicons name="stats-chart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في الوثائق..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          textAlign="right"
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              (selectedCategory === item || (item === 'الكل' && !selectedCategory)) &&
                styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item === 'الكل' ? null : item)}
          >
            <Text
              style={[
                styles.categoryText,
                (selectedCategory === item || (item === 'الكل' && !selectedCategory)) &&
                  styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              loadDocuments();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد وثائق</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/screens/upload-document')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    paddingTop: 8,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentCategory: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 4,
  },
  documentSummary: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 11,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});