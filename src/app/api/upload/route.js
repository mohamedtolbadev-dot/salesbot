import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/auth';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // Verify user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'نوع الملف غير مسموح به. الأنواع المسموحة: JPEG, PNG, WebP, GIF' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'حجم الملف كبير جداً. الحد الأقصى: 5 ميجابايت' 
      }, { status: 400 });
    }

    // Validate file name (prevent path traversal)
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!fileName || fileName.length === 0) {
      return NextResponse.json({ error: 'اسم الملف غير صالح' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary with security options
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'salesbot/products',
      resource_type: 'image',
      // Security options
      moderation: 'aws_rek', // Auto-moderate images
      allowed_formats: ['jpg', 'png', 'webp', 'gif'],
      max_file_size: MAX_FILE_SIZE,
    });

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' }, 
      { status: 500 }
    );
  }
}
