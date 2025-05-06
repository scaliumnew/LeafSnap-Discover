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
import traceback  # Add traceback for better error logging
import base64
# Import Google Generative AI library
try:
    import google.generativeai as genai
except ImportError:
    print("Google GenerativeAI library not found. Installing...")
    import subprocess
    subprocess.check_call(["pip", "install", "google-generativeai"])
    import google.generativeai as genai

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

# Gemini API key - using the key provided by the user
GEMINI_API_KEY = "AIzaSyAzPI6gm13GU3Gqn2PTRZFgYl7qWJDhfuc"

# Initialize Gemini configuration
genai.configure(api_key=GEMINI_API_KEY)

# Test the Gemini API at startup to ensure it's working
try:
    # Don't test at startup to avoid unnecessary errors
    # text_model = genai.GenerativeModel('gemini-pro')
    # response = text_model.generate_content("Hello, world!")
    print("Gemini API configured with provided key.")
except Exception as e:
    print(f"Warning: Failed to initialize Gemini API: {e}")
    traceback.print_exc()

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
            
            return confidence, plant_ratio, edge_ratio, flower_ratio > 0.1 # Increased threshold
        
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
        try:
            image_bytes = await file.read()
            if not image_bytes:
                return {
                    "is_plant": False,
                    "error": "Empty image file received. Please try again with a valid photo.",
                    "suggestions": []
                }
                
            # Log image file details for debugging
            print(f"Received image file: {file.filename}, size: {len(image_bytes)} bytes")
            
            # Decode the image
            try:
                image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            except Exception as decode_error:
                print(f"Image decoding error: {decode_error}")
                traceback.print_exc()
                return {
                    "is_plant": False,
                    "error": "Unable to decode the image. The file may be corrupted or in an unsupported format.",
                    "suggestions": []
                }
        except Exception as read_error:
            print(f"Error reading image file: {read_error}")
            traceback.print_exc()
            return {
                "is_plant": False,
                "error": "Failed to read the uploaded image file.",
                "suggestions": []
            }
        
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
        try:
            plant_confidence, has_flower, is_on_screen = detect_plant(image)
            print(f"Plant confidence score: {plant_confidence}, Has flower: {has_flower}, Is on screen: {is_on_screen}")
        except Exception as detection_error:
            print(f"Error in plant detection: {detection_error}")
            traceback.print_exc()
            return {
                "is_plant": False,
                "error": "Error processing the image during plant detection.",
                "suggestions": []
            }
        
        # If confidence is too low, return no plant detected
        if plant_confidence < 0.08:  # Reduced threshold for plant detection
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

        # --- Use Google Gemini Vision API ---
        try:
            print("Attempting plant identification with Gemini Vision API...")
            # Initialize the Gemini Vision model (using gemini-1.5-flash)
            vision_model = genai.GenerativeModel('gemini-1.5-flash')

            # Prepare the image data for the API
            # Ensure we have the content type from the uploaded file
            content_type = file.content_type if file.content_type else "image/jpeg" # Default if not provided
            image_part = {
                "mime_type": content_type,
                "data": image_bytes
            }

            # Create the prompt for Gemini
            prompt = """
            Identify the plant species in the provided image. 
            Respond ONLY with a JSON object containing the following fields:
            - scientific_name: The scientific name (genus and species).
            - common_names: A list of common names (strings).
            - family: The plant family.
            - description: A brief description of the plant.
            - probability: Your confidence score (0.0 to 1.0) for the primary identification.
            - growing_info: Basic care or growing information (optional).
            - alternatives: A list of up to 2 alternative identifications, each with 'scientific_name', 'common_names', and 'probability' fields (optional).

            Example JSON format:
            {
              "scientific_name": "Monstera deliciosa",
              "common_names": ["Swiss Cheese Plant"],
              "family": "Araceae",
              "description": "A tropical plant known for its large, split leaves.",
              "probability": 0.95,
              "growing_info": "Prefers bright, indirect light and well-draining soil.",
              "alternatives": [
                {"scientific_name": "Philodendron bipinnatifidum", "common_names": ["Tree Philodendron"], "probability": 0.7}
              ]
            }
            If you cannot identify a plant, return a JSON object with "scientific_name": "Unknown Plant".
            """

            # Generate content using the vision model
            response = vision_model.generate_content([prompt, image_part])
            
            print(f"Gemini API Response Text: {response.text}")

            # Process the Gemini response
            api_result = process_gemini_response(response.text, bool(has_flower), bool(is_on_screen))
            
            # Add screen message if detected
            if is_on_screen:
                 api_result["screen_message"] = "Plant was detected from a screen image. Identification might be less accurate."

            # Convert numpy bools just in case process_gemini_response didn't
            api_result['has_flower'] = bool(api_result.get('has_flower', False))
            api_result['detected_from_screen'] = bool(api_result.get('detected_from_screen', False))

            return api_result

        except Exception as api_error:
            print(f"Error calling Gemini API: {api_error}")
            traceback.print_exc()
            # Fallback to mock data or error message if API fails
            return {
                "is_plant": True, # Assume it's a plant if detection passed
                "error": "Could not identify the plant using the AI model. Please try again.",
                "suggestions": [],
                "has_flower": bool(has_flower),
                "detected_from_screen": bool(is_on_screen)
            }
        # --- End Gemini API Call ---

    except Exception as e:
        print(f"Unhandled error processing image: {e}")
        traceback.print_exc()
        return {
            "is_plant": False,
            "error": f"Internal server error: {str(e)}",
            "suggestions": []
        }

