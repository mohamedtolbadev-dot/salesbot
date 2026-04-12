# 🎙️ Voice Message Debugging Guide

## Overview
If voice messages from your agents are not reaching customers on WhatsApp, use this guide to diagnose the issue step-by-step.

---

## **Test 1: Browser & Audio Codec Support** (Client-Side)

### Step 1: Open Browser Console
1. Open the dashboard in your browser
2. Press `F12` or `Ctrl+Shift+I` to open Developer Tools
3. Go to **Console** tab
4. **Make sure you don't see any red errors**

### Step 2: Run Browser Detection
Copy and paste this into the console:
```javascript
// Detect browser and audio codec support
const ua = navigator.userAgent.toLowerCase()
let browserName = "Unknown"
if (ua.includes("firefox")) browserName = "Firefox"
else if (ua.includes("safari") && !ua.includes("chrome")) browserName = "Safari"
else if (ua.includes("chrome")) browserName = "Chrome"
else if (ua.includes("edge")) browserName = "Edge"

console.log("🌐 Browser:", browserName)
console.log("📊 Audio Codec Support:")
console.log("  • OGG/Opus:", MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "✅" : "❌")
console.log("  • MP4/AAC:", MediaRecorder.isTypeSupported("audio/mp4;codecs=mp4a.40.2") ? "✅" : "❌")
console.log("  • WebM/Opus:", MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "✅" : "❌")
```

**Expected output (Chrome):**
```
🌐 Browser: Chrome
📊 Audio Codec Support:
  • OGG/Opus: ❌
  • MP4/AAC: ❌
  • WebM/Opus: ✅
```

**Expected output (Firefox):**
```
🌐 Browser: Firefox
📊 Audio Codec Support:
  • OGG/Opus: ✅
  • MP4/AAC: ❌
  • WebM/Opus: ✅
```

**Expected output (Safari):**
```
🌐 Browser: Safari
📊 Audio Codec Support:
  • OGG/Opus: ✅
  • MP4/AAC: ✅
  • WebM/Opus: ❌
```

### ✅ Pass Criteria
- If using **Chrome** and OGG support is ❌: This is NORMAL (Chrome uses WebM, FFmpeg converts)
- If using **Firefox** and OGG support is ✅: GOOD (no conversion needed)
- If using **Safari** and MP4 support is ✅: GOOD (no conversion needed)

### ⛔ Fail Criteria
- If NO audio codecs are supported: **Browser too old or no MediaRecorder API**
  - **Solution:** Update browser to latest version

---

## **Test 2: Voice Recording & FFmpeg Conversion** (Client-Side)

### Step 1: Monitor Console During Recording
1. Open Console (F12 → Console)
2. In the dashboard, click the **microphone button** to start recording
3. Speak a short message (5 seconds minimum)
4. Click **Stop** or **Cancel to send**
5. Watch for these console logs:

### Expected Chrome Flow
```
⚠️ WebM detected - attempting FFmpeg conversion...
📁 Recording stopped. MIME type: audio/webm;codecs=opus
📦 Blob created: size=XXXX bytes, type=audio/webm;codecs=opus
🎯 Starting WebM→OGG conversion... (blob size: XXXX bytes, type: audio/webm;codecs=opus)
✅ FFmpeg loaded successfully
📝 Writing WebM file to FFmpeg (in_1234567890.webm)...
🔄 Running FFmpeg conversion (libopus codec, 48kbps)...
📥 Reading converted OGG file (out_1234567890.ogg)...
✅ Conversion successful! OGG size: YYYY bytes
🗑️ Cleaning up temporary files...
🎉 Final OGG blob created (type: audio/ogg, size: YYYY bytes)
📤 Preparing to send audio... (ext=ogg, MIME=audio/ogg)
```

### Expected Firefox/Safari Flow
```
📁 Recording stopped. MIME type: audio/ogg;codecs=opus
📦 Blob created: size=XXXX bytes, type=audio/ogg;codecs=opus
📤 Preparing to send audio... (ext=ogg, MIME=audio/ogg)
(No FFmpeg conversion needed!)
```

### ⛔ If You See These Errors

