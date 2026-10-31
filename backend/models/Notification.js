import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  issueId: String,
  read: { type: Boolean, default: false },
}, { timestamps: true, strict: false });

export default mongoose.model('Notification', notificationSchema);
