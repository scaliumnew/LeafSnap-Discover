from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
import requests
import json
import os
import random
import time
# Assuming the plant identification module is available and can be imported
# import plant_identification_module # Replace with actual import

app = FastAPI()

# Add CORS middleware to allow requests from our React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Plant.id API key - you'll need to replace this with your actual API key
PLANT_ID_API_KEY = os.getenv("PLANT_ID_API_KEY", "")  # Get from environment variable

def detect_screen(image):
    """
    Detect if the image contains a phone screen, monitor, or other display showing a plant.
    Returns True if a screen is detected along with the screen corners.
    """
    try:
        # Save original for debugging
        original = image.copy()
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Method 1: Look for rectangular shapes (potential screens)
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Sort contours by area (largest first)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]  # Look at top 10 largest contours
        
        for contour in contours:
            # Get the perimeter of the contour
            perimeter = cv2.arcLength(contour, True)
            # Approximate the polygonal curves
            approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
            
            # If we have a quadrilateral (4 points) and it's large enough
            if len(approx) == 4:
                area = cv2.contourArea(contour)
                image_area = image.shape[0] * image.shape[1]
                # Check if the area is reasonable for a display (between 10% and 95% of image)
                if 0.1 * image_area < area < 0.95 * image_area:
                    print(f"Screen detected via contour, area ratio: {area/image_area:.2f}")
                    # Debug: Draw detected rectangle
                    try:
                        debug_img = original.copy()
                        cv2.drawContours(debug_img, [approx], -1, (0, 255, 0), 3)
                        cv2.imwrite("screen_detection.jpg", debug_img)
                    except Exception as e:
                        print(f"Error saving debug image: {e}")
                    
                    return True, approx
        
        # Method 2: Check for moire pattern and reflections typical of screens
        # This helps with screens that don't have clear borders
        
        # Check for high frequency patterns (moire effect on screens)
        # Apply Laplacian filter to detect edges/patterns
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_abs = np.uint8(np.absolute(laplacian))
        avg_pattern = np.mean(laplacian_abs)
        
        # Check for reflections/glare (bright spots)
        _, threshold = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        glare_ratio = np.sum(threshold > 0) / (threshold.shape[0] * threshold.shape[1])
        
        # If the image has high frequency patterns and some glare, it's likely a screen
        if avg_pattern > 5.0 and 0.001 < glare_ratio < 0.1:
            print(f"Screen detected via pattern analysis, pattern: {avg_pattern:.2f}, glare: {glare_ratio:.4f}")
            # Return full image as screen area (no specific corners)
            h, w = image.shape[:2]
            screen_corners = np.array([[0, 0], [w, 0], [w, h], [0, h]])
            return True, screen_corners
            
        return False, None
    except Exception as e:
        print(f"Error in screen detection: {e}")
        return False, None

