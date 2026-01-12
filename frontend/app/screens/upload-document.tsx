import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [landType, setLandType] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('الصلاحيات', 'نحتاج إذن للوصول إلى الكاميرا والمعرض');
    }
  };

  React.useEffect(() => {
    requestPermissions();
  }, []);

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setFileData(result.assets[0].base64);
        setFileType('image');
        setFileName('صورة من الكاميرا');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل فتح الكاميرا');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setFileData(result.assets[0].base64);
        setFileType('image');
        setFileName(result.assets[0].fileName || 'صورة من المعرض');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل فتح المعرض');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setFileData(base64);
        setFileName(file.name);

        if (file.mimeType?.includes('pdf')) {
          setFileType('pdf');
        } else {
          setFileType('word');
        }
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل اختيار الملف');
    }
  };

  const handleUpload = async () => {
    if (!title || !fileData || !fileType) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان الوثيقة واختيار ملف');
      return;
    }

    setLoading(true);
    setProcessing(true);

    try {
      const response = await api.post('/documents', {
        title,
        description,
        file_type: fileType,
        file_data: fileData,
        category,
        owner_name: ownerName,
        land_type: landType,
        location,
        notes,
        uploaded_by: user?.id || '',
      });

      Alert.alert('نجاح', 'تم رفع الوثيقة ومعالجتها بالذكاء الاصطناعي', '', [
        {
          text: 'موافق',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('خطأ', error.response?.data?.detail || 'فشل رفع الوثيقة');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رفع وثيقة جديدة</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {processing && (
          <View style={styles.processingBanner}>
            <ActivityIndicator color="#4CAF50" />
            <Text style={styles.processingText}>جاري معالجة الوثيقة بالذكاء الاصطناعي...</Text>
          </View>
        )}

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>اختر ملف</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImageFromCamera}>
              <Ionicons name="camera" size={32} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>كاميرا</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={32} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>معرض الصور</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="document" size={32} color="#4CAF50" />
              <Text style={styles.uploadButtonText}>PDF/Word</Text>
            </TouchableOpacity>
          </View>

          {fileName && (
            <View style={styles.selectedFile}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.selectedFileText}>{fileName}</Text>
            </View>
          )}

          {fileData && fileType === 'image' && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${fileData}` }}
              style={styles.previewImage}
            />
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>معلومات الوثيقة</Text>

          <Text style={styles.label}>عنوان الوثيقة *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="أدخل عنوان الوثيقة"
            textAlign="right"
          />

          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="وصف مختصر للوثيقة"
            textAlign="right"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>الفئة</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="سند ملكية، عقد إيجار، إلخ"
            textAlign="right"
          />

          <Text style={styles.label}>اسم المالك</Text>
          <TextInput
            style={styles.input}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="اسم مالك الأرض"
            textAlign="right"
          />

          <Text style={styles.label}>نوع الأرض</Text>
          <TextInput
            style={styles.input}
            value={landType}
            onChangeText={setLandType}
            placeholder="زراعية، سكنية، تجارية"
            textAlign="right"
          />

          <Text style={styles.label}>الموقع</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="موقع الأرض"
            textAlign="right"
          />

          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات إضافية"
            textAlign="right"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>رفع ومعالجة بالذكاء الاصطناعي</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  processingText: {
    marginRight: 12,
    fontSize: 14,
    color: '#4CAF50',
  },
  uploadSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFileText: {
    marginRight: 8,
    fontSize: 14,
    color: '#4CAF50',
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  formSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
