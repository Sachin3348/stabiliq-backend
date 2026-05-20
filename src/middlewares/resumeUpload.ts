import multer from 'multer';
import { Request } from 'express';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) {
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});
