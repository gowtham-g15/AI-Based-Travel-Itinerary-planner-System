const fs = require('fs');
const path = require('path');
const ExternalAPIService = require('../backend/services/externalAPI');

class TravelPlannerService {
    constructor() {
        this.model = null;
        this.places = [];
        this.restaurants = [];
        this.externalAPI = new ExternalAPIService();
        this.useRealTimeData = process.env.USE_REALTIME_DATA === 'true';
        this.loadModel();
    }

    // Helper method to calculate Haversine distance between two coordinates
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        const deltaLat = (lat2 - lat1) * Math.PI / 180;
        const deltaLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Get region from area name
    getRegionFromArea(area, city = null) {
        const areaLower = area.toLowerCase();
        
        // Use city field if available for more precise matching (highest priority)
        if (city) {
            const cityLower = city.toLowerCase();
            if (cityLower.includes('coimbatore') || cityLower.includes('gandhipuram')) {
                return 'coimbatore';
            } else if (cityLower.includes('ooty') || cityLower.includes('nilgiris') || cityLower.includes('coonoor')) {
                return 'ooty_nilgiris';
            } else if (cityLower.includes('munnar') || cityLower.includes('idukki')) {
                return 'munnar';
            } else if (cityLower.includes('kodaikanal') || cityLower.includes('dindigul')) {
                return 'kodaikanal';
            } else if (cityLower.includes('palakkad')) {
                return 'palakkad';
            } else if (cityLower.includes('pollachi') || cityLower.includes('aliyar')) {
                return 'pollachi';
            } else if (cityLower.includes('erode')) {
                return 'erode';
            } else if (cityLower.includes('palani')) {
                return 'palani';
            }
        }
        
        const regionMappings = {
            'coimbatore': ['coimbatore', 'peelamedu', 'r.s. puram', 'rs puram', 'perur', 'marudhamalai', 
                         'upplipalayam', 'ukkadam', 'singanallur', 'race course', 'big bazaar',
                         'avanashi road', 'avinashi', 'eachanari', 'siruvani', 'mettupalayam', 'metupalayam',
                         'narashipuram', 'sengupathi', 'gandhi park', 'voc park', 'valankulam',
                         'gandhipuram', 'town hall', 'oppanakara street', 'brookfields mall'],
            'ooty_nilgiris': ['ooty', 'nilgiris', 'coonoor', 'doddabetta', 'botanical garden', 'ooty lake', 'ooty town'],
            'munnar': ['munnar', 'idukki', 'mattupetty', 'eravikulam', 'anamudi', 'marayoor', 'chinnar'],
            'kodaikanal': ['kodaikanal', 'dindigul', 'coaker\'s walk', 'pillar rocks', 'bear shola falls', 'coaker\'s walk road'],
            'palakkad': ['palakkad', 'kerala', 'malampuzha', 'palakkad fort', 'fort road', 'palakkad town'],
            'pollachi': ['pollachi', 'aliyar', 'parambikulam', 'topslip', 'aliyar dam'],
            'erode': ['erode', 'bhavani sagar', 'sathyamangalam'],
            'palani': ['palani']
        };
        
        for (const [region, areas] of Object.entries(regionMappings)) {
            for (const areaName of areas) {
                if (areaLower.includes(areaName)) {
                    return region;
                }
            }
        }
        
        return 'other';
    }

