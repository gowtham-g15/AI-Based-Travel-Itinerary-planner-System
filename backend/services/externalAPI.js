const axios = require('axios');

class ExternalAPIService {
    constructor() {
        this.weatherAPIKey = process.env.WEATHER_API_KEY || '';
        this.placesAPIKey = process.env.PLACES_API_KEY || '';
        this.restaurantsAPIKey = process.env.RESTAURANTS_API_KEY || '';
        
        // API endpoints
        this.weatherBaseURL = 'https://api.openweathermap.org/data/2.5';
        this.placesBaseURL = 'https://maps.googleapis.com/maps/api/place';
        this.restaurantsBaseURL = 'https://api.yelp.com/v3';
    }

    /**
     * Get real-time weather data for a location
     * @param {string} location - City name or coordinates
     * @returns {Object} Weather data
     */
    async getWeatherData(location) {
        try {
            if (!this.weatherAPIKey) {
                console.warn('Weather API key not configured, using mock data');
                return this.getMockWeatherData(location);
            }

            const response = await axios.get(`${this.weatherBaseURL}/weather`, {
                params: {
                    q: location,
                    appid: this.weatherAPIKey,
                    units: 'metric'
                }
            });

            return {
                success: true,
                data: {
                    temperature: response.data.main.temp,
                    feels_like: response.data.main.feels_like,
                    humidity: response.data.main.humidity,
                    wind_speed: response.data.wind.speed,
                    weather: response.data.weather[0].description,
                    icon: response.data.weather[0].icon,
                    location: response.data.name,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error fetching weather data:', error.message);
            return this.getMockWeatherData(location);
        }
    }

    /**
     * Get weather forecast for multiple days
     * @param {string} location - City name or coordinates
     * @param {number} days - Number of days to forecast
     * @returns {Object} Weather forecast data
     */
    async getWeatherForecast(location, days = 5) {
        try {
            if (!this.weatherAPIKey) {
                console.warn('Weather API key not configured, using mock forecast data');
                return this.getMockWeatherForecast(location, days);
            }

            const response = await axios.get(`${this.weatherBaseURL}/forecast`, {
                params: {
                    q: location,
                    appid: this.weatherAPIKey,
                    units: 'metric',
                    cnt: days * 8 // 8 forecasts per day (3-hour intervals)
                }
            });

            // Process forecast data to daily summaries
            const dailyForecasts = [];
            const dailyData = {};

            response.data.list.forEach(forecast => {
                const date = new Date(forecast.dt * 1000).toDateString();
                if (!dailyData[date]) {
                    dailyData[date] = {
                        date: date,
                        temps: [],
                        conditions: [],
                        humidity: [],
                        wind_speed: []
                    };
                }
                dailyData[date].temps.push(forecast.main.temp);
                dailyData[date].conditions.push(forecast.weather[0].description);
                dailyData[date].humidity.push(forecast.main.humidity);
                dailyData[date].wind_speed.push(forecast.wind.speed);
            });

            Object.values(dailyData).forEach(day => {
                dailyForecasts.push({
                    date: day.date,
                    temperature: {
                        min: Math.min(...day.temps),
                        max: Math.max(...day.temps),
                        avg: day.temps.reduce((a, b) => a + b) / day.temps.length
                    },
                    condition: this.getMostCommon(day.conditions),
                    humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length),
                    wind_speed: Math.round(day.wind_speed.reduce((a, b) => a + b) / day.wind_speed.length)
                });
            });

            return {
                success: true,
                data: dailyForecasts.slice(0, days)
            };
        } catch (error) {
            console.error('Error fetching weather forecast:', error.message);
            return this.getMockWeatherForecast(location, days);
        }
    }

    /**
     * Get real-time places data from external API
     * @param {string} location - Location to search
     * @param {string} type - Type of place (tourist_attraction, temple, park, etc.)
     * @param {number} radius - Search radius in meters
     * @returns {Object} Places data
     */
    async getPlacesData(location, type = 'tourist_attraction', radius = 50000) {
        try {
            if (!this.placesAPIKey) {
                console.warn('Places API key not configured, using local data');
                return { success: false, message: 'Places API key not configured' };
            }

            // First, get coordinates for the location
            const geoResponse = await axios.get(`${this.placesBaseURL}/geocode/json`, {
                params: {
                    address: location,
                    key: this.placesAPIKey
                }
            });

            if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
                return { success: false, message: 'Location not found' };
            }

            const { lat, lng } = geoResponse.data.results[0].geometry.location;

            // Search for places
            const response = await axios.get(`${this.placesBaseURL}/nearbysearch/json`, {
                params: {
                    location: `${lat},${lng}`,
                    radius: radius,
                    type: type,
                    key: this.placesAPIKey
                }
            });

            const places = response.data.results.map(place => ({
                name: place.name,
                place_id: place.place_id,
                address: place.vicinity,
                rating: place.rating || 0,
                total_ratings: place.user_ratings_total || 0,
                location: place.geometry.location,
                types: place.types,
                opening_hours: place.opening_hours ? {
                    open_now: place.opening_hours.open_now,
                    periods: place.opening_hours.periods
                } : null,
                photos: place.photos ? place.photos.slice(0, 3).map(p => p.photo_reference) : [],
                timestamp: new Date().toISOString()
            }));

            return {
                success: true,
                data: places
            };
        } catch (error) {
            console.error('Error fetching places data:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get place details by ID
     * @param {string} placeId - Google Place ID
     * @returns {Object} Detailed place information
     */
    async getPlaceDetails(placeId) {
        try {
            if (!this.placesAPIKey) {
                return { success: false, message: 'Places API key not configured' };
            }

            const response = await axios.get(`${this.placesBaseURL}/details/json`, {
                params: {
                    place_id: placeId,
                    key: this.placesAPIKey,
                    fields: 'name,place_id,formatted_address,geometry,rating,review,opening_hours,photos,website,phone'
                }
            });

            return {
                success: true,
                data: response.data.result
            };
        } catch (error) {
            console.error('Error fetching place details:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get real-time restaurants data from external API
     * @param {string} location - Location to search
     * @param {string} cuisine - Cuisine type (optional)
     * @param {number} limit - Number of results
     * @returns {Object} Restaurants data
     */
    async getRestaurantsData(location, cuisine = null, limit = 20) {
        try {
            if (!this.restaurantsAPIKey) {
                console.warn('Restaurants API key not configured, using local data');
                return { success: false, message: 'Restaurants API key not configured' };
            }

            const response = await axios.get(`${this.restaurantsBaseURL}/businesses/search`, {
                headers: {
                    'Authorization': `Bearer ${this.restaurantsAPIKey}`
                },
                params: {
                    location: location,
                    term: 'restaurants',
                    categories: cuisine || '',
                    limit: limit,
                    sort_by: 'rating'
                }
            });

            const restaurants = response.data.businesses.map(business => ({
                name: business.name,
                id: business.id,
                rating: business.rating,
                review_count: business.review_count,
                price: business.price,
                location: business.location,
                coordinates: business.coordinates,
                phone: business.phone,
                categories: business.categories.map(cat => cat.title),
                photos: business.photos,
                is_closed: business.is_closed,
                url: business.url,
                timestamp: new Date().toISOString()
            }));

            return {
                success: true,
                data: restaurants
            };
        } catch (error) {
            console.error('Error fetching restaurants data:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get restaurant reviews
     * @param {string} restaurantId - Restaurant ID
     * @returns {Object} Restaurant reviews
     */
    async getRestaurantReviews(restaurantId) {
        try {
            if (!this.restaurantsAPIKey) {
                return { success: false, message: 'Restaurants API key not configured' };
            }

            const response = await axios.get(`${this.restaurantsBaseURL}/businesses/${restaurantId}/reviews`, {
                headers: {
                    'Authorization': `Bearer ${this.restaurantsAPIKey}`
                }
            });

            return {
                success: true,
                data: response.data.reviews
            };
        } catch (error) {
            console.error('Error fetching restaurant reviews:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get travel time between two locations
     * @param {string} origin - Origin address or coordinates
     * @param {string} destination - Destination address or coordinates
     * @param {string} mode - Travel mode (driving, walking, transit)
     * @returns {Object} Travel time data
     */
    async getTravelTime(origin, destination, mode = 'driving') {
        try {
            if (!this.placesAPIKey) {
                return this.getMockTravelTime(origin, destination, mode);
            }

            const response = await axios.get(`${this.placesBaseURL}/distancematrix/json`, {
                params: {
                    origins: origin,
                    destinations: destination,
                    mode: mode,
                    key: this.placesAPIKey
                }
            });

            const element = response.data.rows[0].elements[0];
            
            return {
                success: true,
                data: {
                    distance: element.distance.text,
                    distance_value: element.distance.value,
                    duration: element.duration.text,
                    duration_value: element.duration.value,
                    status: element.status
                }
            };
        } catch (error) {
            console.error('Error fetching travel time:', error.message);
            return this.getMockTravelTime(origin, destination, mode);
        }
    }

    /**
     * Get current time and timezone for a location
     * @param {string} location - Location name
     * @returns {Object} Time data
     */
    async getCurrentTime(location) {
        try {
            if (!this.placesAPIKey) {
                return this.getMockCurrentTime(location);
            }

            const response = await axios.get(`${this.placesBaseURL}/timezone/json`, {
                params: {
                    location: this.getLocationCoordinates(location),
                    timestamp: Math.floor(Date.now() / 1000),
                    key: this.placesAPIKey
                }
            });

            return {
                success: true,
                data: {
                    timezone_id: response.data.timeZoneId,
                    timezone_name: response.data.timeZoneName,
                    local_time: new Date(response.data.dstOffset * 1000 + response.data.rawOffset * 1000 + Date.now()).toISOString(),
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error fetching current time:', error.message);
            return this.getMockCurrentTime(location);
        }
    }

    // Helper methods
    getMostCommon(arr) {
        const counts = {};
        let maxCount = 0;
        let mostCommon = arr[0];
        
        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
            if (counts[item] > maxCount) {
                maxCount = counts[item];
                mostCommon = item;
            }
        });
        
        return mostCommon;
    }

    getLocationCoordinates(location) {
        // This would normally call the geocoding API
        // For now, return Coimbatore coordinates
        return '10.967,76.953';
    }

    // Mock data methods (fallback when APIs are not configured)
    getMockWeatherData(location) {
        return {
            success: true,
            data: {
                temperature: 28,
                feels_like: 30,
                humidity: 65,
                wind_speed: 12,
                weather: 'partly cloudy',
                icon: '03d',
                location: location,
                timestamp: new Date().toISOString(),
                mock: true
            }
        };
    }

    getMockWeatherForecast(location, days) {
        const forecasts = [];
        const conditions = ['sunny', 'partly cloudy', 'cloudy', 'light rain', 'clear'];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecasts.push({
                date: date.toDateString(),
                temperature: {
                    min: 22 + Math.floor(Math.random() * 5),
                    max: 30 + Math.floor(Math.random() * 5),
                    avg: 26 + Math.floor(Math.random() * 3)
                },
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                humidity: 50 + Math.floor(Math.random() * 30),
                wind_speed: 8 + Math.floor(Math.random() * 10),
                mock: true
            });
        }
        
        return { success: true, data: forecasts };
    }

    getMockTravelTime(origin, destination, mode) {
        const times = {
            driving: { distance: '5.2 km', duration: '15 mins', distance_value: 5200, duration_value: 900 },
            walking: { distance: '5.2 km', duration: '1 hour 5 mins', distance_value: 5200, duration_value: 3900 },
            transit: { distance: '5.2 km', duration: '25 mins', distance_value: 5200, duration_value: 1500 }
        };
        
        return {
            success: true,
            data: { ...times[mode] || times.driving, mock: true }
        };
    }

    getMockCurrentTime(location) {
        return {
            success: true,
            data: {
                timezone_id: 'Asia/Kolkata',
                timezone_name: 'India Standard Time',
                local_time: new Date().toISOString(),
                timestamp: new Date().toISOString(),
                mock: true
            }
        };
    }
}

module.exports = ExternalAPIService;