**❌ "FFmpeg timeout"**
- FFmpeg library failed to load
- Try: Refresh page, clear browser cache, update Chrome

**❌ "Conversion produced empty file"**
- FFmpeg conversion failed
- Try: Use Firefox or Safari instead, or update Chrome

**❌ "Blob type mismatch"**
- Conversion happened but produced wrong type
- Try: Reload page, use different browser

---

## **Test 3: Check API Request** (Network)

### Step 1: Monitor Network Tab
1. Open DevTools → **Network** tab
2. Filter by **Fetch/XHR**
3. Record a voice message and send it
4. Look for request to `/api/conversations/[id]/send-audio`

### Step 2: Inspect the Request
Click on the request and check:

**Headers:**
```
POST /api/conversations/12345/send-audio
Authorization: Bearer <your-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
audio: Blob (audio/ogg, ~15KB)
```

### ✅ Pass Criteria
- Status: **201 Created** (success)
- Response contains `whatsappMediaId`

### ⛔ Fail Criteria
- Status **401**: Authentication failed → Check token in localStorage
- Status **415**: MIME type not supported → FFmpeg conversion failed
- Status **500**: Server error → Check Vercel logs
- Response has NULL `mediaId` → WhatsApp upload failed

---

## **Test 4: Check Database** (Database)

### Verify Message Saved with mediaId
Run this query in your database tool (MySQL):

```sql
SELECT 
  id,
  conversationId,
  role,
  content,
  whatsappMediaId,
  createdAt
FROM messages 
WHERE role = 'AGENT' 
  AND content = '[رسالة صوتية]'
ORDER BY createdAt DESC 
LIMIT 5;
```

### ✅ Pass Criteria
- `whatsappMediaId` is NOT NULL
- Value looks like: `123456789011223334455`

### ⛔ Fail Criteria
- `whatsappMediaId` is NULL → Upload to WhatsApp failed
- Column doesn't exist → Database schema not migrated

### If mediaId is NULL
Run this to see the error in send-audio logs:
Check Vercel or your server logs for these patterns:
- `❌ UPLOAD FAILED` - WhatsApp upload failed
- `❌ TOKEN EXPIRED or INVALID` - Agent's WhatsApp token expired
- `❌ NO MEDIA ID RETURNED` - WhatsApp didn't return mediaId

---

## **Test 5: Verify WhatsApp Credentials** (Configuration)

### Check Agent Configuration
```sql
SELECT 
  id,
  name,
  whatsappPhoneId,
  whatsappToken,
  createdAt
FROM agents 
WHERE userId = '<your-user-id>' 
LIMIT 1;
```

### ✅ Pass Criteria
- `whatsappPhoneId`: Not empty, looks like `123456789012345`
- `whatsappToken`: Not empty, starts with `EAA...`

### ⛔ Fail Criteria
- Either field is NULL or empty
- Token looks truncated or malformed

### If Credentials Look Wrong
1. Go to **WhatsApp Business Platform** (business.facebook.com)
2. Navigate to **WhatsApp → Getting Started**
3. Copy the correct:
   - **Phone Number ID** (numeric)
   - **Temporary access token** (Bearer token)
4. Update in database:
```sql
UPDATE agents 
SET whatsappPhoneId = 'YOUR_PHONE_ID',
    whatsappToken = 'YOUR_TOKEN'
WHERE userId = 'YOUR_USER_ID';
```

---

## **Test 6: Test Text Message First** (WhatsApp API)

### Verify API is Working
If audio isn't sent, first verify text messages work.

**In Dashboard:**
1. Click on a conversation
2. Type regular text message
3. Send it
4. **Does the customer receive it?**

### ✅ If Text Message Works
- WhatsApp token is valid ✅
- Phone ID is correct ✅
- Customer phone format is correct ✅
- Problem is specifically with audio upload or conversion

### ⛔ If Text Message FAILS
- WhatsApp token is expired or invalid
- Phone ID is wrong
- Customer phone number format is wrong

---

## **Test 7: Check Customer Phone Format** (Input Validation)

### Get Customer Phone
```sql
SELECT 
  id,
  name,
  phone,
  createdAt
FROM customers 
WHERE agentId IN (
  SELECT id FROM agents WHERE userId = 'YOUR_USER_ID'
)
LIMIT 5;
```

