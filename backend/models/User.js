const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  profileStats: {
    tripsPlanned: {
      type: Number,
      default: 0
    },
    countriesVisited: {
      type: Number,
      default: 0
    },
    daysTraveled: {
      type: Number,
      default: 0
    },
    citiesVisited: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
