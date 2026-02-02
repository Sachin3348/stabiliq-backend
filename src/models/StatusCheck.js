const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const statusCheckSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  client_name: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'status_checks'
});

// Exclude _id and __v from JSON output
statusCheckSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const StatusCheck = mongoose.model('StatusCheck', statusCheckSchema);

module.exports = StatusCheck;
