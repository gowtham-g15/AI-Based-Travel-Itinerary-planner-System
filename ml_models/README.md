# Travel Planner AI - ML Model

This directory contains the Travel Planner AI, an intelligent system that generates personalized trip plans for Coimbatore based on user preferences.

## Files Overview

### Data Files
- `coimbatore-places.csv` - CSV dataset containing tourist places in Coimbatore
- `coimbatore-restaurants.csv` - CSV dataset containing restaurants in Coimbatore

### AI Model Files
- `travel_planner_ai.py` - Python script that trains the Travel Planner AI
- `travel_planner_service.js` - Node.js service for using the trained AI model
- `travel_planner_model.json` - Trained AI model (generated after training)
- `requirements.txt` - Python dependencies (minimal - uses standard library only)

## AI Capabilities

### Trip Planning Features
- **Personalized Itinerary Generation**: Creates multi-day trip plans based on user preferences
- **Preference-Based Recommendations**: Suggests places and restaurants matching user interests
- **Smart Scoring System**: Ranks attractions based on categories, tags, ratings, and user preferences
- **Daily Schedule Optimization**: Distributes attractions across trip duration for optimal experience

### AI Algorithm
- **Content-Based Filtering**: Uses item features to recommend similar attractions
- **Cosine Similarity**: Calculates similarity between user preferences and attraction features
- **Feature Weighting**: 
  - Category preferences (weight: 10)
  - Tag preferences (weight: 5)
  - Rating preferences (variable based on rating value)

### Feature Engineering
1. **Category Features** - Primary classification (temple, museum, park, etc.)
2. **Tag Features** - Activities and characteristics (religious, education, family, etc.)
3. **Area Features** - Geographic location within Coimbatore
4. **Description Keywords** - Semantic analysis of attraction descriptions
5. **Rating Integration** - Quality filtering based on minimum rating requirements

## Usage

### Training the AI
```bash
cd ml_models
python travel_planner_ai.py
```

This will:
- Load the CSV datasets
- Train the AI model using similarity algorithms
- Generate and test a sample 3-day trip plan
- Save the trained model to `travel_planner_model.json`

### Using the AI in Your Application
```javascript
const TravelPlannerService = require('./travel_planner_service');

const planner = new TravelPlannerService();

// Generate a trip plan
const preferences = {
    categories: ['temple', 'museum', 'park'],
    tags: ['religious', 'education', 'family'],
    min_rating: 4.0,
    budget: 'medium'
};

const tripPlan = planner.generateTripPlan(preferences, 3);
console.log(tripPlan);
```

## Example Output

The AI generates structured trip plans like:

```json
{
  "trip_duration": 3,
  "preferences": {...},
  "daily_plans": [
    {
      "day": 1,
      "places": [
        {"name": "Perur Pateeswarar Temple", "category": "temple", ...}
      ],
      "restaurants": [
        {"name": "Annapoorna Restaurant", ...}
      ]
    }
  ],
  "summary": {
    "total_places": 9,
    "total_restaurants": 6
  }
}
```

## Data Structure

### Places CSV Columns
- name, category, description, address, area, latitude, longitude
- openingHours, entryFee, bestTimeToVisit, duration, amenities, rating, tags

### Restaurants CSV Columns
- name, cuisine, description, address, area, latitude, longitude
- openingHours, priceRange, specialties, rating, tags

## Integration

The Travel Planner AI can be easily integrated with:
- **Backend APIs**: Use the Node.js service for web applications
- **Frontend Applications**: Call the service endpoints for dynamic trip planning
- **Mobile Apps**: JSON-based responses work well with mobile frameworks

## Benefits

- **No External Dependencies**: Uses only Python standard library
- **Fast Performance**: Optimized algorithms for quick trip generation
- **Personalized Results**: Tailors recommendations to individual preferences
- **Extensible Design**: Easy to add new features and data sources

## Training Process

### Data Preparation
1. **CSV Conversion**: JSON data converted to CSV format
2. **Text Processing**: Tokenization and cleaning of text fields
3. **Feature Extraction**: Creation of weighted feature vectors
4. **Similarity Matrix**: Pre-computed cosine similarities between all items

### Model Training Commands

#### Simple Model (No Dependencies)
```bash
cd "c:\Users\HP\Desktop\Travel Iterinary Planner\ml_models"
python simple_train_model.py
```