def process_gemini_response(response_text, has_flower=False, is_on_screen=False):
    """
    Process and format the response from Google Gemini API.
    Converts Gemini output to our app's expected format.
    """
    try:
        # Extract the JSON part from the response
        # First, try to find JSON in the response text (it might contain markdown formatting)
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(1)
        else:
            # If no JSON block, try to extract anything that looks like JSON
            json_match = re.search(r'({.*})', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # If still no match, use the entire response
                json_str = response_text
        
        # Try to parse the JSON
        try:
            plant_data = json.loads(json_str)
        except json.JSONDecodeError:
            # If parsing fails, create a basic structure from the text
            print(f"Failed to parse JSON from Gemini response, creating basic structure")
            plant_data = {
                "scientific_name": "Unknown Plant",
                "common_names": ["Plant"],
                "family": "Unknown",
                "description": response_text[:200] + "...",  # Use part of the response as description
                "probability": 0.7,
                "growing_info": "Information not available",
                "additional_info": "Could not extract structured data from the AI response"
            }
        
        # Create the suggestion in our app's format
        scientific_name = plant_data.get("scientific_name", "Unknown Plant")
        probability = plant_data.get("probability", 0.85)
        
        # Create the plant details structure
        plant_details = {
            "common_names": plant_data.get("common_names", []),
            "wiki_description": {
                "value": plant_data.get("description", "No description available")
            },
            "taxonomy": {
                "family": plant_data.get("family", "Unknown"),
                "genus": scientific_name.split()[0] if len(scientific_name.split()) > 1 else "Unknown",
                "species": scientific_name.split()[1] if len(scientific_name.split()) > 1 else scientific_name
            },
            "url": "",  # No URL available from Gemini
            "images": []  # No additional reference images from Gemini
        }
        
        # Add flower details if relevant, attempting to extract from Gemini response
        if has_flower:
            # Try to get flower details from the main plant_data or a specific flower_details key if Gemini provides it
            gemini_flower_details = plant_data.get("flower_details", {}) 
            
            plant_details["flower_details"] = {
                "color": gemini_flower_details.get("color", plant_data.get("flower_color", "Unknown")), # Check common keys or default
                "blooming_season": gemini_flower_details.get("blooming_season", plant_data.get("blooming_season", "Unknown")), # Check common keys or default
                # Keep care_level extraction as is, or try to get it from flower_details too
                "care_level": gemini_flower_details.get("care_level", plant_data.get("growing_info", "Moderate")) 
            }
        
        # Create the suggestions array
        suggestions = [{
            "id": 12345,  # Use a dummy ID
            "plant_name": scientific_name,
            "probability": probability,
            "plant_details": plant_details
        }]
        
        # Sometimes Gemini might identify multiple plants - try to extract them
        if "alternatives" in plant_data and isinstance(plant_data["alternatives"], list):
            for i, alt in enumerate(plant_data["alternatives"][:2]):  # Get up to 2 alternatives
                alt_name = alt.get("scientific_name", f"Alternative Plant {i+1}")
                alt_prob = alt.get("probability", max(0.1, probability - 0.2))
                
                alt_suggestion = {
                    "id": 12345 + (i+1),
                    "plant_name": alt_name,
                    "probability": alt_prob,
                    "plant_details": {
                        "common_names": alt.get("common_names", []),
                        "wiki_description": {
                            "value": alt.get("description", "No description available")
                        },
                        "taxonomy": {
                            "family": alt.get("family", "Unknown"),
                            "genus": alt_name.split()[0] if len(alt_name.split()) > 1 else "Unknown",
                            "species": alt_name.split()[1] if len(alt_name.split()) > 1 else alt_name
                        },
                        "url": "",
                        "images": []
                    }
                }
                suggestions.append(alt_suggestion)
        
        # Return the formatted response
        return {
            "is_plant": True,
            "has_flower": has_flower,
            "detected_from_screen": is_on_screen,
            "confidence": probability,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"Error processing Gemini response: {e}")
        traceback.print_exc()
        return {
            "is_plant": True,
            "error": "Error processing plant identification results.",
            "suggestions": []
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
