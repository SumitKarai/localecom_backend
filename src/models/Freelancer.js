const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true // e.g., "Web Developer", "Graphic Designer"
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'Graphic Design', 'Digital Marketing', 'Content Writing', 'Photography', 'Video Editing', 'Tutoring', 'Consulting', 'Home Services', 'Beauty & Wellness', 'Fitness Training', 'Music & Arts', 'Legal Services', 'Accounting', 'Other']
  },
  
  // Location (can work remotely or locally)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  address: String,
  city: String,
  state: String,
  workLocation: {
    type: String,
    enum: ['Remote', 'On-site', 'Both'],
    default: 'Both'
  },
  serviceRadius: {
    type: Number,
    default: 25 // km for on-site services
  },
  
  // Contact information
  phone: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String,
    required: true
  },
  email: String,
  profilePicture: String,
  
  // Professional information
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: String,
    required: true,
    enum: ['Fresher', '1-2 years', '3-5 years', '5-10 years', '10+ years']
  },
  education: String,
  certifications: [String],
  languages: [String],
  
  // Pricing and availability
  hourlyRate: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  availability: {
    type: String,
    enum: ['Available', 'Busy', 'Unavailable'],
    default: 'Available'
  },
  workingHours: {
    monday: { available: { type: Boolean, default: true }, from: String, to: String },
    tuesday: { available: { type: Boolean, default: true }, from: String, to: String },
    wednesday: { available: { type: Boolean, default: true }, from: String, to: String },
    thursday: { available: { type: Boolean, default: true }, from: String, to: String },
    friday: { available: { type: Boolean, default: true }, from: String, to: String },
    saturday: { available: { type: Boolean, default: true }, from: String, to: String },
    sunday: { available: { type: Boolean, default: false }, from: String, to: String }
  },
  
  // Portfolio and social proof
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    projectUrl: String,
    completedDate: Date
  }],
  socialMedia: {
    linkedin: String,
    github: String,
    behance: String,
    dribbble: String,
    instagram: String,
    website: String
  },
  
  // Service details
  serviceTypes: [{
    name: String,
    description: String,
    price: Number,
    duration: String // e.g., "2-3 days", "1 week"
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalProjects: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: String,
    default: 'Within 24 hours'
  }
}, {
  timestamps: true
});

// Indexes
freelancerSchema.index({ location: '2dsphere' });
freelancerSchema.index({ category: 1 });
freelancerSchema.index({ skills: 1 });
freelancerSchema.index({ isActive: 1 });
freelancerSchema.index({ userId: 1 });
freelancerSchema.index({ city: 1, state: 1 });
freelancerSchema.index({ availability: 1 });
freelancerSchema.index({ hourlyRate: 1 });

module.exports = mongoose.model('Freelancer', freelancerSchema);