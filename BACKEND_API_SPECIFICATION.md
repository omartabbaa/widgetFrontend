# Backend API Specification for File Upload & Question Generation

## Endpoint: POST /api/documents/upload

This endpoint handles file uploads and generates questions from the document content.

### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Headers**:
  - `Authorization`: Bearer {JWT_TOKEN}
  - `X-API-KEY`: {API_KEY}

### Form Data
- `file`: The document file (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)
- `businessId`: The business ID associated with the upload

### Response Format

#### Success Response (200 OK)
```json
{
  "status": "success",
  "documentId": "uuid-string",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "businessId": 2,
  "generatedQuestions": [
    "What are the main features of the product?",
    "How does the pricing structure work?",
    "What are the system requirements?",
    "How do I contact customer support?"
  ],
  "questionsGenerated": 4,
  "message": "Document processed successfully. 4 questions generated."
}
```

#### Error Response (400/500)
```json
{
  "status": "error",
  "message": "Error description",
  "errorCode": "VALIDATION_ERROR"
}
```

### Implementation Requirements

1. **File Processing**:
   - Extract text from uploaded documents
   - Support multiple file formats (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)
   - Handle file size limits (10MB max)

2. **Question Generation**:
   - Use AI/LLM to analyze document content
   - Generate relevant questions based on the content
   - Store questions in the database with proper business association

3. **Database Integration**:
   - Store document metadata
   - Store generated questions
   - Associate with business ID
   - Create proper relationships between documents, questions, and answers

4. **Security**:
   - Validate JWT token
   - Validate API key
   - Check business permissions
   - Sanitize file uploads

### Example Implementation Steps

1. **Create Document Entity**:
```java
@Entity
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Long businessId;
    private LocalDateTime uploadedAt;
    private String status;
}
```

2. **Create Question Generation Service**:
```java
@Service
public class QuestionGenerationService {
    
    public List<String> generateQuestionsFromDocument(String documentText, Long businessId) {
        // Use AI/LLM to analyze text and generate questions
        // Store questions in database
        // Return generated questions
    }
}
```

3. **Create Upload Controller**:
```java
@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    
    @PostMapping("/upload")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("businessId") Long businessId,
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-API-KEY") String apiKey) {
        
        // Validate authentication
        // Process file
        // Generate questions
        // Return response
    }
}
```

### Testing the Endpoint

You can test this endpoint using curl:

```bash
curl -X POST \
  http://localhost:8081/api/documents/upload \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -F 'file=@/path/to/your/document.pdf' \
  -F 'businessId=2'
```

### Integration with Existing System

1. **Questions Table**: Add generated questions to the existing questions table
2. **Answers Table**: Initially leave answers empty (can be filled manually or by AI)
3. **Business Association**: Ensure questions are properly associated with the business
4. **Embeddings**: After question generation, trigger embedding generation for new questions

This will complete the file upload and question generation workflow that was missing from your frontend. 