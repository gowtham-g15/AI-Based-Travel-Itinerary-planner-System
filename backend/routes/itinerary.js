const express = require('express');
const auth = require('../middleware/auth');
const Itinerary = require('../models/Itinerary');
const TravelPlannerService = require('../../ml_models/travel_planner_service');

const router = express.Router();
const planner = new TravelPlannerService();

// Generate AI-powered trip plan
router.post('/generate', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;

        // Validate required fields
        const requiredFields = ['startDate', 'endDate', 'numberOfTravelers', 'budget'];
        const missingFields = requiredFields.filter(field => !preferences[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }

        // Calculate trip duration
        const start = new Date(preferences.startDate);
        const end = new Date(preferences.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Prepare preferences for AI - pass interests directly
        const aiPreferences = {
            interests: preferences.interests || [],  // Pass interests array directly
            min_rating: preferences.minRating || 3.5,
            budget: preferences.budget
        };

        // Generate trip plan using AI
        const tripPlan = planner.generateTripPlan(aiPreferences, days);

        if (tripPlan.error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate trip plan',
                error: tripPlan.error
            });
        }

        // Save itinerary to database
        const itinerary = new Itinerary({
            userId,
            destination: preferences.destination || 'Coimbatore',
            startDate: preferences.startDate,
            endDate: preferences.endDate,
            numberOfTravelers: preferences.numberOfTravelers,
            budget: preferences.budget,
            tripPlan: tripPlan,
            preferences: preferences,
            createdAt: new Date()
        });

        await itinerary.save();

        res.status(200).json({
            success: true,
            message: 'Trip plan generated successfully',
            data: {
                itineraryId: itinerary._id,
                tripPlan: tripPlan
            }
        });

    } catch (error) {
        console.error('Error generating trip plan:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get user's itineraries
router.get('/user', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const itineraries = await Itinerary.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: itineraries
        });
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get specific itinerary
router.get('/:id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const itinerary = await Itinerary.findOne({ 
            _id: req.params.id, 
            userId 
        });

        if (!itinerary) {
            return res.status(404).json({
                success: false,
                message: 'Itinerary not found'
            });
        }

        res.status(200).json({
            success: true,
            data: itinerary
        });
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Delete itinerary
router.delete('/:id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await Itinerary.deleteOne({ 
            _id: req.params.id, 
            userId 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Itinerary not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Itinerary deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get recommendations (without full itinerary)
router.post('/recommendations', auth, async (req, res) => {
    try {
        const preferences = req.body;

        const aiPreferences = {
            interests: preferences.interests || [],  // Pass interests array directly
            min_rating: preferences.minRating || 3.5,
            budget: preferences.budget
        };

        const recommendations = planner.getRecommendations(aiPreferences, 10);

        res.status(200).json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
