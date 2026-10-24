"""
PennyWise - AI Helper & OpenRouter Integration
Provides AI-powered extraction fallback and smart shopping deal verdicts.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
import httpx


# Load .env strictly from the repository root directory
APP_DIR = os.path.dirname(os.path.abspath(__file__))
PROTOTYPE_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(PROTOTYPE_DIR)
ROOT_ENV_PATH = os.path.join(ROOT_DIR, ".env")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if os.path.exists(ROOT_ENV_PATH):
    try:
        with open(ROOT_ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip("\"'")
                    if val:
                        OPENROUTER_API_KEY = val
                elif line.startswith("OPENROUTER_MODEL="):
                    val = line.split("=", 1)[1].strip().strip("\"'")
                    if val:
                        OPENROUTER_MODEL = val
                elif line.startswith("GEMINI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip("\"'")
                    if val:
                        GEMINI_API_KEY = val
    except Exception:
        pass

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def is_ai_enabled() -> bool:
    """Check if OpenRouter or Gemini API is configured."""
    return bool((OPENROUTER_API_KEY and len(OPENROUTER_API_KEY) > 10) or (GEMINI_API_KEY and len(GEMINI_API_KEY) > 5))


def is_gemini_vision_enabled() -> bool:
    """Check if Gemini Vision service is available via GEMINI_API_KEY or OpenRouter."""
    return bool((GEMINI_API_KEY and len(GEMINI_API_KEY) > 5) or (OPENROUTER_API_KEY and len(OPENROUTER_API_KEY) > 10))


async def identify_product_from_image(image_data: str, mime_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Identifies a commercial product from an uploaded image using Google Gemini Vision API.
    Extracts product name, brand, model/variant, and optimized Pakistani retail search query.
    Falls back to OpenRouter multimodal model if GEMINI_API_KEY is not set.
    """
    if not image_data or not isinstance(image_data, str):
        return {"success": False, "error": "No image data provided."}

    # Extract base64 payload and MIME type
    clean_data = image_data.strip()
    match = re.match(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$", clean_data, re.DOTALL)
    if match:
        detected_mime = match.group(1).lower()
        b64_payload = match.group(2).strip()
    else:
        detected_mime = (mime_type or "image/jpeg").lower()
        b64_payload = clean_data

    # Sanitize MIME type for Google Gemini API
    valid_mimes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/jpg"]
    if detected_mime == "image/jpg":
        detected_mime = "image/jpeg"
    if detected_mime not in valid_mimes:
        detected_mime = "image/jpeg"

    # Max size safeguard (~10MB binary is ~14MB in base64)
    if len(b64_payload) > 14 * 1024 * 1024:
        return {"success": False, "error": "Image file too large. Please upload an image under 10MB."}

    prompt = (
        "You are an expert commercial product identifier for Pakistani e-commerce (PennyWise shopping engine).\n"
        "Carefully examine this product photo (which may be a fashion/apparel item, footwear, kitchen/home appliance, electronics/mobile, beauty/fragrance, or consumer item).\n\n"
        "Identify the commercial item accurately for shopping price comparison in Pakistan:\n"
        "1. name: The specific product title or descriptive name (e.g., 'Cotton Linen Casual Shirt', 'Air Fryer 6L', 'Air Jordan 1 High OG', '1.5 Ton Inverter AC', 'iPhone 15 Pro Max', 'Lawn 3-Piece Stitched Suit', 'Mechanical Gaming Keyboard'). Avoid buzzwords.\n"
        "2. brand: The brand name if clearly visible or identifiable from logos, tags, or styling (e.g., 'Outfitters', 'Dawlance', 'Nike', 'Apple', 'Khaadi', 'Haier', 'Bata', 'Samsung', 'Junaid Jamshed'). If unbranded, generic, or unknown, set to null.\n"
        "3. category: Main retail category ('Fashion', 'Appliances', 'Footwear', 'Tech', 'Beauty', or 'General').\n"
        "4. model_or_variant: Specific model code, color, or variant if identifiable (e.g., 'DWAF-3024', 'Olive Green', '256GB') or null.\n"
        "5. confidence: 'high', 'medium', or 'low'.\n"
        "6. search_query: The best 2 to 5 word search query for a Pakistani shopping engine combining brand and product name (e.g., 'Outfitters Cotton Linen Shirt' or 'Dawlance Air Fryer').\n\n"
        "Output ONLY a raw JSON object with keys: 'name', 'brand', 'category', 'model_or_variant', 'confidence', 'search_query'."
    )

    raw_json_text = None

    # Step 1: Direct Google Gemini Vision API if GEMINI_API_KEY is available
    if GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5:
        gemini_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        for g_model in gemini_models:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={GEMINI_API_KEY.strip()}"
            gemini_payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": detected_mime,
                                    "data": b64_payload
                                }
                            },
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    resp = await client.post(gemini_url, json=gemini_payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                raw_json_text = parts[0].get("text", "").strip()
                                break
                    elif resp.status_code in [404, 400]:
                        continue
                    else:
                        break
            except Exception:
                continue

    # Step 2: OpenRouter multimodal fallback if Gemini was not available or failed
    if not raw_json_text and OPENROUTER_API_KEY and len(OPENROUTER_API_KEY) > 10:
        or_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "PennyWise Shopping Engine",
            "Content-Type": "application/json"
        }
        or_payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{detected_mime};base64,{b64_payload}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 400,
            "temperature": 0.2
        }
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(OPENROUTER_API_URL, headers=or_headers, json=or_payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        raw_json_text = choices[0].get("message", {}).get("content", "").strip()
        except Exception:
            pass

    # If no API key was available or all attempts failed
    if not raw_json_text:
        if not GEMINI_API_KEY and not OPENROUTER_API_KEY:
            return {
                "success": False,
                "error": "No API key configured. Please set GEMINI_API_KEY in your .env file."
            }
        return {
            "success": False,
            "error": "Unable to connect to Gemini Vision service. Please check network connection or verify GEMINI_API_KEY."
        }

    # Step 3: Parse structured response
    try:
        # Strip potential markdown code block wrappers
        clean_text = raw_json_text
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text)
            clean_text = re.sub(r"\s*```$", "", clean_text)

        json_match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
        else:
            parsed = json.loads(clean_text)

        product_name = str(parsed.get("name") or "").strip()
        if not product_name:
            return {
                "success": False,
                "error": "Could not identify a clear commercial product in this photo. Try taking a photo with the product clearly centered."
            }

        brand = parsed.get("brand")
        brand_clean = str(brand).strip() if brand and str(brand).strip().lower() not in ["null", "none", "unknown", "n/a"] else None

        category = str(parsed.get("category") or "General").strip()
        confidence = str(parsed.get("confidence") or "high").lower()
        model_or_variant = parsed.get("model_or_variant")
        model_clean = str(model_or_variant).strip() if model_or_variant and str(model_or_variant).strip().lower() not in ["null", "none", "unknown", "n/a"] else None

        search_query = str(parsed.get("search_query") or "").strip()
        if not search_query:
            if brand_clean and not product_name.lower().startswith(brand_clean.lower()):
                search_query = f"{brand_clean} {product_name}".strip()
            else:
                search_query = product_name

        return {
            "success": True,
            "name": product_name,
            "brand": brand_clean,
            "category": category,
            "model_or_variant": model_clean,
            "confidence": confidence,
            "search_query": search_query
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse product details: {str(e)}"
        }


