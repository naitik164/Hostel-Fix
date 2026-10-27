const mongoose = require('mongoose');

const hostelBlockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Block name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Block code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    totalRooms: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HostelBlock', hostelBlockSchema);
