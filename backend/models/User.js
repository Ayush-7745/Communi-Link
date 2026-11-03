import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: String,
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, index: true },
  role: { type: String, required: true, enum: ['citizen', 'volunteer', 'ngo'], immutable: true },
  fullName: { type: String, default: '' },
  name: { type: String, default: '' },
  phone: String,
  profilePhoto: { type: String, default: null },
  points: { type: Number, default: 0 },
  location: mongoose.Schema.Types.Mixed,
  geohash: { type: String, index: true },
  skills: [String],
  availability: String,
  orgType: String,
  registrationNumber: String,
  orgAddress: String,
  yearEstablished: String,
  areaOfWork: String,
  inchargeName: String,
  inchargeEmail: String,
  inchargePhone: String,
  website: String,
}, {
  timestamps: true,
  strict: false,
  toJSON: {
    virtuals: true,
    transform(_document, result) {
      result.id = String(result._id);
      return result;
    },
  },
});

export default mongoose.model('User', userSchema);
