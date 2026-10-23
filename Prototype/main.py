"""
PennyWise: Prototype Web Server & Crawler API
Course: Web Technologies - Version 0.1 (Prototype)
"""

import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.cache import search_cache
from app.crawler import crawl_and_extract_products

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

@app.get("/favicon-32.png", include_in_schema=False)
async def serve_favicon_32():
    return FileResponse(os.path.join(BASE_DIR, "favicon-32.png"), media_type="image/png")

@app.get("/favicon-192.png", include_in_schema=False)
async def serve_favicon_192():
    return FileResponse(os.path.join(BASE_DIR, "favicon-192.png"), media_type="image/png")


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
        crawl_payload = await crawl_and_extract_products(query_clean, max_candidates=12)
        crawl_payload["cached"] = False

        # Step 3: Cache if successful extractions occurred
        if crawl_payload["count"] > 0:
            search_cache.set(query_clean, crawl_payload, ttl=300)

        return crawl_payload
    except Exception as e:
        # In accordance with Section 6.5 & Section 7 (Zero-Hallucination):
        # On failure, return error information and empty results list, never placeholder data.
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
