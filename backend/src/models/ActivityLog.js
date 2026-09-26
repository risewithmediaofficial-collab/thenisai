import mongoose from 'mongoose';

const performedBySchema = new mongoose.Schema({
  id: String,
  name: String,
  username: String,
  role: String,
  title: String,
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actionType: { type: String, required: true },
  performedBy: { type: performedBySchema, required: true },
  targetId: { type: String, default: '' },
  targetName: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  reason: { type: String, default: '' },
  timestamp: { type: Number, default: Date.now },
  dateStr: String,
  timeStr: String,
}, { strict: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
