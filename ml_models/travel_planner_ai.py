import json
import csv
import math
from collections import defaultdict, Counter
import random

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

    def calculate_text_similarity(self, text1, text2):
        """Calculate cosine similarity between two text strings"""
        if not text1 or not text2:
            return 0
        
        # Convert text to feature vectors
        tokens1 = self.tokenize_text(text1)
        tokens2 = self.tokenize_text(text2)
        
        # Create frequency dictionaries
        freq1 = defaultdict(int)
        freq2 = defaultdict(int)
        
        for token in tokens1:
            freq1[token] += 1
        
        for token in tokens2:
            freq2[token] += 1
        
        return self.calculate_cosine_similarity(freq1, freq2)
    
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
        # Place similarity based on categories and tags
        for i, place1 in enumerate(self.places):
            for j, place2 in enumerate(self.places):
                if i < j:
                    similarity = self.calculate_text_similarity(
                        place1['category'] + ' ' + place1['tags'],
                        place2['category'] + ' ' + place2['tags']
                    )
                    self.place_similarity[(i, j)] = similarity
                    self.place_similarity[(j, i)] = similarity
        
        # Restaurant similarity based on tags
        for i, rest1 in enumerate(self.restaurants):
            for j, rest2 in enumerate(self.restaurants):
                if i < j:
                    similarity = self.calculate_text_similarity(
                        rest1['tags'],
                        rest2['tags']
                    )
                    self.restaurant_similarity[(i, j)] = similarity
                    self.restaurant_similarity[(j, i)] = similarity
        
        print("Similarity matrices calculated")

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate Haversine distance between two coordinates in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    def get_region_from_area(self, area, city=None):
        """Map specific areas to major geographic regions"""
        area_lower = area.lower()
        
        # Use city field if available for more precise matching (highest priority)
        if city:
            city_lower = city.lower()
            if 'coimbatore' in city_lower or 'gandhipuram' in city_lower:
                return 'coimbatore'
            elif 'ooty' in city_lower or 'nilgiris' in city_lower or 'coonoor' in city_lower:
                return 'ooty_nilgiris'
            elif 'munnar' in city_lower or 'idukki' in city_lower:
                return 'munnar'
            elif 'kodaikanal' in city_lower or 'dindigul' in city_lower:
                return 'kodaikanal'
            elif 'palakkad' in city_lower:
                return 'palakkad'
            elif 'pollachi' in city_lower or 'aliyar' in city_lower:
                return 'pollachi'
            elif 'erode' in city_lower:
                return 'erode'
            elif 'palani' in city_lower:
                return 'palani'
        
        # Define region mappings - more comprehensive
        region_mappings = {
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
            'palani': ['palani'],
            'other': []
        }
        
        for region, areas in region_mappings.items():
            if region == 'other':
                continue
            for area_name in areas:
                if area_name in area_lower:
                    return region
        
        return 'other'

    def cluster_places_by_region(self, places, num_clusters):
        """Cluster places by major geographic regions for localized daily plans"""
        if num_clusters <= 1:
            return [places]
        
        # Group places by major region
        region_groups = defaultdict(list)
        for place in places:
            area = place.get('area', 'Unknown')
            city = place.get('city', None)  # Some places might have city field
            region = self.get_region_from_area(area, city)
            region_groups[region].append(place)
        
        # Get the top regions by place count
        sorted_regions = sorted(region_groups.items(), key=lambda x: len(x[1]), reverse=True)
        
        # Create clusters based on regions
        clusters = []
        for region, region_places in sorted_regions[:num_clusters]:
            if region_places:
                clusters.append(region_places)
        
        # If we need more clusters, split the largest region
        while len(clusters) < num_clusters and clusters:
            largest_cluster = max(clusters, key=len)
            if len(largest_cluster) > 2:
                mid = len(largest_cluster) // 2
                clusters.remove(largest_cluster)
                clusters.append(largest_cluster[:mid])
                clusters.append(largest_cluster[mid:])
            else:
                break
        
        # If we still don't have enough clusters, add empty ones
        while len(clusters) < num_clusters:
            clusters.append([])
        
        return clusters[:num_clusters]

    def cluster_places_by_area(self, places, num_clusters):
        """Cluster places by geographic area using area field and coordinates"""
        if num_clusters <= 1:
            return [places]
        
        # Group places by area first
        area_groups = defaultdict(list)
        for place in places:
            area = place.get('area', 'Unknown')
            area_groups[area].append(place)
        
        # If we have enough area groups, use them directly
        area_list = list(area_groups.values())
        
        # If we need more clusters than areas, split large areas
        clusters = []
        for area_places in area_list:
            if len(area_places) > 1 and len(clusters) < num_clusters:
                # Split by coordinates if needed
                if len(area_places) > 3:
                    mid = len(area_places) // 2
                    clusters.append(area_places[:mid])
                    clusters.append(area_places[mid:])
                else:
                    clusters.append(area_places)
            else:
                clusters.append(area_places)
        
        # Ensure we have exactly num_clusters
        while len(clusters) > num_clusters:
            # Merge smallest clusters
            clusters.sort(key=len)
            clusters[0].extend(clusters[1])
            clusters.pop(1)
        
        while len(clusters) < num_clusters:
            # Split largest cluster
            clusters.sort(key=len, reverse=True)
            if len(clusters[0]) > 1:
                mid = len(clusters[0]) // 2
                clusters.append(clusters[0][mid:])
                clusters[0] = clusters[0][:mid]
            else:
                break
        
        return clusters[:num_clusters]

    def cluster_restaurants_by_region(self, restaurants, num_clusters):
        """Cluster restaurants by major geographic regions for localized daily plans"""
        if num_clusters <= 1:
            return [restaurants]
        
        # Group restaurants by major region
        region_groups = defaultdict(list)
        for restaurant in restaurants:
            area = restaurant.get('area', 'Unknown')
            city = restaurant.get('city', None)  # Restaurants have city field
            region = self.get_region_from_area(area, city)
            region_groups[region].append(restaurant)
        
        # Get the top regions by restaurant count
        sorted_regions = sorted(region_groups.items(), key=lambda x: len(x[1]), reverse=True)
        
        # Create clusters based on regions
        clusters = []
        for region, region_restaurants in sorted_regions[:num_clusters]:
            if region_restaurants:
                clusters.append(region_restaurants)
        
        # If we need more clusters, split the largest region
        while len(clusters) < num_clusters and clusters:
            largest_cluster = max(clusters, key=len)
            if len(largest_cluster) > 2:
                mid = len(largest_cluster) // 2
                clusters.remove(largest_cluster)
                clusters.append(largest_cluster[:mid])
                clusters.append(largest_cluster[mid:])
            else:
                break
        
        # If we still don't have enough clusters, add empty ones
        while len(clusters) < num_clusters:
            clusters.append([])
        
        return clusters[:num_clusters]
    
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
            
            # Score and prioritize places based on user interests (not filtering)
            scored_places = []
            for place in self.places:
                score = 0
                has_interest_match = False
                
                # Category preference (higher weight) - PRIORITIZE interest matches
                if place['category'] in preferred_categories:
                    score += 25  # Increased weight for category match
                    has_interest_match = True
                
                # Tag preference (medium weight) - PRIORITIZE tag matches
                place_tags = self.tokenize_text(place['tags'])
                for tag in preferred_tags:
                    if tag in place_tags:
                        score += 15  # Increased weight for tag match
                        has_interest_match = True
                
                # Base score for all places (ensures non-matching places are still included)
                score += 5  # Minimum score for all places
                
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
                
                scored_places.append((place, score, has_interest_match))
            
            scored_places.sort(key=lambda x: x[1], reverse=True)
            
            # Score and prioritize restaurants based on user interests (not filtering)
            scored_restaurants = []
            for restaurant in self.restaurants:
                score = 0
                has_interest_match = False
                
                # Tag preference (medium weight) - PRIORITIZE tag matches
                rest_tags = self.tokenize_text(restaurant['tags'])
                for tag in preferred_tags:
                    if tag in rest_tags:
                        score += 15  # Increased weight for tag match
                        has_interest_match = True
                
                # Base score for all restaurants (ensures non-matching restaurants are still included)
                score += 5  # Minimum score for all restaurants
                
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
                
                scored_restaurants.append((restaurant, score, has_interest_match))
            
            scored_restaurants.sort(key=lambda x: x[1], reverse=True)
            
            # Extract place data from tuples for clustering
            all_places = [p[0] for p in scored_places]
            all_restaurants = [r[0] for r in scored_restaurants]
            
            # Cluster places by geographic region for each day
            place_clusters = self.cluster_places_by_region(all_places, duration_days)
            restaurant_clusters = self.cluster_restaurants_by_region(all_restaurants, duration_days)
            
            # Generate daily itinerary with area-based clustering
            daily_plans = []
            places_per_day = min(3, max(1, len(all_places) // duration_days))
            restaurants_per_day = min(3, max(1, len(all_restaurants) // duration_days))
            
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
                
                # Get places for this day's area cluster
                day_places = place_clusters[day] if day < len(place_clusters) else all_places
                
                # Prioritize interest-matched places within this area
                day_places_with_score = []
                for place in day_places:
                    # Find original score and interest match
                    original_data = next((p for p in scored_places if p[0]['name'] == place['name']), None)
                    if original_data:
                        day_places_with_score.append((place, original_data[1], original_data[2]))
                    else:
                        day_places_with_score.append((place, 0, False))
                
                # Sort by score (interest-matched first)
                day_places_with_score.sort(key=lambda x: x[1], reverse=True)
                
                # Ensure variety of categories within the day
                selected_places = []
                used_categories = set()
                
                # First pass: get one from each category if available
                for place, score, has_match in day_places_with_score:
                    if len(selected_places) >= places_per_day:
                        break
                    category = place.get('category', 'unknown')
                    if category not in used_categories or len(selected_places) >= places_per_day - 1:
                        selected_places.append(place)
                        used_categories.add(category)
                
                # Second pass: fill remaining slots with highest scored
                for place, score, has_match in day_places_with_score:
                    if len(selected_places) >= places_per_day:
                        break
                    if place not in selected_places:
                        selected_places.append(place)
                
                day_plan['places'] = selected_places
                
                # Get restaurants for this day's area cluster
                day_restaurants = restaurant_clusters[day] if day < len(restaurant_clusters) else all_restaurants
                
                # Force restaurants to be from the same region as places
                if day_plan['places']:
                    first_place_region = self.get_region_from_area(
                        day_plan['places'][0].get('area', ''),
                        day_plan['places'][0].get('city', None)
                    )
                    # Get all restaurants from this region only
                    region_restaurants = [r for r in all_restaurants 
                                        if self.get_region_from_area(r.get('area', ''), r.get('city', None)) == first_place_region]
                    if region_restaurants:
                        day_restaurants = region_restaurants
                    else:
                        # If no restaurants in this region, use closest available
                        day_restaurants = all_restaurants
                
                # Prioritize interest-matched restaurants within this area
                day_restaurants_with_score = []
                for restaurant in day_restaurants:
                    # Find original score and interest match
                    original_data = next((r for r in scored_restaurants if r[0]['name'] == restaurant['name']), None)
                    if original_data:
                        day_restaurants_with_score.append((restaurant, original_data[1], original_data[2]))
                    else:
                        day_restaurants_with_score.append((restaurant, 0, False))
                
                # Sort by score (interest-matched first)
                day_restaurants_with_score.sort(key=lambda x: x[1], reverse=True)
                
                # Add top restaurants for this day
                day_restaurants_list = [r[0] for r in day_restaurants_with_score[:restaurants_per_day]]
                
                # Distribute restaurants across all 3 meals
                meal_types = ['breakfast', 'lunch', 'dinner']
                for restaurant in day_restaurants_list:
                    restaurant_meal_types = restaurant.get('meal_type', ['breakfast', 'lunch', 'dinner'])
                    
                    # Assign to first available meal type
                    for meal_type in meal_types:
                        if len(day_plan['restaurants'][meal_type]) == 0:
                            day_plan['restaurants'][meal_type].append(restaurant)
                            break
                
                # Fill empty meal slots with additional restaurants if available
                used_rest_names = set(r['name'] for r in day_restaurants_list)
                remaining_restaurants = [r[0] for r in scored_restaurants if r[0]['name'] not in used_rest_names]
                
                for meal_type in meal_types:
                    if len(day_plan['restaurants'][meal_type]) == 0 and remaining_restaurants:
                        restaurant = remaining_restaurants.pop(0)
                        day_plan['restaurants'][meal_type].append(restaurant)
                
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
                    ),
                    'interest_matched_places': len([p for p in scored_places if p[2]]),
                    'interest_matched_restaurants': len([r for r in scored_restaurants if r[2]]),
                    'total_available_places': len(scored_places),
                    'total_available_restaurants': len(scored_restaurants),
                    'area_clusters': len(place_clusters)
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
            # Convert tuple keys to string keys for JSON compatibility
            place_similarity_str = {str(k): v for k, v in self.place_similarity.items()}
            restaurant_similarity_str = {str(k): v for k, v in self.restaurant_similarity.items()}
            
            model_data = {
                'places': self.places,
                'restaurants': self.restaurants,
                'place_similarity': place_similarity_str,
                'restaurant_similarity': restaurant_similarity_str
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
            print(f"Summary: {trip_plan['summary']['total_places']} places, {trip_plan['summary']['total_restaurants']} restaurants")
            print(f"Interest Matched: {trip_plan['summary']['interest_matched_places']} places, {trip_plan['summary']['interest_matched_restaurants']} restaurants")
            print(f"Total Available: {trip_plan['summary']['total_available_places']} places, {trip_plan['summary']['total_available_restaurants']} restaurants")
            print(f"Area Clusters: {trip_plan['summary']['area_clusters']} geographic regions\n")
            
            for day_plan in trip_plan['daily_plans']:
                print(f"Day {day_plan['day']}:")
                print("  Places to visit:")
                for place in day_plan['places']:
                    # Handle both tuple format and dict format
                    if isinstance(place, tuple):
                        place_data, score, has_match = place
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
                                    restaurant_data, score, has_match = restaurant
                                    print(f"      - {restaurant_data['name']} - Rating: {restaurant_data['rating']}")
                                else:
                                    print(f"      - {restaurant['name']} - Rating: {restaurant['rating']}")
                else:
                    # Handle old format for backward compatibility
                    for restaurant in restaurants:
                        if isinstance(restaurant, tuple):
                            restaurant_data, score, has_match = restaurant
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