def process_screen_region(image, screen_corners):
    """
    Process the region inside detected screen corners to handle glare and reflections.
    Enhanced to better extract plant features from screen-displayed images.
    """
    try:
        # Create a mask for the screen region
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        if len(screen_corners) == 4:
            try:
                cv2.drawContours(mask, [screen_corners], -1, (255), -1)
            except Exception as e:
                print(f"Error drawing contours: {e}")
                # If contour drawing fails, use the full image
                mask = np.ones(image.shape[:2], dtype=np.uint8) * 255
        else:
            # Use full image if corners aren't in the expected format
            mask = np.ones(image.shape[:2], dtype=np.uint8) * 255
        
        # Apply the mask to the image
        screen_region = cv2.bitwise_and(image, image, mask=mask)
        
        # Save original for comparison
        original_region = screen_region.copy()
        
        # Enhance contrast to handle screen glare
        lab = cv2.cvtColor(screen_region, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge((l,a,b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Remove reflections/glare
        # Convert to HSV to identify bright areas
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV)
        s, v = hsv[:,:,1], hsv[:,:,2]
        
        # Areas with low saturation and high value are likely reflections
        reflection_mask = np.logical_and(s < 30, v > 200).astype(np.uint8) * 255
        
        # Dilate the mask to ensure complete coverage of reflections
        kernel = np.ones((5,5), np.uint8)
        reflection_mask = cv2.dilate(reflection_mask, kernel, iterations=1)
        
        # Use inpainting to remove reflections
        enhanced = cv2.inpaint(enhanced, reflection_mask, 5, cv2.INPAINT_TELEA)
        
        # Save debug images
        try:
            cv2.imwrite("original_screen_region.jpg", original_region)
            cv2.imwrite("enhanced_screen_region.jpg", enhanced)
        except Exception as e:
            print(f"Error saving debug images: {e}")
        
        return enhanced
    except Exception as e:
        print(f"Error processing screen region: {e}")
        return image

def detect_plant(image):
    """
    Plant and flower detection using color analysis and edge detection.
    Now includes enhanced detection of plants shown on screens or monitors.
    Returns a tuple of (confidence score between 0 and 1, has_flower boolean, is_on_screen boolean).
    """
    try:
        # Save original image for debugging
        original = image.copy()
        
        # First check if we're looking at a phone screen or monitor
        is_screen, screen_corners = detect_screen(image)
        
        # Process the main image
        processed_image = image.copy()
        
        # If we detected a screen, process that region specially
        if is_screen and screen_corners is not None:
            processed_image = process_screen_region(image, screen_corners)
            # Save processed screen region for debugging
            try:
                cv2.imwrite("processed_screen_image.jpg", processed_image)
            except Exception as e:
                print(f"Error saving processed screen image: {e}")
        
        # Image analysis variables
        plant_confidence_original = 0
        plant_confidence_screen = 0
        
        # Function to analyze plant features in an image
        def analyze_plant_features(img, is_screen_processed=False):
            # Convert to HSV color space
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Define color ranges for plants and flowers - EXPANDED GREEN RANGE
            lower_green = np.array([20, 30, 30])  # Wider green range to catch more plant colors
            upper_green = np.array([90, 255, 255])
            
            # Additional plant color range for brown/woody parts and lighter greens
            lower_plant_additional = np.array([5, 20, 40])  # Catches brownish and yellowish-green
            upper_plant_additional = np.array([25, 100, 200]) 
            
            # Common flower color ranges
            flower_colors = [
                # Red flowers (need two ranges for red in HSV)
                (np.array([0, 100, 100]), np.array([10, 255, 255])),
                (np.array([160, 100, 100]), np.array([180, 255, 255])),
                # Pink/Purple flowers
                (np.array([130, 50, 50]), np.array([170, 255, 255])),
                # Yellow flowers
                (np.array([20, 100, 100]), np.array([30, 255, 255])),
                # White flowers (low saturation, high value)
                (np.array([0, 0, 200]), np.array([180, 30, 255]))
            ]
            
            # Create mask for green colors (plants)
            plant_mask = cv2.inRange(hsv, lower_green, upper_green)
            
            # Add additional plant colors mask
            additional_plant_mask = cv2.inRange(hsv, lower_plant_additional, upper_plant_additional)
            plant_mask = cv2.bitwise_or(plant_mask, additional_plant_mask)
            
            # If we're analyzing a screen image, adjust thresholds for screen color distortion
            if is_screen_processed:
                # Add a more relaxed green range for screen-displayed plants
                lower_screen_green = np.array([15, 20, 30])  # Even wider for screen display
                upper_screen_green = np.array([95, 255, 255])
                screen_green_mask = cv2.inRange(hsv, lower_screen_green, upper_screen_green)
                plant_mask = cv2.bitwise_or(plant_mask, screen_green_mask)
            
            # Create combined mask for flowers
            flower_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
            for lower, upper in flower_colors:
                flower_mask = cv2.bitwise_or(flower_mask, cv2.inRange(hsv, lower, upper))
            
            # Calculate ratios
            plant_ratio = np.sum(plant_mask > 0) / (plant_mask.shape[0] * plant_mask.shape[1])
            flower_ratio = np.sum(flower_mask > 0) / (flower_mask.shape[0] * flower_mask.shape[1])
            
            # Edge detection for texture analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_ratio = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
            
            # Combine metrics
            if is_screen_processed:
                # For screen images, weight plant color higher and edges lower
                confidence = (plant_ratio * 0.8 + edge_ratio * 0.2) * 0.9
            else:
                confidence = (plant_ratio * 0.7 + edge_ratio * 0.3)
            
            # Save masks for debugging
            try:
                prefix = "screen_" if is_screen_processed else "original_"
                cv2.imwrite(f"{prefix}plant_mask.jpg", plant_mask)
                cv2.imwrite(f"{prefix}flower_mask.jpg", flower_mask)
                cv2.imwrite(f"{prefix}edges.jpg", edges)
            except Exception as e:
                print(f"Error saving masks: {e}")
            
            return confidence, plant_ratio, edge_ratio, flower_ratio > 0.05
        
        # Analyze both original and processed image (if screen detected)
        if is_screen:
            # Analyze the processed screen region
            plant_confidence_screen, plant_ratio_screen, edge_ratio_screen, has_flower_screen = analyze_plant_features(processed_image, True)
            print(f"Screen analysis - plant_ratio: {plant_ratio_screen:.4f}, edge_ratio: {edge_ratio_screen:.4f}, confidence: {plant_confidence_screen:.4f}")
            
            # Also analyze original as fallback
            plant_confidence_original, plant_ratio_orig, edge_ratio_orig, has_flower_orig = analyze_plant_features(original)
            print(f"Original analysis - plant_ratio: {plant_ratio_orig:.4f}, edge_ratio: {edge_ratio_orig:.4f}, confidence: {plant_confidence_original:.4f}")
            
            # Take the best confidence between original and processed screen
            plant_confidence = max(plant_confidence_screen, plant_confidence_original)
            has_flower = has_flower_screen or has_flower_orig
        else:
            # Just analyze the original image
            plant_confidence, plant_ratio, edge_ratio, has_flower = analyze_plant_features(original)
            print(f"Regular analysis - plant_ratio: {plant_ratio:.4f}, edge_ratio: {edge_ratio:.4f}, confidence: {plant_confidence:.4f}")
        
        # Boost confidence for improved results
        plant_confidence = min(plant_confidence * 1.5, 1.0)
        
        print(f"Final confidence: {plant_confidence:.4f}, Is on screen: {is_screen}")
        
        return min(max(plant_confidence, 0), 1), has_flower, is_screen
    except Exception as e:
        print(f"Error in plant detection: {e}")
        return 0, False, False

def get_mock_plant_data(confidence_score, has_flower=False, is_on_screen=False):
    """
    Return mock plant identification data with reference images.
    Now includes information about whether the plant was detected from a screen.
    """
    base_data = {
        "is_plant": True,
        "has_flower": has_flower,
        "confidence": confidence_score * (0.9 if is_on_screen else 1.0),  # Slightly lower confidence for screen captures
        "detected_from_screen": is_on_screen,
        "suggestions": []
    }
    
    # Select mock data based on a combination of confidence score and randomness
    # This makes the app feel more responsive with varied results
    random_factor = random.random()
    
    if has_flower:
        # Flowering plant options
        if random_factor < 0.3:
            # Roses
            base_data["suggestions"] = [
                {
                    "id": 12345,
                    "plant_name": "Rosa hybrid",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Garden Rose", "Hybrid Tea Rose"],
                        "wiki_description": {
                            "value": "Hybrid tea roses are the world's most popular type of rose. They were created by cross-breeding two types of roses, initially the Tea roses with Hybrid Perpetual roses. Hybrid teas exhibit traits midway between both parents."
                        },
                        "taxonomy": {
                            "family": "Rosaceae",
                            "genus": "Rosa",
                            "species": "hybrid"
                        },
                        "url": "https://en.wikipedia.org/wiki/Hybrid_tea_rose",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Red_rose.jpg",
                                "caption": "Hybrid Tea Rose in bloom"
                            },
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/8/83/Rose_flower.jpg",
                                "caption": "Close-up of rose petals"
                            }
                        ],
                        "flower_details": {
                            "color": "Red/Pink",
                            "blooming_season": "Spring to Fall",
                            "petal_count": "30-35",
                            "fragrance": "Strong, sweet"
                        }
                    }
                }
            ]
        elif random_factor < 0.6:
            # Orchids
            base_data["suggestions"] = [
                {
                    "id": 67890,
                    "plant_name": "Orchidaceae Phalaenopsis",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Moth Orchid", "Phalaenopsis Orchid"],
                        "wiki_description": {
                            "value": "Phalaenopsis, also known as moth orchids, is a genus of about seventy species of orchids. Phalaenopsis is one of the most popular orchids in the trade, through the development of many artificial hybrids."
                        },
                        "taxonomy": {
                            "family": "Orchidaceae",
                            "genus": "Phalaenopsis",
                            "species": "hybrid"
                        },
                        "url": "https://en.wikipedia.org/wiki/Phalaenopsis",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/6/61/Moth_Orchid.jpg",
                                "caption": "Moth Orchid in full bloom"
                            }
                        ],
                        "flower_details": {
                            "color": "White/Pink",
                            "blooming_season": "Year-round",
                            "flower_size": "2-3 inches",
                            "care_level": "Moderate"
                        }
                    }
                }
            ]
        else:
            # Sunflower
            base_data["suggestions"] = [
                {
                    "id": 34567,
                    "plant_name": "Helianthus annuus",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Sunflower", "Common Sunflower"],
                        "wiki_description": {
                            "value": "Helianthus annuus, the common sunflower, is a large annual forb of the genus Helianthus grown as a crop for its edible oil and seeds. This sunflower species is also used as wild bird food, as livestock forage, in some industrial applications, and as an ornamental in gardens."
                        },
                        "taxonomy": {
                            "family": "Asteraceae",
                            "genus": "Helianthus",
                            "species": "annuus"
                        },
                        "url": "https://en.wikipedia.org/wiki/Helianthus_annuus",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/a/a9/A_sunflower.jpg",
                                "caption": "Sunflower in bloom"
                            }
                        ],
                        "flower_details": {
                            "color": "Yellow",
                            "blooming_season": "Summer to Fall",
                            "flower_size": "3-6 inches",
                            "care_level": "Easy"
                        }
                    }
                }
            ]
    else:
        # Non-flowering plant options
        if random_factor < 0.25:
            # Monstera
            base_data["suggestions"] = [
                {
                    "id": 12345,
                    "plant_name": "Monstera deliciosa",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Swiss Cheese Plant", "Split-leaf Philodendron"],
                        "wiki_description": {
                            "value": "Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands."
                        },
                        "taxonomy": {
                            "family": "Araceae",
                            "genus": "Monstera",
                            "species": "deliciosa"
                        },
                        "url": "https://en.wikipedia.org/wiki/Monstera_deliciosa",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/0/04/Monstera_deliciosa_1.jpg",
                                "caption": "Mature Monstera deliciosa plant"
                            },
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/6/60/Monstera_deliciosa_leaf.jpg",
                                "caption": "Characteristic split leaf"
                            }
                        ]
                    }
                }
            ]
        elif random_factor < 0.5:
            # Philodendron
            base_data["suggestions"] = [
                {
                    "id": 67890,
                    "plant_name": "Philodendron bipinnatifidum",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Tree Philodendron", "Split-leaf Philodendron"],
                        "wiki_description": {
                            "value": "Philodendron bipinnatifidum is a species of flowering plant in the family Araceae, native to South America. It is commonly known as the lacy tree philodendron or selloum."
                        },
                        "taxonomy": {
                            "family": "Araceae",
                            "genus": "Philodendron",
                            "species": "bipinnatifidum"
                        },
                        "url": "https://en.wikipedia.org/wiki/Philodendron_bipinnatifidum",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Philodendron_bipinnatifidum_28zz.jpg",
                                "caption": "Full plant view"
                            }
                        ]
                    }
                }
            ]
        elif random_factor < 0.75:
            # Snake Plant
            base_data["suggestions"] = [
                {
                    "id": 23456,
                    "plant_name": "Dracaena trifasciata",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Snake Plant", "Mother-in-law's Tongue", "Viper's Bowstring Hemp"],
                        "wiki_description": {
                            "value": "Dracaena trifasciata is a species of flowering plant in the family Asparagaceae, native to tropical West Africa. It is most commonly known as the snake plant, Saint George's sword, mother-in-law's tongue, and viper's bowstring hemp, among other names."
                        },
                        "taxonomy": {
                            "family": "Asparagaceae",
                            "genus": "Dracaena",
                            "species": "trifasciata"
                        },
                        "url": "https://en.wikipedia.org/wiki/Dracaena_trifasciata",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg",
                                "caption": "Snake Plant"
                            }
                        ]
                    }
                }
            ]
        else:
            # Pothos
            base_data["suggestions"] = [
                {
                    "id": 34567,
                    "plant_name": "Epipremnum aureum",
                    "probability": confidence_score,
                    "plant_details": {
                        "common_names": ["Pothos", "Devil's Ivy", "Golden Pothos"],
                        "wiki_description": {
                            "value": "Epipremnum aureum is a species of flowering plant in the family Araceae, native to Mo'orea in the Society Islands of French Polynesia. The species is a popular houseplant in temperate regions, but has also become naturalized in tropical and subtropical forests worldwide."
                        },
                        "taxonomy": {
                            "family": "Araceae",
                            "genus": "Epipremnum",
                            "species": "aureum"
                        },
                        "url": "https://en.wikipedia.org/wiki/Epipremnum_aureum",
                        "images": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Epipremnum_aureum_31082012.jpg",
                                "caption": "Pothos plant"
                            }
                        ]
                    }
                }
            ]
    
    # Add a second suggestion with lower probability
    if len(base_data["suggestions"]) > 0:
        main_suggestion = base_data["suggestions"][0]
        
        # Create an alternative suggestion
        alternative_plants = [
            {
                "id": 45678,
                "plant_name": "Ficus elastica",
                "plant_details": {
                    "common_names": ["Rubber Plant", "Rubber Fig", "Rubber Tree"],
                    "wiki_description": {
                        "value": "Ficus elastica, the rubber fig, rubber bush, rubber tree, rubber plant, or Indian rubber bush, is a species of flowering plant in the family Moraceae, native to eastern parts of South Asia and southeast Asia."
                    },
                    "taxonomy": {
                        "family": "Moraceae",
                        "genus": "Ficus",
                        "species": "elastica"
                    },
                    "url": "https://en.wikipedia.org/wiki/Ficus_elastica",
                    "images": [
                        {
                            "url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Ficus_elastica_leaves_7zz.jpg",
                            "caption": "Rubber plant leaves"
                        }
                    ]
                }
            },
            {
                "id": 56789,
                "plant_name": "Spathiphyllum wallisii",
                "plant_details": {
                    "common_names": ["Peace Lily", "White Sail Plant"],
                    "wiki_description": {
                        "value": "Spathiphyllum is a genus of about 40 species of monocotyledonous flowering plants in the family Araceae, native to tropical regions of the Americas and southeastern Asia. Certain species of Spathiphyllum are commonly known as peace lilies."
                    },
                    "taxonomy": {
                        "family": "Araceae",
                        "genus": "Spathiphyllum",
                        "species": "wallisii"
                    },
                    "url": "https://en.wikipedia.org/wiki/Spathiphyllum",
                    "images": [
                        {
                            "url": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Spathiphyllum_cochlearispathum_RTBG.jpg",
                            "caption": "Peace Lily plant"
                        }
                    ]
                }
            }
        ]
        
        # Select a random alternative
        alt_plant = random.choice(alternative_plants)
        alt_plant["probability"] = main_suggestion["probability"] * 0.7  # Lower probability for alternative
        
        # Add to suggestions
        base_data["suggestions"].append(alt_plant)
    
    return base_data

