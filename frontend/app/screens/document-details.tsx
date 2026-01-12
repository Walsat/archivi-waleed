import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_data: string;
  category: string;
  auto_category: string;
  owner_name: string;
  land_type: string;
  location: string;
  extracted_text: string;
  summary: string;
  keywords: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editLandType, setEditLandType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data);
      
      setEditTitle(response.data.title);
      setEditDescription(response.data.description || '');
      setEditCategory(response.data.category || '');
      setEditOwnerName(response.data.owner_name || '');
      setEditLandType(response.data.land_type || '');
      setEditLocation(response.data.location || '');
      setEditNotes(response.data.notes || '');
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('خطأ', 'فشل تحميل الوثيقة');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/documents/${id}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        owner_name: editOwnerName,
        land_type: editLandType,
        location: editLocation,
        notes: editNotes,
      });

      Alert.alert('نجاح', 'تم حفظ التغييرات');
      setEditMode(false);
      loadDocument();
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ التغييرات');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${id}`);
      Alert.alert('نجاح', 'تم حذف الوثيقة');
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل حذف الوثيقة');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading || !document) {
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
        <Text style={styles.headerTitle}>تفاصيل الوثيقة</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.headerButton}>
            <Ionicons name={editMode ? 'close' : 'create'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={styles.headerButton}>
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {document.file_type === 'image' && document.file_data && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${document.file_data}` }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        )}

        {document.extracted_text && (
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={20} color="#4CAF50" />
            <Text style={styles.aiBannerText}>تمت معالجة هذه الوثيقة بالذكاء الاصطناعي</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          
          {editMode ? (
            <>
              <Text style={styles.label}>العنوان</Text>
              <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} textAlign="right" />
              <Text style={styles.label}>الوصف</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editDescription} onChangeText={setEditDescription} textAlign="right" multiline />
            </>
          ) : (
            <>
              <InfoRow icon="document-text" label="العنوان" value={document.title} />
              {document.description && <InfoRow icon="information-circle" label="الوصف" value={document.description} />}
            </>
          )}

          <InfoRow icon="folder" label="نوع الملف" value={document.file_type === 'image' ? 'صورة' : document.file_type === 'pdf' ? 'PDF' : 'Word'} />
          <InfoRow icon="calendar" label="تاريخ الرفع" value={new Date(document.created_at).toLocaleString('ar-IQ')} />
        </View>

        {document.auto_category && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التصنيف</Text>
            <View style={styles.categoryTag}>
              <Ionicons name="sparkles" size={16} color="#4CAF50" />
              <Text style={styles.categoryTagText}>تصنيف ذكي: {document.auto_category}</Text>
            </View>
          </View>
        )}

        {(document.owner_name || document.land_type || document.location || editMode) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الأرض</Text>
            {editMode ? (
              <>
                <Text style={styles.label}>اسم المالك</Text>
                <TextInput style={styles.input} value={editOwnerName} onChangeText={setEditOwnerName} textAlign="right" />
                <Text style={styles.label}>نوع الأرض</Text>
                <TextInput style={styles.input} value={editLandType} onChangeText={setEditLandType} textAlign="right" />
                <Text style={styles.label}>الموقع</Text>
                <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation} textAlign="right" />
              </>
            ) : (
              <>
                {document.owner_name && <InfoRow icon="person" label="اسم المالك" value={document.owner_name} />}
                {document.land_type && <InfoRow icon="landscape" label="نوع الأرض" value={document.land_type} />}
                {document.location && <InfoRow icon="location" label="الموقع" value={document.location} />}
              </>
            )}
          </View>
        )}

        {document.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>ملخص ذكي</Text>
            </View>
            <Text style={styles.summaryText}>{document.summary}</Text>
          </View>
        )}

        {document.keywords && document.keywords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الكلمات المفتاحية</Text>
            <View style={styles.keywordsContainer}>
              {document.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordChip}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {document.extracted_text && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>النص المستخرج (OCR)</Text>
            </View>
            <Text style={styles.extractedText}>{document.extracted_text}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملاحظات</Text>
          {editMode ? (
            <TextInput style={[styles.input, styles.textArea]} value={editNotes} onChangeText={setEditNotes} textAlign="right" multiline placeholder="أضف ملاحظات" />
          ) : (
            <Text style={styles.notesText}>{document.notes || 'لا توجد ملاحظات'}</Text>
          )}
        </View>

        {editMode && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal isVisible={showDeleteModal} onBackdropPress={() => setShowDeleteModal(false)}>
        <View style={styles.modalContent}>
          <Ionicons name="warning" size={48} color="#f44336" />
          <Text style={styles.modalTitle}>حذف الوثيقة</Text>
          <Text style={styles.modalText}>هل أنت متأكد من حذف هذه الوثيقة؟ لا يمكن التراجع عن هذا الإجراء.</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalButtonTextCancel}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonDelete]} onPress={handleDelete}>
              <Text style={styles.modalButtonText}>حذف</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.infoLabel}>
        <Text style={styles.infoLabelText}>{label}</Text>
        <Ionicons name={icon as any} size={16} color="#666" style={styles.infoIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4CAF50', padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row' },
  headerButton: { marginLeft: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  imagePreview: { width: '100%', height: 300, backgroundColor: '#000' },
  aiBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 12, margin: 16, marginBottom: 8, borderRadius: 8 },
  aiBannerText: { marginRight: 8, fontSize: 14, color: '#4CAF50', fontWeight: '500' },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 8, padding: 16, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, marginRight: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { flexDirection: 'row', alignItems: 'center' },
  infoLabelText: { fontSize: 14, color: '#666', marginRight: 4 },
  infoIcon: { marginRight: 4 },
  infoValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  categoryTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 8, borderRadius: 8, marginBottom: 8 },
  categoryTagText: { marginRight: 6, fontSize: 14, color: '#4CAF50', fontWeight: '500' },
  summaryText: { fontSize: 14, color: '#333', lineHeight: 22, textAlign: 'right' },
  keywordsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  keywordText: { fontSize: 12, color: '#4CAF50' },
  extractedText: { fontSize: 13, color: '#333', lineHeight: 20, textAlign: 'right' },
  notesText: { fontSize: 14, color: '#666', fontStyle: 'italic', textAlign: 'right' },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8, textAlign: 'right' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { flexDirection: 'row', backgroundColor: '#4CAF50', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', width: '100%' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  modalButtonCancel: { backgroundColor: '#f5f5f5' },
  modalButtonDelete: { backgroundColor: '#f44336' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});
