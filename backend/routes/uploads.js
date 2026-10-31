import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { createReadSasUrl, getBlobStorage, isValidBlobName } from '../services/blobStorage.js';
import { sendClientError } from '../utils/httpResponse.js';

const router = Router();
const maxImageSize = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageSize, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, and WebP images are allowed.');
      error.status = 415;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

function detectImage(buffer) {
  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer.subarray(1, 4).toString() === 'PNG'
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a
  ) return { extension: 'png', contentType: 'image/png' };
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    return { extension: 'webp', contentType: 'image/webp' };
  }
  return null;
}

function sendUploadError(req, res, error) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be 5 MB or smaller.' });
    }
    return sendClientError(req, res, 400, 'Upload exactly one image file.', 'invalid_upload_fields');
  }
  if (error.status) {
    if (error.status === 400) {
      return sendClientError(req, res, 400, error.message, 'invalid_upload');
    }
    return res.status(error.status).json({ error: error.message });
  }
  if (error.code === 'AZURE_STORAGE_NOT_CONFIGURED' || error.code === 'AZURE_STORAGE_CONFIGURATION_INVALID') {
    return res.status(503).json({ error: 'Image storage is not configured correctly on the server.' });
  }
  return res.status(502).json({ error: 'Image storage is temporarily unavailable.' });
}

router.post('/', (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      sendUploadError(req, res, uploadError);
      return;
    }

    try {
      if (!req.file) {
        return sendClientError(req, res, 400, 'An image file is required.', 'image_file_missing');
      }
      const imageType = detectImage(req.file.buffer);
      if (!imageType || req.file.mimetype !== imageType.contentType) {
        return res.status(415).json({ error: 'The file must be a valid JPG, PNG, or WebP image.' });
      }

      const blobName = `${randomUUID()}.${imageType.extension}`;
      const { containerClient } = await getBlobStorage();
      await containerClient.getBlockBlobClient(blobName).uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: imageType.contentType },
        metadata: { owneruid: req.uid },
      });

      res.status(201).json({ blobName });
    } catch (error) {
      sendUploadError(req, res, error);
    }
  });
});

router.get('/:blobName/url', async (req, res) => {
  try {
    const { blobName } = req.params;
    if (!isValidBlobName(blobName)) {
      return sendClientError(req, res, 400, 'Invalid image reference.', 'invalid_blob_name');
    }

    const [issue, profile] = await Promise.all([
      Issue.findOne({ $or: [{ imageBlob: blobName }, { completionProofBlob: blobName }] }).lean(),
      User.findOne({ userId: req.uid }).select('role').lean(),
    ]);
    if (!issue || !profile) return res.status(404).json({ error: 'Image not found.' });

    const canRead = issue.reportedBy === req.uid
      || issue.assignedVolunteerId === req.uid
      || issue.assignedNgoId === req.uid
      || profile.role === 'ngo'
      || (profile.role === 'volunteer' && ['approved', 'assigned', 'completed', 'verified'].includes(issue.status));
    if (!canRead) return sendClientError(req, res, 403, 'You cannot view this image.', 'image_access_denied');

    const url = await createReadSasUrl(blobName);
    res.json({ url, expiresInSeconds: 900 });
  } catch (error) {
    sendUploadError(req, res, error);
  }
});

export default router;
