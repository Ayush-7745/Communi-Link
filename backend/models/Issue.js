import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  reportedBy: { type: String, required: true, index: true },
  reportedByName: String,
  assignedNgoId: { type: String, default: null, index: true },
  assignedNgoName: { type: String, default: null },
  assignedVolunteerId: { type: String, default: null, index: true },
  assignedVolunteerName: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'completed', 'verified'],
    default: 'pending',
    index: true,
  },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  locationAddress: String,
  geohash: { type: String, index: true },
  imageUrl: String,
  imageBlob: String,
  completionProofBlob: String,
  proofImages: [String],
  volunteerNotes: String,
  deadline: String,
  completedAt: Date,
  assignedAt: Date,
}, { timestamps: true, strict: false });

export default mongoose.model('Issue', issueSchema);