    // Cluster places by geographic region
    clusterPlacesByRegion(places, numClusters) {
        if (numClusters <= 1) return [places];

        // Group places by major region
        const regionGroups = {};
        places.forEach(place => {
            const area = place.area || 'Unknown';
            const city = place.city || null; // Some places might have city field
            const region = this.getRegionFromArea(area, city);
            if (!regionGroups[region]) regionGroups[region] = [];
            regionGroups[region].push(place);
        });

        // Get the top regions by place count
        const sortedRegions = Object.entries(regionGroups).sort((a, b) => b[1].length - a[1].length);
        
        // Create clusters based on regions
        let clusters = [];
        for (const [region, regionPlaces] of sortedRegions.slice(0, numClusters)) {
            if (regionPlaces.length > 0) {
                clusters.push(regionPlaces);
            }
        }

        // If we need more clusters, split the largest region
        while (clusters.length < numClusters && clusters.length > 0) {
            const largestCluster = clusters.reduce((max, cluster) => 
                cluster.length > max.length ? cluster : max, clusters[0]);
            
            if (largestCluster.length > 2) {
                const mid = Math.floor(largestCluster.length / 2);
                const idx = clusters.indexOf(largestCluster);
                clusters.splice(idx, 1);
                clusters.push(largestCluster.slice(0, mid));
                clusters.push(largestCluster.slice(mid));
            } else {
                break;
            }
        }

        // If we still don't have enough clusters, add empty ones
        while (clusters.length < numClusters) {
            clusters.push([]);
        }

        return clusters.slice(0, numClusters);
    }

    // Cluster restaurants by geographic region
    clusterRestaurantsByRegion(restaurants, numClusters) {
        if (numClusters <= 1) return [restaurants];

        // Group restaurants by major region
        const regionGroups = {};
        restaurants.forEach(restaurant => {
            const area = restaurant.area || 'Unknown';
            const city = restaurant.city || null; // Restaurants have city field
            const region = this.getRegionFromArea(area, city);
            if (!regionGroups[region]) regionGroups[region] = [];
            regionGroups[region].push(restaurant);
        });

        // Get the top regions by restaurant count
        const sortedRegions = Object.entries(regionGroups).sort((a, b) => b[1].length - a[1].length);
        
        // Create clusters based on regions
        let clusters = [];
        for (const [region, regionRestaurants] of sortedRegions.slice(0, numClusters)) {
            if (regionRestaurants.length > 0) {
                clusters.push(regionRestaurants);
            }
        }

        // If we need more clusters, split the largest region
        while (clusters.length < numClusters && clusters.length > 0) {
            const largestCluster = clusters.reduce((max, cluster) => 
                cluster.length > max.length ? cluster : max, clusters[0]);
            
            if (largestCluster.length > 2) {
                const mid = Math.floor(largestCluster.length / 2);
                const idx = clusters.indexOf(largestCluster);
                clusters.splice(idx, 1);
                clusters.push(largestCluster.slice(0, mid));
                clusters.push(largestCluster.slice(mid));
            } else {
                break;
            }
        }

        // If we still don't have enough clusters, add empty ones
        while (clusters.length < numClusters) {
            clusters.push([]);
        }

        return clusters.slice(0, numClusters);
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
            
            // Score and prioritize places based on user interests (not filtering)
            const scoredPlaces = this.places
                .map(place => {
                    let score = 0;
                    let hasInterestMatch = false;
                    
                    // Category preference (higher weight) - PRIORITIZE interest matches
                    if (preferredCategories.includes(place.category)) {
                        score += 25; // Increased weight for category match
                        hasInterestMatch = true;
                    }
                    
                    // Tag preference (medium weight) - PRIORITIZE tag matches
                    if (preferredTags.length > 0) {
                        const itemTags = this.tokenizeText(place.tags);
                        preferredTags.forEach(tag => {
                            if (itemTags.includes(tag)) {
                                score += 15; // Increased weight for tag match
                                hasInterestMatch = true;
                            }
                        });
                    }
                    
                    // Base score for all places (ensures non-matching places are still included)
                    score += 5; // Minimum score for all places
                    
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
                    
                    return { ...place, score, hasInterestMatch };
                })
                .sort((a, b) => b.score - a.score);

            // Score and prioritize restaurants based on user interests (not filtering)
            const scoredRestaurants = this.restaurants
                .map(restaurant => {
                    let score = 0;
                    let hasInterestMatch = false;
                    
                    // Tag preference (medium weight) - PRIORITIZE tag matches
                    if (preferredTags.length > 0) {
                        const itemTags = this.tokenizeText(restaurant.tags);
                        preferredTags.forEach(tag => {
                            if (itemTags.includes(tag)) {
                                score += 15; // Increased weight for tag match
                                hasInterestMatch = true;
                            }
                        });
                    }
                    
                    // Base score for all restaurants (ensures non-matching restaurants are still included)
                    score += 5; // Minimum score for all restaurants
                    
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
                        score,
                        hasInterestMatch
                    };
                })
                .sort((a, b) => b.score - a.score);

