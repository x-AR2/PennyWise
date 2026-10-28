"""
PennyWise: Prototype Web Server & Crawler API
Version 0.1 (Prototype)
"""

import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.cache import search_cache
from app.crawler import crawl_and_extract_products
from app.db import (
    record_search_prices,
    get_price_history_data,
    create_price_alert,
    get_active_alerts
)
from app.ai_helper import (
    generate_shopping_insights,
    is_ai_enabled,
    is_gemini_vision_enabled,
    identify_product_from_image,
    OPENROUTER_MODEL,
    GEMINI_API_KEY
)

# App Initialization
app = FastAPI(
    title="PennyWise Prototype API",
    description="Backend Crawler & Price Comparison Engine for Pakistani Online Stores",
    version="0.1"
)

# Current Directory Base Path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mount static asset directories
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")


# Models (Section 6.5 + Diagnostic Crawler Metrics)
class ProductResult(BaseModel):
    title: str
    price: int
    currency: str = "PKR"
    store: str
    url: str
    image: Optional[str] = None
    inStock: bool = True
    extraction_method: Optional[str] = "JSON-LD"


class CrawlerLogItem(BaseModel):
    url: str
    store: str
    http_status: Optional[int] = None
    method: Optional[str] = None
    extracted: bool = False
    duration_ms: int = 0
    title: Optional[str] = None
    price: Optional[int] = None
    error: Optional[str] = None


class CrawlerMetrics(BaseModel):
    total_urls_discovered: int
    pages_crawled: int
    successful_extractions: int
    total_duration_ms: int
    logs: List[CrawlerLogItem]


class SearchResponse(BaseModel):
    query: str
    count: int
    cached: bool = False
    results: List[ProductResult]
    crawler_metrics: Optional[CrawlerMetrics] = None
    ai_insights: Optional[str] = None


class VisionIdentifyRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string or Data URL")
    mime_type: Optional[str] = Field("image/jpeg", description="MIME type of the image")


class VisionIdentifyResponse(BaseModel):
    success: bool
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    model_or_variant: Optional[str] = None
    confidence: Optional[str] = None
    search_query: Optional[str] = None
    error: Optional[str] = None


class AlertCreateRequest(BaseModel):
    query: str
    target_price: int
    email: str
    phone: Optional[str] = None
    title: Optional[str] = None


# Page Routes (Section 8)
@app.get("/", response_class=FileResponse)
async def serve_home():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/index.html", response_class=FileResponse)
async def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/results.html", response_class=FileResponse)
async def serve_results():
    return FileResponse(os.path.join(BASE_DIR, "results.html"))

@app.get("/product.html", response_class=FileResponse)
@app.get("/product", response_class=FileResponse)
async def serve_product():
    return FileResponse(os.path.join(BASE_DIR, "product.html"))

@app.get("/compare.html", response_class=FileResponse)
@app.get("/compare", response_class=FileResponse)
async def serve_compare():
    return FileResponse(os.path.join(BASE_DIR, "compare.html"))

@app.get("/wishlist.html", response_class=FileResponse)
@app.get("/wishlist", response_class=FileResponse)
async def serve_wishlist():
    return FileResponse(os.path.join(BASE_DIR, "wishlist.html"))

@app.get("/price-history.html", response_class=FileResponse)
@app.get("/price-history", response_class=FileResponse)
async def serve_price_history():
    return FileResponse(os.path.join(BASE_DIR, "price-history.html"))

@app.get("/stores-categories.html", response_class=FileResponse)
@app.get("/stores-categories", response_class=FileResponse)
async def serve_stores_categories():
    return FileResponse(os.path.join(BASE_DIR, "stores-categories.html"))

@app.get("/about.html", response_class=FileResponse)
async def serve_about():
    return FileResponse(os.path.join(BASE_DIR, "about.html"))

@app.get("/404.html", response_class=FileResponse)
async def serve_404():
    return FileResponse(os.path.join(BASE_DIR, "404.html"))

@app.get("/favicon.ico", include_in_schema=False)
async def serve_favicon():
    return FileResponse(os.path.join(BASE_DIR, "favicon.ico"), media_type="image/x-icon")

@app.get("/favicon.svg", include_in_schema=False)
async def serve_favicon_svg():
    return FileResponse(os.path.join(BASE_DIR, "favicon.svg"), media_type="image/svg+xml")

@app.get("/coin.lottie", include_in_schema=False)
async def serve_coin_lottie():
    return FileResponse(os.path.join(BASE_DIR, "coin.lottie"), media_type="application/zip")


# Backend Search & Crawler API (Section 6.2 & 6.5)
@app.get("/api/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., min_length=2, description="Product search query"),
    refresh: bool = Query(False, description="Bypass cache and force fresh live crawl")
):
    query_clean = q.strip()
    if len(query_clean) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    # Step 1: Check In-Memory TTL Cache
    if not refresh:
        cached_data = search_cache.get(query_clean)
        if cached_data is not None:
            cached_data["cached"] = True
            return cached_data

    # Step 2: Execute Live Real-Time Multi-Strategy Crawler
    try:
        crawl_payload = await crawl_and_extract_products(query_clean, max_candidates=30)
        crawl_payload["cached"] = False

        # Step 3: AI Shopping Insights (OpenRouter)
        if crawl_payload["count"] > 0:
            ai_verdict = await generate_shopping_insights(query_clean, crawl_payload["results"])
            crawl_payload["ai_insights"] = ai_verdict

        # Step 4: Cache if successful extractions occurred
        if crawl_payload["count"] > 0:
            search_cache.set(query_clean, crawl_payload, ttl=300)

        return crawl_payload
    except Exception as e:
        # Strict Data Accuracy: On failure, return error information and empty results list, never placeholder data.
        return JSONResponse(
            status_code=500,
            content={
                "query": query_clean,
                "count": 0,
                "cached": False,
                "results": [],
                "crawler_metrics": {
                    "total_urls_discovered": 0,
                    "pages_crawled": 0,
                    "successful_extractions": 0,
                    "total_duration_ms": 0,
                    "logs": [{"url": "", "store": "", "extracted": False, "error": str(e)}]
                }
            }
        )


@app.get("/api/cache/clear")
async def clear_cache():
    search_cache.clear()
    return {"status": "success", "message": "Crawler cache cleared successfully"}


@app.post("/api/vision/identify", response_model=VisionIdentifyResponse)
async def vision_identify_endpoint(payload: VisionIdentifyRequest):
    """
    Multimodal visual product identification using Google Gemini Vision API.
    Accepts base64 or Data URL image and returns extracted product name, brand, and search query.
    """
    result = await identify_product_from_image(payload.image, payload.mime_type)
    return result


@app.get("/api/ai/status")
async def ai_status():
    has_gemini = bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5)
    return {
        "ai_enabled": is_ai_enabled(),
        "gemini_vision_enabled": is_gemini_vision_enabled(),
        "has_gemini_key": has_gemini,
        "vision_provider": "Google Gemini" if has_gemini else "OpenRouter",
        "provider": "Google Gemini" if has_gemini else "OpenRouter",
        "model": "gemini-2.5-flash" if has_gemini else OPENROUTER_MODEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
