const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    // ROLE
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ACCOUNT STATUS
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    banReason: {
      type: String,
      default: '',
    },
    // BASIC INFO
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === 'local';
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: '/uploads/defaultavt.jpg',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 300,
    },
    // AUTH PROVIDER
    provider: {
      type: String,
      enum: ['local', 'google', 'line', 'facebook'],
      default: 'local',
    },
    // SOCIAL LOGIN IDS
    googleId: String,
    lineId: String,
    facebookId: String,
    // CONNECTED ACCOUNTS
    connectedAccounts: {
      google: {
        type: Boolean,
        default: false,
      },
      line: {
        type: Boolean,
        default: false,
      },
      facebook: {
        type: Boolean,
        default: false,
      },
      github: {
        type: Boolean,
        default: false,
      },
    },
    // EMAIL VERIFICATION
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    // RESET PASSWORD
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // UI SETTINGS
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    accentColor: {
      type: String,
      default: '#f2f2f2',
    },
    // LAST LOGIN
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // SOFT DELETE
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', UserSchema);