            // Cluster places by geographic region for each day
            const placeClusters = this.clusterPlacesByRegion(scoredPlaces, durationDays);
            const restaurantClusters = this.clusterRestaurantsByRegion(scoredRestaurants, durationDays);
            
            // Generate daily itinerary with area-based clustering
            const dailyPlans = [];
            const placesPerDay = Math.min(3, Math.max(1, Math.floor(scoredPlaces.length / durationDays)));
            const restaurantsPerDay = Math.min(3, Math.max(1, Math.floor(scoredRestaurants.length / durationDays)));

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

                // Get places for this day's area cluster
                const dayPlaces = placeClusters[day] || scoredPlaces;
                
                // Prioritize interest-matched places within this area
                const dayPlacesWithScore = dayPlaces.map(place => {
                    const originalData = scoredPlaces.find(p => p.name === place.name);
                    return originalData || { ...place, score: 0, hasInterestMatch: false };
                });
                
                // Sort by score (interest-matched first)
                dayPlacesWithScore.sort((a, b) => b.score - a.score);
                
                // Ensure variety of categories within the day
                const selectedPlaces = [];
                const usedCategories = new Set();
                
                // First pass: get one from each category if available
                for (const placeData of dayPlacesWithScore) {
                    if (selectedPlaces.length >= placesPerDay) break;
                    const category = placeData.category || 'unknown';
                    if (!usedCategories.has(category) || selectedPlaces.length >= placesPerDay - 1) {
                        const { score, hasInterestMatch, ...place } = placeData;
                        selectedPlaces.push(place);
                        usedCategories.add(category);
                    }
                }
                
                // Second pass: fill remaining slots with highest scored
                for (const placeData of dayPlacesWithScore) {
                    if (selectedPlaces.length >= placesPerDay) break;
                    const { score, hasInterestMatch, ...place } = placeData;
                    if (!selectedPlaces.some(p => p.name === place.name)) {
                        selectedPlaces.push(place);
                    }
                }
                
                dayPlan.places = selectedPlaces;

                // Get restaurants for this day's area cluster
                let dayRestaurants = restaurantClusters[day] || scoredRestaurants;
                
                // If this cluster is empty or has very few restaurants, get restaurants from the same region as places
                if (dayRestaurants.length < restaurantsPerDay) {
                    // Get the region from the first place in this day
                    if (dayPlan.places.length > 0) {
                        const firstPlaceRegion = this.getRegionFromArea(dayPlan.places[0].area || '', dayPlan.places[0].city || null);
                        // Get all restaurants from this region
                        const regionRestaurants = scoredRestaurants.filter(r => 
                            this.getRegionFromArea(r.area || '', r.city || null) === firstPlaceRegion
                        );
                        if (regionRestaurants.length > 0) {
                            dayRestaurants = regionRestaurants;
                        }
                    }
                }
                
                // Prioritize interest-matched restaurants within this area
                const dayRestaurantsWithScore = dayRestaurants.map(restaurant => {
                    const originalData = scoredRestaurants.find(r => r.name === restaurant.name);
                    return originalData || { ...restaurant, score: 0, hasInterestMatch: false };
                });
                
                // Sort by score (interest-matched first)
                dayRestaurantsWithScore.sort((a, b) => b.score - a.score);
                
                // Add top restaurants for this day
                const dayRestaurantsList = [];
                for (let i = 0; i < Math.min(restaurantsPerDay, dayRestaurantsWithScore.length); i++) {
                    const { score, hasInterestMatch, ...restaurantData } = dayRestaurantsWithScore[i];
                    dayRestaurantsList.push(restaurantData);
                }
                
