const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');

const router = express.Router();

// Get user profile with statistics
router.get('/', auth, async (req, res) => {
  try {
    // Get user data
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user's itineraries count
    const itinerariesCount = await Itinerary.countDocuments({ 
      userId: req.user._id
    });
    
    // Get user's itineraries to calculate stats
    const userItineraries = await Itinerary.find({ 
      userId: req.user._id
    });
    
    let totalDaysTraveled = 0;
    let uniqueCities = new Set();
    
    userItineraries.forEach(itinerary => {
      const days = itinerary.tripPlan?.daily_plans?.length || 0;
      totalDaysTraveled += days;
      
      // Extract destination
      const destination = itinerary.destination;
      uniqueCities.add(destination);
    });
    
    // Update user profile stats
    user.profileStats = {
      tripsPlanned: itinerariesCount,
      countriesVisited: uniqueCities.size,
      daysTraveled: totalDaysTraveled,
      citiesVisited: uniqueCities.size
    };
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          joinedDate: user.joinedDate,
          profileStats: user.profileStats
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is already taken' 
        });
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's recent activity
router.get('/activity', auth, async (req, res) => {
  try {
    // Get recent itineraries
    const recentItineraries = await Itinerary.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('destination createdAt tripPlan');
    
    // Format activities
    const activities = [];
    
    recentItineraries.forEach(itinerary => {
      activities.push({
        type: 'itinerary',
        title: `Planned trip to ${itinerary.destination}`,
        description: `${itinerary.tripPlan?.daily_plans?.length || 0} days itinerary`,
        timestamp: itinerary.createdAt,
        status: 'planned'
      });
    });
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
