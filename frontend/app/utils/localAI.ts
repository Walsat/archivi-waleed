import TextRecognition from '@react-native-ml-kit/text-recognition';

// Local OCR using ML Kit
export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
};

// Local document classification using pattern matching
export const classifyDocument = (text: string, title: string): string => {
  const lowerText = text.toLowerCase() + ' ' + title.toLowerCase();
  
  // Define classification patterns
  const patterns = {
    'سند ملكية': ['سند', 'ملكية', 'تمليك', 'عقار', 'أرض', 'property', 'ownership'],
    'عقد إيجار': ['إيجار', 'استئجار', 'مستأجر', 'rent', 'lease', 'tenant'],
    'خريطة مساحية': ['خريطة', 'مساحة', 'حدود', 'قطعة', 'survey', 'map', 'plot'],
    'تقرير فني': ['تقرير', 'فني', 'دراسة', 'فحص', 'technical', 'report', 'inspection'],
    'طلب خدمة': ['طلب', 'خدمة', 'استمارة', 'نموذج', 'application', 'request', 'form'],
    'شهادة': ['شهادة', 'certificate', 'certification', 'document'],
  };

  let maxScore = 0;
  let bestCategory = 'أخرى';

  for (const [category, keywords] of Object.entries(patterns)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
};

// Extract keywords from text
export const extractKeywords = (text: string): string[] => {
  if (!text || text.length < 10) return [];

  // Remove common Arabic stop words
  const stopWords = [
    'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'أن', 'كان',
    'قد', 'لم', 'لن', 'إن', 'أو', 'لكن', 'بل', 'ثم', 'حتى', 'كل', 'بعض',
    'and', 'the', 'to', 'of', 'in', 'is', 'for', 'on', 'with'
  ];

  // Split text into words
  const words = text
    .split(/\s+/)
    .map(word => word.replace(/[.,!?;:()]/g, '').trim())
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word.toLowerCase()));

  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and get top 7
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([word]) => word);

  return sortedWords;
};

// Generate simple summary
export const generateSummary = (text: string, title: string): string => {
  if (!text || text.length < 20) {
    return `وثيقة بعنوان: ${title}`;
  }

  // Split into sentences
  const sentences = text.split(/[.۔।!؟]/g)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return `وثيقة ${title} تحتوي على ${text.split(/\s+/).length} كلمة`;
  }

  // Take first 2-3 sentences as summary
  const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
  let summary = summarySentences.join('. ');

  // Limit to 150 characters
  if (summary.length > 150) {
    summary = summary.substring(0, 147) + '...';
  }

  return summary;
};

// Extract owner name from text (simple pattern matching)
export const extractOwnerName = (text: string): string | null => {
  const patterns = [
    /اسم المالك[:\s]+([^\n.،]+)/i,
    /المالك[:\s]+([^\n.،]+)/i,
    /صاحب العقار[:\s]+([^\n.،]+)/i,
    /owner[:\s]+([^\n.،]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Extract location from text
export const extractLocation = (text: string): string | null => {
  const patterns = [
    /الموقع[:\s]+([^\n.،]+)/i,
    /العنوان[:\s]+([^\n.،]+)/i,
    /المنطقة[:\s]+([^\n.،]+)/i,
    /location[:\s]+([^\n.،]+)/i,
    /address[:\s]+([^\n.،]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Extract land type from text
export const extractLandType = (text: string): string | null => {
  const types = {
    'زراعية': ['زراعة', 'زراعي', 'مزرعة', 'agricultural', 'farm'],
    'سكنية': ['سكني', 'سكن', 'منزل', 'بيت', 'residential', 'housing'],
    'تجارية': ['تجاري', 'محل', 'commercial', 'business'],
    'صناعية': ['صناعي', 'مصنع', 'industrial', 'factory'],
  };

  const lowerText = text.toLowerCase();
  
  for (const [type, keywords] of Object.entries(types)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return type;
      }
    }
  }

  return null;
};

// Process document with local AI
export const processDocumentWithLocalAI = async (
  fileData: string,
  fileType: string,
  title: string
): Promise<{
  extracted_text: string;
  summary: string;
  auto_category: string;
  keywords: string[];
  owner_name?: string;
  location?: string;
  land_type?: string;
}> => {
  try {
    let extractedText = '';

    // Extract text based on file type
    if (fileType === 'image') {
      // For image, we need to use ML Kit OCR
      // Convert base64 to temp file for ML Kit
      const FileSystem = require('expo-file-system');
      const tempPath = `${FileSystem.cacheDirectory}temp_image.jpg`;
      await FileSystem.writeAsStringAsync(tempPath, fileData, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      extractedText = await extractTextFromImage(tempPath);
      
      // Clean up temp file
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    } else if (fileType === 'pdf' || fileType === 'word') {
      // For PDF/Word, we can't extract text easily on mobile without server
      // We'll just use the title and user-provided info
      extractedText = `وثيقة ${fileType} بعنوان: ${title}`;
    }

    // Classify document
    const autoCategory = classifyDocument(extractedText, title);

    // Generate summary
    const summary = generateSummary(extractedText, title);

    // Extract keywords
    const keywords = extractKeywords(extractedText);

    // Extract additional info
    const ownerName = extractOwnerName(extractedText);
    const location = extractLocation(extractedText);
    const landType = extractLandType(extractedText);

    return {
      extracted_text: extractedText.substring(0, 5000), // Limit size
      summary,
      auto_category: autoCategory,
      keywords,
      ...(ownerName && { owner_name: ownerName }),
      ...(location && { location }),
      ...(landType && { land_type: landType }),
    };
  } catch (error) {
    console.error('Error processing document with local AI:', error);
    return {
      extracted_text: '',
      summary: `وثيقة ${title}`,
      auto_category: 'أخرى',
      keywords: [],
    };
  }
};