                // Distribute restaurants across all 3 meals
                const mealTypes = ['breakfast', 'lunch', 'dinner'];
                for (const restaurant of dayRestaurantsList) {
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
                const usedRestNames = new Set(dayRestaurantsList.map(r => r.name));
                const remainingRestaurants = scoredRestaurants.filter(r => !usedRestNames.has(r.name));
                
                for (const mealType of mealTypes) {
                    if (dayPlan.restaurants[mealType].length === 0 && remainingRestaurants.length > 0) {
                        const { score, hasInterestMatch, ...restaurantData } = remainingRestaurants.shift();
                        dayPlan.restaurants[mealType].push(restaurantData);
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
                    ),
                    interest_matched_places: scoredPlaces.filter(p => p.hasInterestMatch).length,
                    interest_matched_restaurants: scoredRestaurants.filter(r => r.hasInterestMatch).length,
                    total_available_places: scoredPlaces.length,
                    total_available_restaurants: scoredRestaurants.length,
                    area_clusters: placeClusters.length
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

    /**
     * Fetch real-time places data from external API
     * @param {string} location - Location to search
     * @param {Array} interests - User interests for filtering
     * @returns {Array} Real-time places data
     */
    async fetchRealTimePlaces(location, interests = []) {
        try {
            if (!this.useRealTimeData) {
                console.log('Real-time data disabled, using local data');
                return this.places;
            }

            // Map interests to place types
            const interestToType = {
                'nature': 'park',
                'temples': 'temple',
                'adventure': 'tourist_attraction',
                'shopping': 'shopping_mall',
                'music': 'museum',
                'food': 'restaurant'
            };

            const placeTypes = interests.map(interest => interestToType[interest] || 'tourist_attraction');
            const allPlaces = [];

            for (const type of placeTypes) {
                const response = await this.externalAPI.getPlacesData(location, type);
                if (response.success && response.data) {
                    const formattedPlaces = response.data.map(place => ({
                        name: place.name,
                        category: type,
                        description: place.types.join(', '),
                        address: place.address,
                        area: this.extractArea(place.address),
                        latitude: place.location.lat,
                        longitude: place.location.lng,
                        rating: place.rating.toString(),
                        tags: place.types.join(', '),
                        openingHours: place.opening_hours ? 
                            (place.opening_hours.open_now ? 'Open now' : 'Closed') : 'Unknown',
                        entryFee: 'Varies',
                        bestTimeToVisit: '9 AM - 5 PM',
                        duration: '2-3 hours',
                        amenities: place.types,
                        place_id: place.place_id,
                        source: 'external_api',
                        timestamp: place.timestamp
                    }));
                    allPlaces.push(...formattedPlaces);
                }
            }

            return allPlaces.length > 0 ? allPlaces : this.places;
        } catch (error) {
            console.error('Error fetching real-time places:', error);
            return this.places;
        }
    }

    /**
     * Fetch real-time restaurants data from external API
     * @param {string} location - Location to search
     * @param {Array} interests - User interests for filtering
     * @returns {Array} Real-time restaurants data
     */
    async fetchRealTimeRestaurants(location, interests = []) {
        try {
            if (!this.useRealTimeData) {
                console.log('Real-time data disabled, using local data');
                return this.restaurants;
            }

            // Map interests to cuisine types
            const interestToCuisine = {
                'food': 'indian',
                'nature': null,
                'temples': 'indian',
                'adventure': null,
                'shopping': null,
                'music': null
            };

            const cuisine = interests.map(interest => interestToCuisine[interest]).filter(c => c)[0];
            const response = await this.externalAPI.getRestaurantsData(location, cuisine, 20);

            if (response.success && response.data) {
                const formattedRestaurants = response.data.map(restaurant => ({
                    name: restaurant.name,
                    cuisine: restaurant.categories.join(', '),
                    description: `${restaurant.categories.join(', ')} restaurant`,
                    address: restaurant.location.address1,
                    area: this.extractArea(restaurant.location.city),
                    latitude: restaurant.coordinates.latitude,
                    longitude: restaurant.coordinates.longitude,
                    rating: restaurant.rating.toString(),
                    tags: restaurant.categories.join(', '),
                    openingHours: restaurant.is_closed ? 'Closed' : 'Open',
                    priceRange: restaurant.price || '$$',
                    specialties: restaurant.categories.join(', '),
                    restaurant_id: restaurant.id,
                    source: 'external_api',
                    timestamp: restaurant.timestamp
                }));

                return formattedRestaurants;
            }

            return this.restaurants;
        } catch (error) {
            console.error('Error fetching real-time restaurants:', error);
            return this.restaurants;
        }
    }

    /**
     * Fetch real-time weather data for trip planning
     * @param {string} location - Location
     * @param {number} days - Number of days
     * @returns {Object} Weather forecast data
     */
    async fetchWeatherForecast(location, days = 3) {
        try {
            const response = await this.externalAPI.getWeatherForecast(location, days);
            return response;
        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Generate trip plan with real-time data
     * @param {Object} preferences - User preferences
     * @param {number} durationDays - Trip duration
     * @param {boolean} useRealTime - Whether to use real-time data
     * @returns {Object} Trip plan with real-time data
     */
    async generateTripPlanWithRealTime(preferences, durationDays = 3, useRealTime = false) {
        try {
            let placesToUse = this.places;
            let restaurantsToUse = this.restaurants;
            let weatherData = null;

            // Fetch real-time data if enabled
            if (useRealTime || this.useRealTimeData) {
                const location = preferences.destination || 'Coimbatore';
                const interests = preferences.interests || [];

                console.log('Fetching real-time data...');
                
                // Fetch real-time places and restaurants in parallel
                const [realTimePlaces, realTimeRestaurants, weatherForecast] = await Promise.all([
                    this.fetchRealTimePlaces(location, interests),
                    this.fetchRealTimeRestaurants(location, interests),
                    this.fetchWeatherForecast(location, durationDays)
                ]);

                placesToUse = realTimePlaces;
                restaurantsToUse = realTimeRestaurants;
                weatherData = weatherForecast;

                console.log(`Real-time data: ${placesToUse.length} places, ${restaurantsToUse.length} restaurants`);
            }

            // Temporarily replace places and restaurants for trip generation
            const originalPlaces = this.places;
            const originalRestaurants = this.restaurants;
            
            this.places = placesToUse;
            this.restaurants = restaurantsToUse;

            // Generate trip plan
            const tripPlan = this.generateTripPlan(preferences, durationDays);

            // Restore original data
            this.places = originalPlaces;
            this.restaurants = originalRestaurants;

            // Add weather data to trip plan
            if (weatherData && weatherData.success) {
                tripPlan.weather_forecast = weatherData.data;
            }

            // Add data source information
            tripPlan.data_source = useRealTime || this.useRealTimeData ? 'real_time_api' : 'local_database';
            tripPlan.generated_at = new Date().toISOString();

            return tripPlan;
        } catch (error) {
            console.error('Error generating trip plan with real-time data:', error);
            return { error: error.message };
        }
    }

    /**
     * Regenerate trip plan with updated preferences or real-time data
     * @param {Object} existingPlan - Existing trip plan
     * @param {Object} newPreferences - Updated preferences
     * @param {boolean} forceRealTime - Force real-time data refresh
     * @returns {Object} Regenerated trip plan
     */
    async regenerateTripPlan(existingPlan, newPreferences = null, forceRealTime = false) {
        try {
            const preferences = newPreferences || existingPlan.preferences;
            const durationDays = existingPlan.trip_duration || 3;

            console.log('Regenerating trip plan...');

            // Always use real-time data when regenerating
            const regeneratedPlan = await this.generateTripPlanWithRealTime(
                preferences,
                durationDays,
                forceRealTime || true
            );

            // Add regeneration metadata
            regeneratedPlan.regenerated_at = new Date().toISOString();
            regeneratedPlan.regeneration_count = (existingPlan.regeneration_count || 0) + 1;
            regeneratedPlan.previous_plan_id = existingPlan._id || null;

            return regeneratedPlan;
        } catch (error) {
            console.error('Error regenerating trip plan:', error);
            return { error: error.message };
        }
    }

    // Helper method to extract area from address
    extractArea(address) {
        if (!address) return 'Unknown';
        const parts = address.split(',');
        return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
    }
}

module.exports = TravelPlannerService;