### ✅ Pass Criteria - Phone Format
- **Morocco**: `212612345678` (include country code, no +)
- **Egypt**: `201001234567`
- **UAE**: `971501234567`
- **Any Country**: `[country_code][area_code][number]` (all digits, no + or spaces)

### ⛔ Fail Criteria
- Contains spaces: `212 61 234 5678`
- Contains +: `+212612345678`
- Contains hyphens: `212-61-234-5678`
- Contains country name: `Morocco 212...`

### If Format is Wrong
```sql
UPDATE customers 
SET phone = '212612345678'
WHERE id = 'CUSTOMER_ID';
```

---

## **Test 8: Manual End-to-End Test** (Integration)

### Step-by-Step Manual Test
1. **Record audio** in Chrome
   - Click mic → Record 5 seconds → Click send
   - Duration: ~5-10 seconds total
   
2. **Check browser console**
   - Look for `✅ Conversion successful in XXXms`
   - Look for `✅ Voice message sent successfully!`
   
3. **Check Network tab**
   - Request to `/api/conversations/.../send-audio` should be **201**
   
4. **Check database**
   - Query messages table → New message should have `whatsappMediaId`
   
5. **Check Vercel logs**
   - Look for `✅ Voice uploaded successfully (mediaId: ...)`
   - Look for `✅ Voice message sent successfully to customer`
   
6. **Check customer WhatsApp**
   - Wait 30 seconds
   - Customer should receive audio message
   - If not → Check Vercel error logs for `❌ SEND FAILED`

---

## **Troubleshooting Matrix**

| Issue | Logs Show | Solution |
|-------|-----------|----------|
| Conversion fails in browser | `❌ FFmpeg conversion failed` | Use Firefox/Safari or update Chrome |
| WebM reaches backend | `❌ REJECTED: WebM received` | FFmpeg didn't convert - browser issue |
| Upload to WhatsApp fails | `❌ UPLOAD FAILED` | Check WhatsApp token/phone ID |
| Token is invalid | `❌ TOKEN EXPIRED or INVALID` | Regenerate token in Facebook Business |
| Message sent but not received | `✅ Voice message sent successfully` | Check customer phone format |
| Database mediaId is NULL | Query returns NULL | Conversion or upload failed - check logs |
| Permission denied | Console: no microphone access | Grant microphone permission |

---

## **Quick Debug Checklist**

- [ ] Firefox/Safari browsers work ✓
- [ ] Chrome shows FFmpeg loading
- [ ] FFmpeg conversion completes without errors
- [ ] Text messages send to customer successfully
- [ ] Browser console shows no red errors
- [ ] Network tab shows 201 response
- [ ] Database shows whatsappMediaId (not NULL)
- [ ] Customer phone format is correct
- [ ] WhatsApp token is not expired
- [ ] Vercel logs show "Voice sent successfully"

---

## **Getting Help**

If you're still stuck, provide these details:
1. **Browser**: (Chrome/Firefox/Safari/Edge)
2. **Browser Version**: (from `?` → About)
3. **Full console error message**: (copy entire red error)
4. **Vercel log snippet**: (from `❌ UPLOAD/SEND FAILED` line)
5. **Database query result**: (screenshot of whatsappMediaId value)

---

## **Common Solutions**

### Solution 1: Update Browser
```bash
# Chrome: Menu → Help → About Chrome (auto-updates)
# Firefox: Menu → Help → About Firefox
# Safari: App Store → Updates tab
```

### Solution 2: Clear Browser Cache
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete  
- Safari: Develop → Empty Web Cache

### Solution 3: Regenerate WhatsApp Token
1. Go to https://business.facebook.com
2. Select your app
3. WhatsApp → Getting Started
4. Copy new token
5. Update in database

### Solution 4: Check Phone Format
```javascript
// Copy to console to format phone number:
const phone = "+1-201-555-0123";
console.log(
  phone.replace(/\D/g, '')  // Remove all non-digits
        .replace(/^1/, '')   // Remove US country code if first
)
// Result: 2015550123
```

---

**Last Updated**: 2025-04-02
**Version**: 1.0
