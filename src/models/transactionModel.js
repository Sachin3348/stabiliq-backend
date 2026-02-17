const mongoose = require('mongoose');
const { PAYMENT_STATUS, TRANSACTION_TYPE } = require('../utils/constants');
const objectId = mongoose.Schema.Types.ObjectId;

const paymentTransactionSchema = new mongoose.Schema(
  {
    merchantTransactionId: {
      type: String,
      trim: true,
    },
    merchantId: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    userId: {
      type: objectId,
      trim: true,
      ref: 'User',
    },
    amount: {
      type: Number,
    },
    phonepeTransactionId: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPE),
    },
    refundId: {
      type: objectId,
      ref: 'payment-transaction',
    },
    isUiCallbackProcessed: {
      type: Boolean,
      default: false,
    },
    paymentInstrument: mongoose.Schema.Types.Mixed,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isApplicationFeeProcessed: {
      type: Boolean,
      default: false,
    },
    gatewayOrderId: String,
    plan: {
      enum: ['basic', 'pro'],
    },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ merchantTransactionId: 1 });
module.exports = mongoose.model('payment-transaction', paymentTransactionSchema);