async def generate_shopping_insights(query: str, products: List[Dict[str, Any]]) -> Optional[str]:
    """
    Generate an expert, comprehensive, and critical shopping analysis and market verdict (4-5 lines)
    across all Pakistani retail domains (fashion & apparel, home appliances, footwear, tech, personal care).
    Evaluates price spread, domain-specific risks, warranty/authenticity, and clear buyer recommendation.
    """
    if not is_ai_enabled() or not products:
        return None

    # Prepare compact summary of top 6 deals
    top_deals = products[:6]
    deals_summary = []
    for i, p in enumerate(top_deals):
        deals_summary.append(
            f"{i+1}. Store: {p['store']} | Title: {p['title']} | Price: Rs. {p['price']:,} | In Stock: {p.get('inStock', True)}"
        )
    deals_text = "\n".join(deals_summary)

    prompt = (
        "You are an expert e-commerce shopping advisor and market analyst specializing in Pakistani online retail across ALL consumer categories—including Fashion & Apparel, Home & Kitchen Appliances, Footwear, Personal Care & Fragrance, and Consumer Electronics.\n\n"
        f"Search Query: \"{query}\"\n"
        f"Live Store Listings Crawled:\n{deals_text}\n\n"
        "Your Task:\n"
        "Provide a comprehensive, highly critical, and expert shopping evaluation (strictly 4 to 5 lines) analyzing this buying decision for a Pakistani consumer:\n\n"
        "1. Price Spread & Value Analysis: Pinpoint the lowest price option, quantify the realistic difference across listed stores, and determine whether the lowest price reflects genuine value, promotional discounting, or a different variant/bundle.\n"
        "2. Domain-Specific Critical Risk Assessment:\n"
        "   - If Fashion/Apparel/Footwear: Assess fabric/material authenticity, seasonal clearance vs fresh collection pricing, return/exchange reliability, and brand-direct webstores vs third-party marketplace sellers.\n"
        "   - If Home Appliances: Assess official brand manufacturer warranty (e.g., compressor/motor warranty cards) vs unauthorized dealer stock, shipping/handling safety, and after-sales service reliability.\n"
        "   - If Consumer Tech/Mobiles: Assess PTA approval compliance (official PTA approved vs non-PTA/JV), official distributor warranty (e.g., Airlink, Mercantile, Core) vs merchant checking warranty, and genuine sealed pack vs kit condition.\n"
        "   - If Other / General Retail: Assess store trustworthiness, authenticity guarantees, and return policies across the indexed merchants.\n"
        "3. Decisive Purchasing Verdict: Deliver a clear, authoritative recommendation on whether the buyer should purchase from the lowest-priced retailer right away or pay slightly more at another recognized merchant for superior warranty, authenticity, or hassle-free customer support.\n\n"
        "Formatting Constraints:\n"
        "- Exactly 4 to 5 cohesive, high-density sentences forming a continuous paragraph.\n"
        "- Do NOT include greetings, intro phrases (e.g. 'Here is your verdict:'), bullet points, headers, or emojis.\n"
        "- Maintain an objective, sharp, critical advisory tone."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "PennyWise Shopping Engine",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 450,
        "temperature": 0.35
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                return content
            else:
                # If credits or model fails, return None cleanly without crashing
                return None
    except Exception:
        return None


async def extract_product_with_ai(clean_text: str, query: str) -> Optional[Tuple[str, int]]:
    """
    AI-powered fallback extractor for store pages where JSON-LD and regex failed.
    Verifies that the extracted price physically appears in the page text.
    """
    if not is_ai_enabled() or not clean_text or len(clean_text) < 50:
        return None

    # Truncate text to 1200 characters to conserve tokens
    snippet = clean_text[:1200]

    prompt = (
        f"You are a price extraction parser for Pakistani e-commerce.\n"
        f"Search query: \"{query}\"\n"
        f"Store text snippet:\n```\n{snippet}\n```\n\n"
        "Task: Extract the main product title and its cash purchase price in Pakistani Rupees (PKR).\n"
        "Rules:\n"
        "1. Price must be an integer (e.g. 15999), excluding currency symbol or commas.\n"
        "2. Do NOT pick monthly installment prices, EMI amounts, or discount percentages.\n"
        "3. If no clear product cash price is found, return {\"title\": null, \"price\": null}.\n"
        "Output ONLY a raw JSON object with keys \"title\" and \"price\"."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "PennyWise Shopping Engine",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 120,
        "temperature": 0.0
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_out = data["choices"][0]["message"]["content"].strip()
                # Parse JSON out of response
                json_match = re.search(r"\{.*?\}", raw_out, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    title = parsed.get("title")
                    price_val = parsed.get("price")
                    if title and price_val:
                        price_int = int(price_val)
                        # Verify the number actually exists in the snippet text
                        num_str = str(price_int)
                        if num_str in snippet.replace(",", "").replace(".", ""):
                            return (title.strip(), price_int)
    except Exception:
        pass

    return None
