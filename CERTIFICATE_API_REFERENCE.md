# Certificate API Reference

## Overview
The certificate system now supports **two modes**:
1. **Download Mode** (NEW): Returns PDF as base64 for in-app display and social sharing
2. **Email Mode** (Legacy): Sends PDF via email

---

## NEW Endpoints (For App Display & Sharing)

### 1. Download Standard Certificate
**GET** `/certification/download-certificate/:userId?`

**Response:**
```json
{
  "success": true,
  "pdfBase64": "JVBERi0xLjQKJeLj...",
  "fileName": "JuniorsCV-Certificate-John-Doe.pdf",
  "userName": "John Doe"
}
```

**Usage:** App decodes base64, displays PDF, enables sharing to LinkedIn/Facebook

---

### 2. Download 21-Days Certificate
**GET** `/certification/download-21days-certificate/:userId?`

**Response:**
```json
{
  "success": true,
  "pdfBase64": "JVBERi0xLjQKJeLj...",
  "fileName": "JuniorsCV-21Days-Certificate-John-Doe.pdf",
  "userName": "John Doe"
}
```

---

## Email Endpoints (Optional Feature)

### 3. Send Certificate via Email
**POST** `/certification/send-certificate-email/:userId?`

**Response:**
```json
{
  "success": true,
  "message": "Certificate sent via email",
  "messageId": "abc123@email.com"
}
```

---

### 4. Send 21-Days Certificate via Email
**POST** `/certification/send-21days-certificate-email/:userId?`

**Response:**
```json
{
  "success": true,
  "message": "Certificate sent via email",
  "messageId": "xyz789@email.com"
}
```

---

## Legacy Endpoints (Backward Compatibility)

### POST `/certification/generate-certificate/:userId?`
- Same as `send-certificate-email`
- Kept for backward compatibility

### POST `/certification/generate-21days-certificate/:userId?`
- Same as `send-21days-certificate-email`
- Kept for backward compatibility

---

## Utility Endpoints

### GET `/certification/sent-count/:userId?`
Returns how many times certificate was sent via email for the user

**Response:**
```json
{
  "success": true,
  "certificateSentCount": 3
}
```

---

## Frontend Integration Guide

### Step 1: Fetch Certificate
```javascript
const response = await api.get('/certification/download-certificate');
const { pdfBase64, fileName } = response.data;
```

### Step 2: Convert to File
```javascript
import * as FileSystem from 'expo-file-system';

const fileUri = FileSystem.documentDirectory + fileName;
await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
  encoding: FileSystem.EncodingType.Base64
});
```

### Step 3: Share on Social Media
```javascript
import * as Sharing from 'expo-sharing';

await Sharing.shareAsync(fileUri, {
  mimeType: 'application/pdf',
  dialogTitle: 'Share your certificate'
});
```

---

## Required Frontend Packages
```bash
expo install expo-sharing expo-file-system
npm install react-native-pdf react-native-share
```

---

## Notes
- All endpoints require authentication (`authMiddleware`)
- `:userId?` is optional - if not provided, uses authenticated user's ID
- PDF generation uses the same template for both standard and 21-days certificates
- Base64 encoding allows easy transmission and decoding on mobile devices