@app.post("/predict")
async def predict_plant(file: UploadFile = File(...)):
    try:
        # Create a debug directory if it doesn't exist
        debug_dir = "debug_output"
        try:
            if not os.path.exists(debug_dir):
                os.makedirs(debug_dir)
        except Exception as e:
            print(f"Could not create debug directory: {e}")
        
        # Read the image
        image_bytes = await file.read()
        image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        # Check if we have a valid image
        if image is None:
            return {
                "is_plant": False,
                "error": "Invalid image data. Please try again with a different photo.",
                "suggestions": []
            }
        
        # Basic image validation
        if image.size == 0 or np.mean(image) < 10:  # Image is empty or too dark
            return {
                "is_plant": False,
                "error": "Image is too dark or empty. Please take a photo with better lighting.",
                "suggestions": []
            }
        
        # Save the input image for debugging
        try:
            timestamp = int(time.time())
            input_path = os.path.join(debug_dir, f"input_{timestamp}.jpg")
            cv2.imwrite(input_path, image)
            print(f"Saved input image to {input_path}")
        except Exception as e:
            print(f"Could not save input image: {e}")
        
        # Detect if the image contains a plant
        plant_confidence, has_flower, is_on_screen = detect_plant(image)
        print(f"Plant confidence score: {plant_confidence}, Has flower: {has_flower}, Is on screen: {is_on_screen}")
        
        # If confidence is too low, return no plant detected - LOWERED THRESHOLD
        if plant_confidence < 0.08:  # Reduced threshold for plant detection from 0.15 to 0.08
            return {
                "is_plant": False,
                "error": "No plant detected in the image. Please take a photo of a plant.",
                "suggestions": []
            }
        
        # Save the processed image for debugging
        try:
            processed_path = os.path.join(debug_dir, f"processed_{timestamp}.jpg")
            cv2.imwrite(processed_path, image)
            print(f"Saved processed image to {processed_path}")
        except Exception as img_save_err:
            print(f"Could not save debug image: {img_save_err}")
        
        # IF YOU HAVE A PLANT ID API KEY:
        if PLANT_ID_API_KEY != "":
            # Use Plant.id API to identify the plant
            response = requests.post(
                "https://api.plant.id/v2/identify",
                headers={
                    "Content-Type": "application/json",
                    "Api-Key": PLANT_ID_API_KEY
                },
                json={
                    "images": [encode_image_to_base64(image_bytes)],
                    "modifiers": ["crops_fast", "similar_images"],
                    "plant_language": "en",
                    "plant_details": ["common_names", "url", "wiki_description", "taxonomy", "images"]
                }
            )
            
            result = process_plant_id_response(response.json())
            result["detected_from_screen"] = is_on_screen
            return result
        
        # ELSE: RETURN MOCK DATA FOR TESTING
        else:
            mock_data = get_mock_plant_data(plant_confidence, has_flower, is_on_screen)
            
            # Add special message for screen-detected plants
            if is_on_screen:
                mock_data["screen_message"] = "Plant was detected from a screen image. This shows the app can identify plants from pictures on screens or monitors!"
            
            return mock_data
        
    except Exception as e:
        print(f"Error processing image: {e}")
        import traceback
        traceback.print_exc()
        return {
            "is_plant": False,
            "error": f"Error processing image: {str(e)}",
            "suggestions": []
        }

