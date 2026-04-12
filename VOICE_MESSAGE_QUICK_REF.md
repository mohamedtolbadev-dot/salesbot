# 🎙️ Voice Message Quick Reference

## Most Common Issues & Solutions

### ❌ Browser Shows "فشل الاتصال" (Connection Failed)
**Symptoms**: Message fails immediately, no logs visible
**Causes**: Network issue, wrong authentication
**Solution**:
1. Check internet connection: Open google.com
2. Reload dashboard: `F5` or `Ctrl+R`
3. Clear cache: `Ctrl+Shift+Delete`
4. Try different browser: Firefox or Safari

---

### ❌ FFmpeg Conversion Timeout
**Symptoms**: Console shows "FFmpeg timeout" error
**Causes**: FFmpeg not loading (maybe on Vercel serverless timeout?)
**Solution**:
1. Reload page: `F5`
2. Try again (second attempt usually works)
3. Use Firefox/Safari (no conversion needed)

---

### ❌ "WebM REJECTED: Conversion should have happened"
**Symptoms**: Backend error about WebM being received
**Causes**: Client-side FFmpeg conversion failed silently, WebM sent to backend
**Solution**:
1. Open Console (F12)
2. Look for red error in FFmpeg section
3. Try Firefox or Safari
4. If still fails: Update Chrome to latest version

---

### ❌ Database shows `whatsappMediaId: NULL`
**Symptoms**: Message saved but no mediaId
**Causes**: WhatsApp upload failed (token/phone issue)
**Solution**:
1. Check Vercel logs for "❌ UPLOAD FAILED"
2. Verify WhatsApp token: Not expired?
3. Verify agent phone ID: Not NULL?
4. Regenerate token in Facebook Business

---

### ❌ Backend logs "TOKEN EXPIRED or INVALID"
**Symptoms**: Upload fails with 401 error
**Causes**: WhatsApp token expired or wrong
**Solution**:
1. Go to https://business.facebook.com
2. Select app → WhatsApp → Getting Started
3. Copy new "Temporary access token"
4. Update database:
   ```sql
   UPDATE agents 
   SET whatsappToken = 'YOUR_NEW_TOKEN'
   WHERE userId = 'YOUR_USER_ID';
   ```
5. Restart agents/connections

---

### ❌ Message sent but customer doesn't receive
**Symptoms**: Backend shows "✅ sent successfully" but customer WhatsApp empty
**Causes**: Customer phone number format wrong
**Solution**:
1. Check customer phone: Format should be `212612345678`
2. Not: `+212612345678`, `212 61 234 5678`, `212-61-2345678`
3. Must include country code (212=Morocco, 201=Egypt, 971=UAE)
4. All digits, no symbols or spaces
5. Update if needed:
   ```sql
   UPDATE customers 
   SET phone = '212612345678'
   WHERE id = 'CUSTOMER_ID';
   ```

---

## Browser-Specific Fixes

### ✅ Chrome
| Issue | Fix |
|-------|-----|
| FFmpeg not loading | Refresh page, try again |
| Conversion timeout | Use Firefox or Safari |
| Works in Firefox? | Chrome issue - update browser |

### ✅ Firefox
| Issue | Fix |
|-------|-----|
| Works fast (no conversion) | ✅ Preferred browser |
| Doesn't work? | Check WhatsApp token/phone |

### ✅ Safari
| Issue | Fix |
|-------|-----|
| Works fast (no conversion) | ✅ Preferred browser |
| Doesn't work? | Check WhatsApp token/phone |

### ❌ Edge
| Issue | Fix |
|-------|-----|
| May have issues | Try Chrome, Firefox, Safari |

---

## Testing Checklist (2 minutes)

- [ ] **Step 1**: Record voice in Firefox (1 min)
  - Works? → Issue is Chrome-specific
  - Fails? → Continue to Step 2

- [ ] **Step 2**: Check database (30 sec)
  ```sql
  SELECT whatsappMediaId FROM messages 
  WHERE role = 'AGENT' 
  ORDER BY createdAt DESC LIMIT 1;
  ```
  - Not NULL? → Message reached WhatsApp
  - NULL? → Upload failed

- [ ] **Step 3**: Check Vercel logs (30 sec)
  - Look for `❌ UPLOAD FAILED` or `❌ SEND FAILED`
  - Shows error code and message

---

