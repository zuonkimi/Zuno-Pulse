const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadPath = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // FIX ĐÚNG
    file._originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    cb(null, uniqueName + ext);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed =
    file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  if (!allowed) {
    return cb(new Error('Only images & PDF allowed'), false);
  }
  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = upload;
