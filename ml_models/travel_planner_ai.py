import csv
import json
import math
from collections import defaultdict, Counter

class TravelPlannerAI:
    def __init__(self):
        self.places = []
        self.restaurants = []
        self.place_similarity = {}
        self.restaurant_similarity = {}
        
    def load_data(self, places_csv_path, restaurants_csv_path):
        """Load CSV data"""
        try:
            # Load places
            with open(places_csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.places = list(reader)
            
            # Load restaurants
            with open(restaurants_csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.restaurants = []
                for restaurant in reader:
                    # Add meal type categorization
                    restaurant['meal_type'] = self.categorize_meal_type(restaurant)
                    self.restaurants.append(restaurant)
            
            print(f"Loaded {len(self.places)} places and {len(self.restaurants)} restaurants")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def categorize_meal_type(self, restaurant):
        """Categorize restaurant by meal type based on specialties and tags"""
        specialties = (restaurant.get('specialties', '') or restaurant.get('tags', '')).lower()
        
        # Default to all meals
        meal_types = ['breakfast', 'lunch', 'dinner']
        
        # Check for breakfast places
        if any(keyword in specialties for keyword in ['breakfast', 'tiffin', 'dosa', 'idli', 'coffee', 'morning']):
            meal_types = ['breakfast', 'lunch']
        # Check for lunch places
        elif any(keyword in specialties for keyword in ['meals', 'lunch', 'biryani', 'rice']):
            meal_types = ['lunch', 'dinner']
        # Check for dinner places
        elif any(keyword in specialties for keyword in ['dinner', 'night', 'bar', 'pub']):
            meal_types = ['dinner']
            
        return meal_types
    
    def tokenize_text(self, text):
        """Simple text tokenization"""
        if not text:
            return []
        text = text.lower().replace(',', ' ').replace('|', ' ').replace('-', ' ')
        return [token.strip() for token in text.split() if token.strip()]
    
    def calculate_cosine_similarity(self, dict1, dict2):
        """Calculate cosine similarity between two feature dictionaries"""
        if not dict1 or not dict2:
            return 0
        
        all_terms = set(dict1.keys()).union(set(dict2.keys()))
        dot_product = sum(dict1.get(term, 0) * dict2.get(term, 0) for term in all_terms)
        mag1 = math.sqrt(sum(dict1.get(term, 0) ** 2 for term in all_terms))
        mag2 = math.sqrt(sum(dict2.get(term, 0) ** 2 for term in all_terms))
        
        if mag1 == 0 or mag2 == 0:
            return 0
        
        return dot_product / (mag1 * mag2)
    
    def create_feature_vector(self, item):
        """Create feature vector for similarity calculation"""
        features = defaultdict(int)
        
        # Add category features
        category = item.get('category', '').lower()
        if category:
            features[f'category_{category}'] += 3
        
        # Add tag features
        tags = item.get('tags', '').lower()
        for tag in self.tokenize_text(tags):
            features[f'tag_{tag}'] += 2
        
        # Add area features
        area = item.get('area', '').lower()
        if area:
            features[f'area_{area}'] += 1
        
        # Add description features
        description = item.get('description', '').lower()
        desc_tokens = self.tokenize_text(description)
        for token in desc_tokens:
            if len(token) > 3:
                features[f'desc_{token}'] += 1
        
        # Add rating as a feature
        try:
            rating = float(item.get('rating', 0))
            if rating > 0:
                features['rating'] = rating
        except:
            pass
        
        return dict(features)
    
    def calculate_similarity_matrices(self):
        """Calculate similarity matrices for places and restaurants"""
        print("Calculating similarity matrices...")
        
        # Create feature vectors for places
        place_features = []
        for place in self.places:
            features = self.create_feature_vector(place)
            place_features.append(features)
        
        # Calculate place similarity matrix
        for i, place1 in enumerate(self.places):
            self.place_similarity[i] = {}
            for j, place2 in enumerate(self.places):
                if i != j:
                    similarity = self.calculate_cosine_similarity(
                        place_features[i], place_features[j]
                    )
                    self.place_similarity[i][j] = similarity
        
        # Create feature vectors for restaurants
        restaurant_features = []
        for restaurant in self.restaurants:
            features = self.create_feature_vector(restaurant)
            restaurant_features.append(features)
        
        # Calculate restaurant similarity matrix
        for i, rest1 in enumerate(self.restaurants):
            self.restaurant_similarity[i] = {}
            for j, rest2 in enumerate(self.restaurants):
                if i != j:
                    similarity = self.calculate_cosine_similarity(
                        restaurant_features[i], restaurant_features[j]
                    )
                    self.restaurant_similarity[i][j] = similarity
        
        print("Similarity matrices calculated")
    
    def map_interests_to_preferences(self, interests):
        """Map user interests to categories and tags for trip planning"""
        # Interest to categories mapping
        interest_to_categories = {
            'nature': ['park', 'botanical_garden', 'lake', 'waterfall', 'national_park', 'tea_garden', 'garden', 'wildlife', 'dam', 'boat_house'],
            'temples': ['temple'],
            'adventure': ['amusement', 'trekking', 'national_park', 'wildlife', 'boat_house', 'viewpoint'],
            'shopping': ['shopping', 'mall'],
            'food': ['restaurant'],  # This will be handled separately for restaurants
            'music': ['art_gallery', 'museum']  # Cultural places
        }
        
        # Interest to tags mapping
        interest_to_tags = {
            'nature': ['nature', 'scenic', 'photography', 'outdoor', 'family', 'environment', 'green', 'peaceful'],
            'temples': ['religious', 'spiritual', 'ancient', 'architecture', 'heritage', 'pilgrimage', 'peaceful'],
            'adventure': ['adventure', 'thrill', 'exciting', 'outdoor', 'adrenaline', 'sports', 'active'],
            'shopping': ['shopping', 'brands', 'entertainment', 'food', 'modern', 'urban'],
            'food': ['food', 'dining', 'cuisine', 'family', 'traditional', 'local'],
            'music': ['culture', 'art', 'music', 'education', 'entertainment', 'history']
        }
        
        preferred_categories = []
        preferred_tags = []
        
        # Convert each interest to categories and tags
        for interest in interests:
            if interest in interest_to_categories:
                preferred_categories.extend(interest_to_categories[interest])
            if interest in interest_to_tags:
                preferred_tags.extend(interest_to_tags[interest])
        
        # Remove duplicates while preserving order
        preferred_categories = list(dict.fromkeys(preferred_categories))
        preferred_tags = list(dict.fromkeys(preferred_tags))
        
        return {
            'categories': preferred_categories,
            'tags': preferred_tags
        }
    
    def generate_trip_plan(self, preferences, duration_days=3):
        """Generate a complete trip plan based on user preferences"""
        try:
            # Handle interests input (from frontend) and convert to categories/tags
            if 'interests' in preferences:
                mapped_prefs = self.map_interests_to_preferences(preferences['interests'])
                preferred_categories = mapped_prefs['categories']
                preferred_tags = mapped_prefs['tags']
            else:
                # Backward compatibility for direct categories/tags input
                preferred_categories = preferences.get('categories', [])
                preferred_tags = preferences.get('tags', [])
            
            min_rating = preferences.get('min_rating', 0)
            budget = preferences.get('budget', 'medium')
            
            # Calculate daily budget based on total budget and duration
            budget_info = self.calculate_daily_budget(budget, duration_days)
            
            # Filter and score places based on user interests (more selective)
            scored_places = []
            for place in self.places:
                score = 0
                has_interest_match = False
                
                # Category preference (higher weight) - MUST match at least one interest
                if place['category'] in preferred_categories:
                    score += 20
                    has_interest_match = True
                
                # Tag preference (medium weight) - MUST match at least one tag
                place_tags = self.tokenize_text(place['tags'])
                for tag in preferred_tags:
                    if tag in place_tags:
                        score += 10
                        has_interest_match = True
                
                # Only include places that match user interests
                if not has_interest_match:
                    continue
                
                # Rating bonus
                try:
                    rating = float(place['rating'])
                    if rating >= min_rating:
                        score += rating * 2  # Double weight for rating
                except:
                    pass
                
                # Area preference (if user specified area)
                if 'area' in preferences and place.get('area', '').lower() == preferences['area'].lower():
                    score += 10
                
                # Add timing information based on category
                place['visit_duration'] = self.get_visit_duration(place['category'])
                place['bestTimeToVisit'] = self.get_best_time_to_visit(place['category'], place.get('tags', ''))
                
                scored_places.append((place, score))
            
            scored_places.sort(key=lambda x: x[1], reverse=True)
            
            # Filter and score restaurants by meal type and user interests (more selective)
            scored_restaurants = []
            for restaurant in self.restaurants:
                score = 0
                has_interest_match = False
                
                # Tag preference (medium weight) - MUST match at least one tag
                rest_tags = self.tokenize_text(restaurant['tags'])
                for tag in preferred_tags:
                    if tag in rest_tags:
                        score += 10
                        has_interest_match = True
                
                # Only include restaurants that match user interests
                if not has_interest_match and preferred_tags:
                    continue
                
                # Rating bonus (double weight)
                try:
                    rating = float(restaurant['rating'])
                    if rating >= min_rating:
                        score += rating * 2  # Double weight for rating
                except:
                    pass
                
                # Cuisine preference (if user specified)
                if 'cuisine' in preferences and restaurant.get('specialties', '').lower() == preferences['cuisine'].lower():
                    score += 12
                
                # Area preference (if user specified area)
                if 'area' in preferences and restaurant.get('area', '').lower() == preferences['area'].lower():
                    score += 10
                
                scored_restaurants.append((restaurant, score))
            
            scored_restaurants.sort(key=lambda x: x[1], reverse=True)
            
            # Generate daily itinerary with all 3 meals per day
            daily_plans = []
            places_per_day = min(3, len(scored_places) // duration_days)
            restaurants_per_day = min(3, len(scored_restaurants) // duration_days)  # Ensure 3 meals per day
            
            for day in range(duration_days):
                day_plan = {
                    'day': day + 1,
                    'places': [],
                    'restaurants': {
                        'breakfast': [],
                        'lunch': [],
                        'dinner': []
                    }
                }
                
                # Add places for this day
                start_idx = day * places_per_day
                end_idx = min(start_idx + places_per_day, len(scored_places))
                for i in range(start_idx, end_idx):
                    place, score = scored_places[i]
                    day_plan['places'].append(place)
                
                # Add 3 meal-specific restaurants for this day
                start_rest_idx = day * restaurants_per_day
                end_rest_idx = min(start_rest_idx + restaurants_per_day, len(scored_restaurants))
                
                # Distribute restaurants across all 3 meals
                meal_types = ['breakfast', 'lunch', 'dinner']
                for i, restaurant_data in enumerate(scored_restaurants[start_rest_idx:end_rest_idx]):
                    restaurant, score = restaurant_data
                    restaurant_meal_types = restaurant.get('meal_type', ['breakfast', 'lunch', 'dinner'])
                    
                    # Assign to first available meal type
                    for meal_type in meal_types:
                        if len(day_plan['restaurants'][meal_type]) == 0:
                            day_plan['restaurants'][meal_type].append(restaurant)
                            break
                
                # Fill empty meal slots with additional restaurants if available
                used_restaurants = start_rest_idx + (end_rest_idx - start_rest_idx)
                remaining_restaurants = scored_restaurants[used_restaurants:]
                
                for meal_type in meal_types:
                    if len(day_plan['restaurants'][meal_type]) == 0 and remaining_restaurants:
                        day_plan['restaurants'][meal_type].append(remaining_restaurants.pop(0))
                
                daily_plans.append(day_plan)
            
            return {
                'trip_duration': duration_days,
                'preferences': preferences,
                'daily_plans': daily_plans,
                'budget': budget_info,
                'summary': {
                    'total_places': sum(len(plan['places']) for plan in daily_plans),
                    'total_restaurants': sum(
                        sum(len(meals) for meals in plan['restaurants'].values()) 
                        for plan in daily_plans
                    )
                }
            }
            
        except Exception as e:
            print(f"Error generating trip plan: {e}")
            return {'error': str(e)}
    
    def get_best_time_to_visit(self, category, tags=''):
        """Get best time to visit based on category and tags"""
        category = category.lower()
        tags = tags.lower()
        
        # Default times based on category
        best_times = {
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
        }
        
        # Get base time for category
        base_time = best_times.get(category, '9 to 11 AM or 2 to 4 PM')
        
        # Adjust based on tags
        if 'outdoor' in tags or 'nature' in tags:
            base_time = '6 to 8 AM or 4 to 6 PM'
        elif 'religious' in tags and category != 'temple':
            base_time = '6 to 8 AM or 4 to 6 PM'
        elif 'adventure' in tags:
            base_time = '8 to 10 AM or 2 to 4 PM'
        elif 'photography' in tags:
            base_time = 'Golden hours: 6 to 8 AM or 4 to 6 PM'
        elif 'family' in tags:
            base_time = '10 to 12 PM or 2 to 4 PM'
        elif 'nightlife' in tags:
            base_time = '6 to 10 PM'
        
        return base_time
    
    def get_visit_duration(self, category):
        """Get typical visit duration for place category"""
        durations = {
            'temple': '2-3 hours',
            'museum': '2-4 hours',
            'park': '1-2 hours',
            'shopping': '2-3 hours',
            'amusement': '4-6 hours',
            'waterfall': '1-2 hours',
            'zoo': '3-4 hours',
            'beach': '2-3 hours',
            'hill station': '3-4 hours'
        }
        return durations.get(category.lower(), '1-2 hours')
    
    def calculate_daily_budget(self, budget, duration_days):
        """Calculate daily budget based on total budget and duration"""
        # Remove currency symbols and convert to number
        if isinstance(budget, str):
            budget_num = ''.join(filter(str.isdigit, budget))
            if budget_num:
                budget_num = int(budget_num)
            else:
                # Default budgets for different budget levels
                budget_defaults = {
                    'low': 2000,
                    'medium': 5000,
                    'high': 10000
                }
                budget_num = budget_defaults.get(budget.lower(), 5000)
        else:
            budget_num = budget
        
        daily_budget = budget_num // duration_days
        return {
            'total': budget_num,
            'daily': daily_budget,
            'currency': '₹'
        }
    
    def train(self, places_csv_path, restaurants_csv_path):
        """Train the travel planner AI"""
        print("Starting travel planner AI training...")
        
        if not self.load_data(places_csv_path, restaurants_csv_path):
            return False
        
        self.calculate_similarity_matrices()
        print("Travel planner AI training completed successfully!")
        return True
    
    def save_model(self, model_path):
        """Save the trained model"""
        try:
            model_data = {
                'places': self.places,
                'restaurants': self.restaurants,
                'place_similarity': self.place_similarity,
                'restaurant_similarity': self.restaurant_similarity
            }
            
            with open(model_path, 'w', encoding='utf-8') as f:
                json.dump(model_data, f, indent=2, ensure_ascii=False)
            
            print(f"Travel planner AI saved to {model_path}")
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False

def main():
    # Initialize the travel planner AI
    planner = TravelPlannerAI()
    
    # Paths to CSV files
    places_csv = "coimbatore-places.csv"
    restaurants_csv = "coimbatore-restaurants.csv"
    model_path = "travel_planner_model.json"
    
    # Train the AI
    if planner.train(places_csv, restaurants_csv):
        # Save the trained model
        planner.save_model(model_path)
        
        # Test the AI with trip planning
        print("\n" + "="*50)
        print("TESTING TRAVEL PLANNER AI")
        print("="*50)
        
        # Test trip planning
        print("\nGenerating 3-day trip plan for user preferences:")
        user_preferences = {
            'interests': ['temples', 'nature', 'adventure'],  # Using interests instead of categories/tags
            'min_rating': 4.0,
            'budget': 'medium'
        }
        
        trip_plan = planner.generate_trip_plan(user_preferences, 3)
        
        if 'error' not in trip_plan:
            print(f"\nTrip Duration: {trip_plan['trip_duration']} days")
            print(f"Budget: {trip_plan['budget']['currency']}{trip_plan['budget']['total']} total ({trip_plan['budget']['currency']}{trip_plan['budget']['daily']} per day)")
            print(f"Summary: {trip_plan['summary']['total_places']} places, {trip_plan['summary']['total_restaurants']} restaurants\n")
            
            for day_plan in trip_plan['daily_plans']:
                print(f"Day {day_plan['day']}:")
                print("  Places to visit:")
                for place in day_plan['places']:
                    # Handle both tuple format and dict format
                    if isinstance(place, tuple):
                        place_data, score = place
                        print(f"    - {place_data['name']} ({place_data['category']}) - Rating: {place_data['rating']}")
                    else:
                        print(f"    - {place['name']} ({place['category']}) - Rating: {place['rating']}")
                
                print("  Restaurants:")
                restaurants = day_plan['restaurants']
                if isinstance(restaurants, dict):
                    for meal_type, meal_restaurants in restaurants.items():
                        if meal_restaurants:
                            print(f"    {meal_type.capitalize()}:")
                            for restaurant in meal_restaurants:
                                # Handle both tuple format and dict format
                                if isinstance(restaurant, tuple):
                                    restaurant_data, score = restaurant
                                    print(f"      - {restaurant_data['name']} - Rating: {restaurant_data['rating']}")
                                else:
                                    print(f"      - {restaurant['name']} - Rating: {restaurant['rating']}")
                else:
                    # Handle old format for backward compatibility
                    for restaurant in restaurants:
                        if isinstance(restaurant, tuple):
                            restaurant_data, score = restaurant
                            print(f"    - {restaurant_data['name']} - Rating: {restaurant_data['rating']}")
                        else:
                            print(f"    - {restaurant['name']} - Rating: {restaurant['rating']}")
                print()
        else:
            print(f"Error: {trip_plan['error']}")
        
        print("="*50)
        print("TRAVEL PLANNER AI TRAINING AND TESTING COMPLETED!")
        print("="*50)
    else:
        print("Travel planner AI training failed!")

if __name__ == "__main__":
    main()
