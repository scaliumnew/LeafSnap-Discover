from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
import requests
import json
import os
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
    Detect if the image contains a phone screen showing a plant.
    Returns True if a screen is detected.
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Look for rectangular shapes (potential screens)
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            # Get the perimeter of the contour
            perimeter = cv2.arcLength(contour, True)
            # Approximate the polygonal curves
            approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
            
            # If we have a quadrilateral (4 points) and it's large enough
            if len(approx) == 4:
                area = cv2.contourArea(contour)
                image_area = image.shape[0] * image.shape[1]
                # Check if the area is reasonable for a phone screen (between 10% and 90% of image)
                if 0.1 * image_area < area < 0.9 * image_area:
                    return True, approx
        
        return False, None
    except Exception as e:
        print(f"Error in screen detection: {e}")
        return False, None

def process_screen_region(image, screen_corners):
    """
    Process the region inside detected screen corners to handle glare and reflections.
    """
    try:
        # Create a mask for the screen region
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        cv2.drawContours(mask, [screen_corners], -1, (255), -1)
        
        # Apply the mask to the image
        screen_region = cv2.bitwise_and(image, image, mask=mask)
        
        # Enhance contrast to handle screen glare
        lab = cv2.cvtColor(screen_region, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge((l,a,b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    except Exception as e:
        print(f"Error processing screen region: {e}")
        return image

def detect_plant(image):
    """
    Plant and flower detection using color analysis and edge detection.
    Now includes detection of plants shown on phone screens.
    Returns a tuple of (confidence score between 0 and 1, has_flower boolean, is_on_screen boolean).
    """
    try:
        # First check if we're looking at a phone screen
        is_screen, screen_corners = detect_screen(image)
        
        # If we detected a screen, process that region specially
        if is_screen and screen_corners is not None:
            image = process_screen_region(image, screen_corners)
        
        # Convert to HSV color space
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define color ranges for plants and flowers
        lower_green = np.array([25, 40, 40])
        upper_green = np.array([85, 255, 255])
        
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
        
        # Create combined mask for flowers
        flower_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower, upper in flower_colors:
            flower_mask = cv2.bitwise_or(flower_mask, cv2.inRange(hsv, lower, upper))
        
        # Calculate ratios
        plant_ratio = np.sum(plant_mask > 0) / (plant_mask.shape[0] * plant_mask.shape[1])
        flower_ratio = np.sum(flower_mask > 0) / (flower_mask.shape[0] * flower_mask.shape[1])
        
        # Edge detection for texture analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        edge_ratio = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        # Combine metrics
        # Adjust confidence calculation if we're looking at a screen
        if is_screen:
            # Lower the threshold for screen images due to potential quality loss
            plant_confidence = (plant_ratio * 0.6 + edge_ratio * 0.4) * 0.9
        else:
            plant_confidence = (plant_ratio * 0.7 + edge_ratio * 0.3)
        
        has_flower = flower_ratio > 0.05  # Threshold for flower detection
        
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
    
    if has_flower:
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
            },
            {
                "id": 67890,
                "plant_name": "Orchidaceae Phalaenopsis",
                "probability": confidence_score * 0.8,
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
        # Return original mock data for non-flowering plants
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
            },
            {
                "id": 67890,
                "plant_name": "Philodendron bipinnatifidum",
                "probability": confidence_score * 0.8,
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
    
    return base_data

@app.post("/predict")
async def predict_plant(file: UploadFile = File(...)):
    try:
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
        
        # Detect if the image contains a plant
        plant_confidence, has_flower, is_on_screen = detect_plant(image)
        print(f"Plant confidence score: {plant_confidence}, Is on screen: {is_on_screen}")
        
        # If confidence is too low, return no plant detected
        if plant_confidence < 0.15:  # Threshold for plant detection
            return {
                "is_plant": False,
                "error": "No plant detected in the image. Please take a photo of a plant.",
                "suggestions": []
            }
        
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
            return get_mock_plant_data(plant_confidence, has_flower, is_on_screen)
        
    except Exception as e:
        print(f"Error processing image: {e}")
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
