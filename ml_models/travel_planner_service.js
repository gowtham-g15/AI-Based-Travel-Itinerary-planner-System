const fs = require('fs');
const path = require('path');

class TravelPlannerService {
    constructor() {
        this.model = null;
        this.places = [];
        this.restaurants = [];
        this.loadModel();
    }

    loadModel() {
        try {
            const modelPath = path.join(__dirname, 'travel_planner_model.json');
            const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
            
            this.model = modelData;
            this.places = modelData.places || [];
            this.restaurants = modelData.restaurants || [];
            
            console.log('Travel planner model loaded successfully');
            console.log(`${this.places.length} places and ${this.restaurants.length} restaurants loaded`);
        } catch (error) {
            console.error('Error loading travel planner model:', error);
            // Try to train the model if it doesn't exist
            this.trainAndSaveModel();
        }
    }

    trainAndSaveModel() {
        try {
            console.log('Model not found. Attempting to train...');
            const { spawn } = require('child_process');
            const pythonProcess = spawn('python', ['travel_planner_ai.py'], { cwd: __dirname });
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Model trained successfully. Loading...');
                    this.loadModel();
                } else {
                    console.error('Failed to train model');
                }
            });
        } catch (error) {
            console.error('Error training model:', error);
        }
    }

    tokenizeText(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[|,-]/g, ' ')
            .split(' ')
            .filter(token => token.trim().length > 0);
    }

    createFeatureVector(item) {
        const features = {};
        
        // Category features
        const category = (item.category || '').toLowerCase();
        if (category) {
            features[`category_${category}`] = 3;
        }
        
        // Tag features
        const tags = (item.tags || '').toLowerCase();
        this.tokenizeText(tags).forEach(tag => {
            features[`tag_${tag}`] = 2;
        });
        
        // Area features
        const area = (item.area || '').toLowerCase();
        if (area) {
            features[`area_${area}`] = 1;
        }
        
        // Description features
        const description = (item.description || '').toLowerCase();
        this.tokenizeText(description).forEach(token => {
            if (token.length > 3) {
                features[`desc_${token}`] = 1;
            }
        });
        
        // Rating feature
        const rating = parseFloat(item.rating) || 0;
        if (rating > 0) {
            features.rating = rating;
        }
        
        return features;
    }

    calculateCosineSimilarity(features1, features2) {
        const allTerms = new Set([...Object.keys(features1), ...Object.keys(features2)]);
        
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;
        
        for (const term of allTerms) {
            const f1 = features1[term] || 0;
            const f2 = features2[term] || 0;
            
            dotProduct += f1 * f2;
            mag1 += f1 * f1;
            mag2 += f2 * f2;
        }
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
    }

    scoreItem(item, preferences) {
        const features = this.createFeatureVector(item);
        let score = 0;
        
        // Category preference (higher weight)
        if (preferences.categories && preferences.categories.includes(item.category)) {
            score += 15;
        }
        
        // Tag preference (medium weight)
        if (preferences.tags) {
            const itemTags = this.tokenizeText(item.tags);
            preferences.tags.forEach(tag => {
                if (itemTags.includes(tag)) {
                    score += 8;
                }
            });
        }
        
        // Rating preference (double weight)
        const rating = parseFloat(item.rating) || 0;
        if (rating >= (preferences.min_rating || 0)) {
            score += rating * 2; // Double weight for rating
        }
        
        // Area preference (if user specified area)
        if (preferences.area && item.area && item.area.toLowerCase() === preferences.area.toLowerCase()) {
            score += 10;
        }
        
        // Cuisine preference (for restaurants)
        if (preferences.cuisine && item.specialties && 
            item.specialties.toLowerCase() === preferences.cuisine.toLowerCase()) {
            score += 12;
        }
        
        return score;
    }

    mapInterestsToPreferences(interests) {
        // Map user interests to categories and tags for trip planning
        // Interest to categories mapping
        const interestToCategories = {
            'nature': ['park', 'botanical_garden', 'lake', 'waterfall', 'national_park', 'tea_garden', 'garden', 'wildlife', 'dam', 'boat_house'],
            'temples': ['temple'],
            'adventure': ['amusement', 'trekking', 'national_park', 'wildlife', 'boat_house', 'viewpoint'],
            'shopping': ['shopping', 'mall'],
            'food': ['restaurant'],  // This will be handled separately for restaurants
            'music': ['art_gallery', 'museum']  // Cultural places
        };
        
        // Interest to tags mapping
        const interestToTags = {
            'nature': ['nature', 'scenic', 'photography', 'outdoor', 'family', 'environment', 'green', 'peaceful'],
            'temples': ['religious', 'spiritual', 'ancient', 'architecture', 'heritage', 'pilgrimage', 'peaceful'],
            'adventure': ['adventure', 'thrill', 'exciting', 'outdoor', 'adrenaline', 'sports', 'active'],
            'shopping': ['shopping', 'brands', 'entertainment', 'food', 'modern', 'urban'],
            'food': ['food', 'dining', 'cuisine', 'family', 'traditional', 'local'],
            'music': ['culture', 'art', 'music', 'education', 'entertainment', 'history']
        };
        
        let preferredCategories = [];
        let preferredTags = [];
        
        // Convert each interest to categories and tags
        for (const interest of interests) {
            if (interestToCategories[interest]) {
                preferredCategories = preferredCategories.concat(interestToCategories[interest]);
            }
            if (interestToTags[interest]) {
                preferredTags = preferredTags.concat(interestToTags[interest]);
            }
        }
        
        // Remove duplicates while preserving order
        preferredCategories = [...new Set(preferredCategories)];
        preferredTags = [...new Set(preferredTags)];
        
        return {
            categories: preferredCategories,
            tags: preferredTags
        };
    }

    generateTripPlan(preferences, durationDays = 3) {
        try {
            // Handle interests input (from frontend) and convert to categories/tags
            let preferredCategories = [];
            let preferredTags = [];
            
            if (preferences.interests) {
                const mappedPrefs = this.mapInterestsToPreferences(preferences.interests);
                preferredCategories = mappedPrefs.categories;
                preferredTags = mappedPrefs.tags;
            } else {
                // Backward compatibility for direct categories/tags input
                preferredCategories = preferences.categories || [];
                preferredTags = preferences.tags || [];
            }
            
            // Calculate budget
            const budgetInfo = this.calculateBudget(preferences.budget, durationDays);
            
            // Score and sort places with interest filtering (more selective)
            const scoredPlaces = this.places
                .map(place => {
                    let score = 0;
                    let hasInterestMatch = false;
                    
                    // Category preference (higher weight) - MUST match at least one interest
                    if (preferredCategories.includes(place.category)) {
                        score += 20;
                        hasInterestMatch = true;
                    }
                    
                    // Tag preference (medium weight) - MUST match at least one tag
                    if (preferredTags.length > 0) {
                        const itemTags = this.tokenizeText(place.tags);
                        preferredTags.forEach(tag => {
                            if (itemTags.includes(tag)) {
                                score += 10;
                                hasInterestMatch = true;
                            }
                        });
                    }
                    
                    // Only include places that match user interests
                    if (!hasInterestMatch && preferredCategories.length > 0) {
                        return null;
                    }
                    
                    // Rating preference (double weight)
                    const rating = parseFloat(place.rating) || 0;
                    if (rating >= (preferences.min_rating || 0)) {
                        score += rating * 2; // Double weight for rating
                    }
                    
                    // Area preference (if user specified area)
                    if (preferences.area && place.area && place.area.toLowerCase() === preferences.area.toLowerCase()) {
                        score += 10;
                    }
                    
                    // Add timing information
                    place.visit_duration = this.getVisitDuration(place.category);
                    place.bestTimeToVisit = this.getBestTimeToVisit(place.category, place.tags || '');
                    
                    return { ...place, score };
                })
                .filter(place => place !== null)
                .sort((a, b) => b.score - a.score);

            // Score and sort restaurants with meal types and interest filtering
            const scoredRestaurants = this.restaurants
                .map(restaurant => {
                    let score = 0;
                    let hasInterestMatch = false;
                    
                    // Tag preference (medium weight) - MUST match at least one tag
                    if (preferredTags.length > 0) {
                        const itemTags = this.tokenizeText(restaurant.tags);
                        preferredTags.forEach(tag => {
                            if (itemTags.includes(tag)) {
                                score += 10;
                                hasInterestMatch = true;
                            }
                        });
                    }
                    
                    // Only include restaurants that match user interests (if interests are specified)
                    if (!hasInterestMatch && preferredTags.length > 0) {
                        return null;
                    }
                    
                    // Rating preference (double weight)
                    const rating = parseFloat(restaurant.rating) || 0;
                    if (rating >= (preferences.min_rating || 0)) {
                        score += rating * 2; // Double weight for rating
                    }
                    
                    // Area preference (if user specified area)
                    if (preferences.area && restaurant.area && restaurant.area.toLowerCase() === preferences.area.toLowerCase()) {
                        score += 10;
                    }
                    
                    return {
                        ...restaurant,
                        meal_type: this.categorizeMealType(restaurant),
                        score
                    };
                })
                .filter(restaurant => restaurant !== null)
                .sort((a, b) => b.score - a.score);

            // Generate daily plans with all 3 meals per day
            const dailyPlans = [];
            const placesPerDay = Math.min(3, Math.floor(scoredPlaces.length / durationDays));
            const restaurantsPerDay = Math.min(3, Math.floor(scoredRestaurants.length / durationDays)); // Ensure 3 meals per day

            for (let day = 0; day < durationDays; day++) {
                const dayPlan = {
                    day: day + 1,
                    places: [],
                    restaurants: {
                        breakfast: [],
                        lunch: [],
                        dinner: []
                    }
                };

                // Add places for this day
                const startPlaceIdx = day * placesPerDay;
                const endPlaceIdx = Math.min(startPlaceIdx + placesPerDay, scoredPlaces.length);
                for (let i = startPlaceIdx; i < endPlaceIdx; i++) {
                    dayPlan.places.push(scoredPlaces[i]);
                }

                // Add 3 meal-specific restaurants for this day
                const startRestIdx = day * restaurantsPerDay;
                const endRestIdx = Math.min(startRestIdx + restaurantsPerDay, scoredRestaurants.length);
                
                // Distribute restaurants across all 3 meals
                const mealTypes = ['breakfast', 'lunch', 'dinner'];
                for (let i = startRestIdx; i < endRestIdx; i++) {
                    const restaurant = scoredRestaurants[i];
                    const restaurantMealTypes = restaurant.meal_type || ['breakfast', 'lunch', 'dinner'];
                    
                    // Assign to first available meal type
                    for (const mealType of restaurantMealTypes) {
                        if (dayPlan.restaurants[mealType].length === 0) {
                            dayPlan.restaurants[mealType].push(restaurant);
                            break;
                        }
                    }
                }
                
                // Fill empty meal slots with additional restaurants if available
                const usedRestaurants = endRestIdx;
                const remainingRestaurants = scoredRestaurants.slice(usedRestaurants);
                
                for (const mealType of mealTypes) {
                    if (dayPlan.restaurants[mealType].length === 0 && remainingRestaurants.length > 0) {
                        dayPlan.restaurants[mealType].push(remainingRestaurants.shift());
                    }
                }

                dailyPlans.push(dayPlan);
            }

            return {
                trip_duration: durationDays,
                preferences: preferences,
                daily_plans: dailyPlans,
                budget: budgetInfo,
                summary: {
                    total_places: dailyPlans.reduce((sum, plan) => sum + plan.places.length, 0),
                    total_restaurants: dailyPlans.reduce((sum, plan) => 
                        sum + (plan.restaurants.breakfast.length + plan.restaurants.lunch.length + plan.restaurants.dinner.length), 0
                    )
                }
            };

        } catch (error) {
            console.error('Error generating trip plan:', error);
            return { error: error.message };
        }
    }

    getBestTimeToVisit(category, tags = '') {
        // Get best time to visit based on category and tags
        category = category.toLowerCase();
        tags = tags.toLowerCase();
        
        // Default times based on category
        const bestTimes = {
            'temple': '6 to 8 AM or 4 to 6 PM',
            'museum': '10 to 12 PM or 2 to 4 PM',
            'park': '6 to 8 AM or 4 to 6 PM',
            'shopping': '2 to 6 PM or 6 to 8 PM',
            'amusement': '10 to 12 PM or 4 to 7 PM',
            'waterfall': '7 to 9 AM or after monsoon',
            'zoo': '9 to 11 AM or 3 to 5 PM',
            'beach': '6 to 8 AM or 5 to 6 PM',
            'hill station': '8 to 10 AM or 5 to 6 PM',
            'mall': '2 to 6 PM or 6 to 8 PM',
            'market': '8 to 10 AM or 4 to 7 PM',
            'garden': '6 to 8 AM or 4 to 6 PM',
            'fort': '8 to 10 AM or 4 to 6 PM',
            'palace': '10 to 12 PM or 2 to 4 PM',
            'lake': '6 to 8 AM or 5 to 6 PM',
            'wildlife sanctuary': '6 to 8 AM or 3 to 5 PM'
        };
        
        // Get base time for category
        let baseTime = bestTimes[category] || '9 to 11 AM or 2 to 4 PM';
        
        // Adjust based on tags
        if (tags.includes('outdoor') || tags.includes('nature')) {
            baseTime = '6 to 8 AM or 4 to 6 PM';
        } else if (tags.includes('religious') && category !== 'temple') {
            baseTime = '6 to 8 AM or 4 to 6 PM';
        } else if (tags.includes('adventure')) {
            baseTime = '8 to 10 AM or 2 to 4 PM';
        } else if (tags.includes('photography')) {
            baseTime = 'Golden hours: 6 to 8 AM or 4 to 6 PM';
        } else if (tags.includes('family')) {
            baseTime = '10 to 12 PM or 2 to 4 PM';
        } else if (tags.includes('nightlife')) {
            baseTime = '6 to 10 PM';
        }
        
        return baseTime;
    }

    categorizeMealType(restaurant) {
        // Categorize restaurant by meal type based on specialties and tags
        const specialties = (restaurant.specialties || restaurant.tags || '').toLowerCase();
        
        // Default to all meals
        let mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        // Check for breakfast places
        if (specialties.includes('breakfast') || specialties.includes('tiffin') || 
            specialties.includes('dosa') || specialties.includes('idli') || 
            specialties.includes('coffee') || specialties.includes('morning')) {
            mealTypes = ['breakfast', 'lunch'];
        }
        // Check for lunch places
        else if (specialties.includes('meals') || specialties.includes('lunch') || 
                   specialties.includes('biryani') || specialties.includes('rice')) {
            mealTypes = ['lunch', 'dinner'];
        }
        // Check for dinner places
        else if (specialties.includes('dinner') || specialties.includes('night') || 
                   specialties.includes('bar') || specialties.includes('pub')) {
            mealTypes = ['dinner'];
        }
            
        return mealTypes;
    }

    getVisitDuration(category) {
        const durations = {
            'temple': '2-3 hours',
            'museum': '2-4 hours',
            'park': '1-2 hours',
            'shopping': '2-3 hours',
            'amusement': '4-6 hours',
            'waterfall': '1-2 hours',
            'zoo': '3-4 hours',
            'beach': '2-3 hours',
            'hill station': '3-4 hours'
        };
        return durations[category.toLowerCase()] || '1-2 hours';
    }

    calculateBudget(budget, durationDays) {
        // Remove currency symbols and convert to number
        let budgetNum;
        if (typeof budget === 'string') {
            budgetNum = budget.replace(/[^\d]/g, '');
            if (budgetNum) {
                budgetNum = parseInt(budgetNum);
            } else {
                // Default budgets for different budget levels
                const budgetDefaults = {
                    'low': 2000,
                    'medium': 5000,
                    'high': 10000
                };
                budgetNum = budgetDefaults[budget.toLowerCase()] || 5000;
            }
        } else {
            budgetNum = budget;
        }
        
        const dailyBudget = Math.floor(budgetNum / durationDays);
        return {
            total: budgetNum,
            daily: dailyBudget,
            currency: '₹'
        };
    }

    getRecommendations(preferences, limit = 5) {
        try {
            // Get top places
            const scoredPlaces = this.places
                .map(place => ({
                    ...place,
                    score: this.scoreItem(place, preferences)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            // Get top restaurants
            const scoredRestaurants = this.restaurants
                .map(restaurant => ({
                    ...restaurant,
                    score: this.scoreItem(restaurant, preferences)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return {
                places: scoredPlaces,
                restaurants: scoredRestaurants
            };

        } catch (error) {
            console.error('Error getting recommendations:', error);
            return { places: [], restaurants: [] };
        }
    }
}

module.exports = TravelPlannerService;
