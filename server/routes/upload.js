const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../config/db');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');
const path = require('path');

// Configure multer to use RAM (we don't want to save to local disk, but stream it directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max file size
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// POST /api/upload/image
router.post('/image', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const uniqueName = crypto.randomBytes(16).toString('hex') + fileExtension;
    const filePath = `images/${req.user._id}/${uniqueName}`;

    // Upload to Supabase 'uploads' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return res.status(500).json({ success: false, message: 'Image upload failed' });
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    res.status(200).json({
      success: true,
      url: publicUrlData.publicUrl,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ success: false, message: 'Server error during file upload' });
  }
});

module.exports = router;