## Quick Fixes (Ranked by Probability)

1. **⚡ Most Likely**: Customer phone format wrong
   - Fix: Format as `212612345678` (no +, spaces, dashes)

2. **⚡ Likely**: WhatsApp token expired
   - Fix: Regenerate token in Facebook Business

3. **⚡ Likely**: Chrome FFmpeg conversion failing
   - Fix: Use Firefox/Safari or update Chrome

4. **⚡ Possible**: Agent phone ID wrong
   - Fix: Verify `whatsappPhoneId` in database

5. **⚡ Possible**: Network/API issue
   - Fix: Reload page, clear cache, try again

---

## Database Queries for Debugging

### Check Agent Setup
```sql
SELECT whatsappPhoneId, whatsappToken 
FROM agents WHERE userId = 'YOUR_USER_ID';
```
Both should NOT be empty/NULL

### Check Customer Phone Format
```sql
SELECT phone FROM customers 
WHERE id = 'CUSTOMER_ID';
```
Should look like: `212612345678`

### Check Message Audio Upload
```sql
SELECT id, whatsappMediaId, createdAt 
FROM messages 
WHERE role = 'AGENT' AND content = '[رسالة صوتية]'
ORDER BY createdAt DESC LIMIT 5;
```
`whatsappMediaId` should NOT be NULL

### Update Agent Token
```sql
UPDATE agents 
SET whatsappToken = 'NEW_TOKEN_HERE'
WHERE userId = 'YOUR_USER_ID';
```

### Fix Customer Phone
```sql
UPDATE customers 
SET phone = '212612345678'
WHERE id = 'CUSTOMER_ID';
```

---

## Console Commands for Testing

### Test Browser Codec Support
```javascript
console.log("OGG/Opus:", MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "✅" : "❌")
console.log("MP4/AAC:", MediaRecorder.isTypeSupported("audio/mp4;codecs=mp4a.40.2") ? "✅" : "❌")
console.log("WebM/Opus:", MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "✅" : "❌")
```

### Get Browser Name
```javascript
const ua = navigator.userAgent.toLowerCase()
if (ua.includes("firefox")) console.log("Firefox")
else if (ua.includes("safari") && !ua.includes("chrome")) console.log("Safari")
else if (ua.includes("chrome")) console.log("Chrome")
else if (ua.includes("edge")) console.log("Edge")
```

### Check Auth Token
```javascript
const token = localStorage.getItem("token")
console.log(token ? "✅ Token exists" : "❌ No token")
console.log("Token starts with:", token?.substring(0, 10) + "...")
```

---

## When to Contact Support

**Have ready:**
1. Browser name + version (Help → About)
2. Full console error (red text, copy entire message)
3. Database query result (whatsappMediaId value or NULL)
4. Network tab response (Status code from send-audio request)
5. Vercel log snippet (from "❌ UPLOAD/SEND FAILED" line)

**OR:** Share **video recording** showing:
1. Recording voice
2. Console logs appearing
3. Network request response
4. Error message displayed

---

## Prevention Tips

- ✅ Use Firefox or Safari (no conversion needed, fewer issues)
- ✅ Keep browser updated (Chrome needs latest for WebM support)
- ✅ Test text message first (verify WhatsApp token before testing audio)
- ✅ Check phone format beforehand (all digits, no symbols)
- ✅ Monitor Vercel logs while testing (catch errors immediately)
- ✅ Clear cache weekly (prevents stale data issues)

---

## Reference: Phone Number Formats

| Country | Format | Example |
|---------|--------|---------|
| Morocco | 212... | 212612345678 |
| Egypt | 201... | 201001234567 |
| UAE | 971... | 971501234567 |
| Saudi Arabia | 966... | 966501234567 |
| Kuwait | 965... | 965501234567 |
| Tunisia | 216... | 216201234567 |
| Algeria | 213... | 213612345678 |

**Rule**: [country_code][number] - all digits, no + or spaces

---

## Useful Links

- **WhatsApp API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Browser Compatibility**: https://caniuse.com/mediarecorder
- **FFmpeg.js Docs**: https://github.com/ffmpegjs/ffmpeg.js
- **Debug Guide**: See VOICE_MESSAGE_DEBUG_GUIDE.md in project root

---

**Last Updated**: 2025-04-02
**Version**: 1.0
**Status**: Ready for production use