#### Advanced Model (With Dependencies)
```bash
pip install -r requirements.txt
python train_model.py
```

## Usage Examples

### 1. Similar Places Recommendation
```javascript
const service = new TravelRecommendationService();
const recommendations = service.getSimilarPlaces('VOC Park & Zoo', 5);
```

### 2. Preference-Based Recommendations
```javascript
const preferences = {
    categories: ['temple', 'museum'],
    tags: ['religious', 'education'],
    min_rating: 4.0
};
const recommendations = service.recommendByPreferences(preferences, 5);
```

### 3. Top Rated Places
```javascript
const topPlaces = service.getTopRatedPlaces(10);
```

### 4. Places by Category
```javascript
const temples = service.getPlacesByCategory('temple', 5);
```

## Model Performance

### Dataset Statistics
- **Total Places**: 20
- **Total Restaurants**: 7
- **Categories**: 9 (zoo, museum, temple, park, waterfall, etc.)
- **Unique Tags**: 25+ (family, children, religious, scenic, etc.)

### Recommendation Quality
- **Similarity Accuracy**: High for places with similar categories and tags
- **Preference Matching**: Effective for category and tag-based filtering
- **Rating Integration**: Incorporates user quality preferences

## API Endpoints (Integration Ready)

The recommendation service can be easily integrated into the backend API:

```javascript
// Example API routes
app.get('/api/recommendations/similar/:placeName', (req, res) => {
    const { placeName } = req.params;
    const { limit = 5 } = req.query;
    const recommendations = service.getSimilarPlaces(placeName, parseInt(limit));
    res.json(recommendations);
});

app.post('/api/recommendations/preferences', (req, res) => {
    const preferences = req.body;
    const { limit = 5 } = req.query;
    const recommendations = service.recommendByPreferences(preferences, parseInt(limit));
    res.json(recommendations);
});
```

## Model Evaluation

### Test Results
The model was tested with the following scenarios:

1. **Similar Places Test**: 
   - Query: "VOC Park & Zoo"
   - Results: Similar family-friendly recreational places
   - Accuracy: High similarity scores for matching categories

2. **Preference-Based Test**:
   - Query: Categories=['temple', 'museum'], Tags=['religious', 'education']
   - Results: Relevant temples and museums with high ratings
   - Accuracy: Proper filtering and ranking

3. **Top Rated Test**:
   - Query: Top 5 places
   - Results: Places sorted by rating (4.7 to 4.4)
   - Accuracy: Correct ranking by rating

## Future Enhancements

### Potential Improvements
1. **Collaborative Filtering**: Add user behavior data
2. **Geographic Distance**: Include actual distance calculations
3. **Time-Based Recommendations**: Consider visiting hours and season
4. **User Profiles**: Personalized recommendation history
5. **Sentiment Analysis**: Analyze user reviews for better matching

### Scalability
1. **Database Integration**: Store model in MongoDB/PostgreSQL
2. **Real-Time Updates**: Dynamic model retraining
3. **Caching**: Redis for frequent recommendations
4. **Microservices**: Separate recommendation service

## Dependencies

### Simple Model
- Python 3.x (built-in modules only)
- Node.js (for recommendation service)

### Advanced Model (Optional)
- pandas >= 1.5.0
- numpy >= 1.21.0
- scikit-learn >= 1.1.0
- joblib >= 1.1.0
- scipy >= 1.8.0

## Troubleshooting

### Common Issues
1. **Python Path Issues**: Use full Python executable path
2. **CSV Loading**: Ensure CSV files exist in correct paths
3. **Memory Usage**: Large datasets may require optimization
4. **Encoding**: Use UTF-8 encoding for text data

### Performance Tips
1. **Pre-compute Similarities**: Store similarity matrix for faster queries
2. **Feature Selection**: Use only relevant features to reduce dimensionality
3. **Caching**: Cache frequent recommendations
4. **Batch Processing**: Process multiple recommendations together

## Contributing

To improve the ML model:

1. **Add More Data**: Include additional places and restaurants
2. **Enhance Features**: Add new relevant features
3. **Test Algorithms**: Compare different similarity metrics
4. **Validate Results**: Test with real user preferences
5. **Document Changes**: Update this README with improvements

## License

This ML model is part of the Travel Itinerary Planner project and follows the same license terms.