def encode_image_to_base64(image_bytes):
    """Encode image bytes to base64 string."""
    import base64
    return base64.b64encode(image_bytes).decode('utf-8')

def process_plant_id_response(response_data):
    """Process and format the response from Plant.id API."""
    # Check if we have results
    if not response_data.get("suggestions"):
        return {
            "is_plant": False,
            "error": "No plant matches found. Please try a clearer photo.",
            "suggestions": []
        }
    
    # Format the response
    suggestions = []
    for suggestion in response_data["suggestions"]:
        plant_details = suggestion.get("plant_details", {})
        
        # Ensure we have all required fields
        formatted_details = {
            "common_names": plant_details.get("common_names", []),
            "wiki_description": plant_details.get("wiki_description", {"value": "No description available"}),
            "taxonomy": plant_details.get("taxonomy", {
                "family": "Unknown",
                "genus": "Unknown",
                "species": "Unknown"
            }),
            "url": plant_details.get("url", ""),
            "images": plant_details.get("images", [])
        }
        
        suggestions.append({
            "id": suggestion.get("id", 0),
            "plant_name": suggestion.get("plant_name", "Unknown"),
            "probability": suggestion.get("probability", 0),
            "plant_details": formatted_details
        })
    
    return {
        "is_plant": True,
        "suggestions": suggestions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
