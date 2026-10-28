"""
PennyWise - Automated Product Crawler & Price Extraction Engine
Real-Time Scraper for Pakistani Online Stores
Version 0.1 (Prototype)
"""

import asyncio
import re
import json
import time
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

from app.ai_helper import extract_product_with_ai

# Well-known Pakistani E-Commerce & Tech Portals
STORE_NAME_MAP = {
    "priceoye.pk": "PriceOye",
    "daraz.pk": "Daraz",
    "telemart.pk": "Telemart",
    "shophive.com": "Shophive",
    "mega.pk": "Mega.pk",
    "paklap.pk": "Paklap",
    "czone.com.pk": "Computer Zone",
    "whatmobile.com.pk": "WhatMobile",
    "phonebolee.com": "Phonebolee",
    "qeemat.com.pk": "Qeemat.pk",
    "zmobiles.pk": "ZMobiles",
    "redragonpakistan.pk": "Redragon Pakistan",
    "redragonzone.pk": "Redragon Zone",
    "redragon.pk": "Redragon PK",
    "techmobiles.pk": "TechMobiles",
    "hamariweb.com": "HamariWeb",
    "symbios.pk": "Symbios",
    "myshop.pk": "MyShop",
    "ishopping.pk": "iShopping",
    "allmytech.pk": "AllMyTech",
    "laptopsquare.pk": "Laptop Square",
    "tech4u.pk": "Tech4U",
    "mercantile.com.pk": "Mercantile",
    "olx.com.pk": "OLX Pakistan",
    "galaxy.pk": "Galaxy Computer",
    "czone.pk": "Computer Zone",
    "mistore.pk": "Mi Store Pakistan",
    "samsung.com": "Samsung Pakistan",
    "soundpeats.pk": "SoundPEATS PK",
    "audionic.co": "Audionic",
    "dany.com.pk": "Dany Technologies",
    "applepakistan.com.pk": "Apple Pakistan",
    "powerhouseexpress.com.pk": "Powerhouse Express",
    "outfitters.com.pk": "Outfitters",
    "diners.com.pk": "Diners",
    "charcoal.com.pk": "Charcoal",
    "uniworthshop.com": "Uniworth",
    "pk.khaadi.com": "Khaadi",
    "khaadi.com": "Khaadi",
    "junaidjamshed.com": "Junaid Jamshed",
    "pk.sapphireonline.com.pk": "Sapphire",
    "sapphireonline.pk": "Sapphire",
    "gulahmedshop.com": "Gul Ahmed",
    "alkaramstudio.com": "Alkaram Studio",
    "breakout.com.pk": "Breakout",
    "edenrobe.com": "Edenrobe",
    "engine.com.pk": "Engine",
    "focuspk.com": "Focus Clothing",
    "monark.com.pk": "Monark",
    "elo.shopping": "Export Leftovers (ELO)",
    "exportleftovers.com": "Export Leftovers (ELO)",
    "cougar.com.pk": "Cougar",
    "furorjeans.com": "Furor",
    "cambridge.com.pk": "Cambridge"
}

# Domains to skip (social media, search engines, encyclopedia, blogs)
EXCLUDED_DOMAINS = {
    "wikipedia.org", "youtube.com", "facebook.com", "twitter.com", "x.com",
    "pinterest.com", "reddit.com", "instagram.com", "tiktok.com", "linkedin.com",
    "quora.com", "medium.com", "support.apple.com", "support.google.com"
}

# Low-priority / category URL patterns
CATEGORY_PATTERNS = [
    "/category/", "/product-category/", "/collections/", "/tag/",
    "/catalog/", "/search", "/items/q-", "/mobile-phones_c"
]

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

METHOD_WEIGHT = {
    "JSON-LD": 5,
    "OpenGraph": 4,
    "Catalog Extraction": 4,
    "AI Extraction": 3,
    "CSS Selector": 2,
    "Regex Fallback": 1
}


def clean_price_value(raw: Any) -> Optional[int]:
    """
    Cleans raw price input and converts to integer PKR.
    Handles 'Rs. 264,999.00', 'PKR 35,000', '₨ 12000', etc.
    """
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        val = int(raw)
        return val if val > 0 else None

    raw_str = str(raw).strip()
    # Remove currency prefixes, commas, non-numeric parts except decimal
    cleaned = re.sub(r'^(?:Rs\.?|PKR|₨)\s*', '', raw_str, flags=re.IGNORECASE)
    cleaned = cleaned.replace(',', '').strip()

    # Search for numeric digits
    match = re.search(r'([0-9]+(?:\.[0-9]+)?)', cleaned)
    if match:
        try:
            val = float(match.group(1))
            val_int = int(round(val))
            # Basic sanity check: PKR price should be at least 50 Rs for physical products
            if 50 <= val_int <= 50000000:
                return val_int
        except ValueError:
            return None
    return None


def get_store_name(url: str) -> str:
    """Extract human-readable store name from URL."""
    try:
        domain = urlparse(url).netloc.lower().replace("www.", "")
        if domain in STORE_NAME_MAP:
            return STORE_NAME_MAP[domain]
        # Check subdomains
        for key, name in STORE_NAME_MAP.items():
            if domain.endswith("." + key) or domain == key:
                return name
        # Fallback to domain root capitalize
        parts = domain.split(".")
        return parts[0].capitalize() if parts else domain
    except Exception:
        return "Online Store"


def is_likely_category_url(url: str) -> bool:
    """Checks if a URL appears to be a broad category / listing page."""
    u_lower = url.lower()
    return any(p in u_lower for p in CATEGORY_PATTERNS)


def is_valid_product_image(url: Optional[str]) -> bool:
    """
    Validates whether an image URL is a genuine product photo.
    Rejects brand logos, store headers, icons, favicons, payment badges, and placeholders.
    """
    if not url:
        return False
    u = str(url).strip()
    if not u:
        return False

    if u.startswith("//"):
        u = "https:" + u

    u_lower = u.lower()
    if not (u_lower.startswith("http://") or u_lower.startswith("https://")):
        return False

    # Block data URIs or vector SVGs (which are almost exclusively store logos or icons)
    if u_lower.startswith("data:") or ".svg" in u_lower:
        return False

    # Blocked keywords for brand logos, favicons, banners, payment icons, and trust badges
    blocked_patterns = [
        "logo", "favicon", "header", "footer", "banner", "brand",
        "icon", "badge", "avatar", "placeholder", "no-image",
        "default-image", "spinner", "loader", "cart", "trust-badge",
        "payment", "visa", "mastercard", "easypaisa", "jazzcash",
        "otr-logo", "diners-logo", "site-logo", "store-logo",
        "app-store", "google-play", "share", "social", "og_img",
        "og-image", "og_image", "ogimage", "branding", "watermark",
        "stamp", "symbol"
    ]
    for pattern in blocked_patterns:
        if pattern in u_lower:
            return False

    # Acceptable extensions and e-commerce image paths
    valid_indicators = [
        ".jpg", ".jpeg", ".png", ".webp", ".avif",
        "/products/", "/product/", "/catalog/", "/media/",
        "/cdn/shop/files/", "/cdn/shop/products/", "images.priceoye.pk",
        "static-01.daraz.pk", "daraz.pk/p/", "cloudinary"
    ]
    return any(ind in u_lower for ind in valid_indicators)


def extract_product_image_from_soup(soup: BeautifulSoup, page_url: str) -> Optional[str]:
    """
    Scans HTML for an actual product photo if meta tags contain logos or are missing.
    Prioritizes product gallery, featured image containers, and high-resolution sources.
    """
    gallery_selectors = [
        ".product-single__media img",
        ".product__media img",
        ".product-gallery img",
        ".woocommerce-product-gallery img",
        "[itemprop='image']",
        ".product-image img",
        ".pdp-image img",
        ".product-photo img",
        ".featured-image img",
        "img.product-featured-image",
        "img.wp-post-image",
        "img[src*='/products/']",
        "img[src*='/product/']",
        "img[src*='/media/catalog/']"
    ]

    for sel in gallery_selectors:
        imgs = soup.select(sel)
        for img in imgs:
            for attr in ["data-src", "data-original", "data-zoom-src", "src"]:
                raw_src = img.get(attr)
                if raw_src:
                    full_src = urljoin(page_url, raw_src.strip())
                    if is_valid_product_image(full_src):
                        return full_src
            srcset = img.get("srcset") or img.get("data-srcset")
            if srcset:
                parts = [p.strip().split(" ")[0] for p in srcset.split(",") if p.strip()]
                for part in reversed(parts):
                    full_src = urljoin(page_url, part)
                    if is_valid_product_image(full_src):
                        return full_src

    # General fallback: check any img tag that matches product paths and is not a tiny icon
    for img in soup.find_all("img"):
        for attr in ["data-src", "data-original", "src"]:
            raw_src = img.get(attr)
            if raw_src:
                full_src = urljoin(page_url, raw_src.strip())
                if is_valid_product_image(full_src):
                    w = img.get("width")
                    h = img.get("height")
                    if w and str(w).isdigit() and int(w) < 60:
                        continue
                    if h and str(h).isdigit() and int(h) < 60:
                        continue
                    return full_src

    return None


def extract_products_from_listing_page(
    soup: BeautifulSoup,
    page_url: str,
    query_tokens: List[str]
) -> List[Dict[str, Any]]:
    """
    Extracts individual product cards from collection, category, and listing pages.
    Supports Shopify, WooCommerce, Magento, Daraz, and custom Pakistani store layouts.
    """
    store_name = get_store_name(page_url)
    products: List[Dict[str, Any]] = []

    card_selectors = [
        ".product-card",
        ".card-wrapper",
        ".grid__item .product-item",
        ".product-item",
        "li.product",
        ".grid-product",
        ".product-block",
        ".product-item-info",
        ".catalog-item",
        ".pdp-card",
        "article.product",
        "[data-qa-locator='product-item']",
        ".gridItem--Yd0sa",
        ".product-wrap",
        ".item.product",
        ".special-product-item"
    ]

    card_elements = []
    for sel in card_selectors:
        found = soup.select(sel)
        if len(found) >= 2:
            card_elements = found
            break

    if not card_elements:
        possible = soup.select("div[class*='product-card'], div[class*='ProductCard'], div[class*='product-item'], li[class*='product']")
        if len(possible) >= 2:
            card_elements = possible

    if not card_elements:
        return []

    for card in card_elements[:8]:
        try:
            link_el = (
                card.select_one("a.card__heading")
                or card.select_one(".product-title a")
                or card.select_one(".product-name a")
                or card.select_one("h2 a")
                or card.select_one("h3 a")
                or card.select_one("a[href*='/products/']")
                or card.select_one("a[href*='/product/']")
                or card.select_one("a")
            )
            if not link_el:
                continue

            card_title = link_el.get_text(strip=True)
            if not card_title or len(card_title) < 3:
                heading = card.find(["h2", "h3", "h4", "p"])
                if heading:
                    card_title = heading.get_text(strip=True)

            href = link_el.get("href")
            if not href or href == "#":
                continue
            card_url = urljoin(page_url, href)

            card_title = re.sub(
                r'\s*[-|–]\s*(PriceOye|Daraz|Telemart|Shophive|WhatMobile|Mega\.pk|Outfitters|Diners|Charcoal|Uniworth).*$',
                '',
                card_title,
                flags=re.IGNORECASE
            ).strip()

            if not card_title or len(card_title) < 3:
                continue

            card_price = None
            price_el = (
                card.select_one(".price-item--sale")
                or card.select_one(".price-item")
                or card.select_one(".price .money")
                or card.select_one(".price")
                or card.select_one(".woocommerce-Price-amount")
                or card.select_one(".special-price")
                or card.select_one(".product-price")
            )
            if price_el:
                card_price = clean_price_value(price_el.get_text(strip=True))

            if not card_price:
                card_text = card.get_text(" ", strip=True)
                p_match = re.search(r'(?:Rs\.?|PKR|₨)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]{3,7})', card_text, re.IGNORECASE)
                if p_match:
                    card_price = clean_price_value(p_match.group(0))

            if not card_price or card_price < 50:
                continue

            # Product Image (Never store logos)
            card_img = None
            img_el = card.find("img")
            if img_el:
                for attr in ["data-src", "data-original", "src"]:
                    raw_src = img_el.get(attr)
                    if raw_src:
                        cand_url = urljoin(page_url, raw_src.strip())
                        if is_valid_product_image(cand_url):
                            card_img = cand_url
                            break
                if not card_img:
                    srcset = img_el.get("srcset") or img_el.get("data-srcset")
                    if srcset:
                        parts = [p.strip().split(" ")[0] for p in srcset.split(",") if p.strip()]
                        for part in reversed(parts):
                            cand_url = urljoin(page_url, part)
                            if is_valid_product_image(cand_url):
                                card_img = cand_url
                                break

            # Relevance check: query tokens match in title or url
            lower_text = (card_title + " " + card_url).lower()
            matching = [t for t in query_tokens if t in lower_text]
            if query_tokens and not matching:
                continue

            products.append({
                "title": card_title[:140],
                "price": card_price,
                "currency": "PKR",
                "store": store_name,
                "url": card_url,
                "image": card_img,
                "inStock": True,
                "extraction_method": "Catalog Extraction"
            })
        except Exception:
            continue

    return products


def extract_from_json_ld(soup: BeautifulSoup) -> Tuple[Optional[str], Optional[int], Optional[str], bool]:
    """
    Strategy 1: Schema.org Product in JSON-LD.
    Returns (title, price, image, in_stock)
    """
    scripts = soup.find_all("script", type="application/ld+json")
    for script in scripts:
        if not script.string:
            continue
        try:
            raw_data = json.loads(script.string.strip())
            items = []
            if isinstance(raw_data, dict):
                if "@graph" in raw_data and isinstance(raw_data["@graph"], list):
                    items.extend(raw_data["@graph"])
                items.append(raw_data)
            elif isinstance(raw_data, list):
                items.extend(raw_data)

            for item in items:
                if not isinstance(item, dict):
                    continue
                itype = str(item.get("@type", ""))
                if "Product" in itype:
                    title = item.get("name")
                    image = item.get("image")
                    if isinstance(image, list) and image:
                        image = image[0]
                    elif isinstance(image, dict):
                        image = image.get("url")

                    # Offers parsing
                    offers = item.get("offers")
                    if isinstance(offers, list) and offers:
                        offers = offers[0]

                    price = None
                    in_stock = True
                    if isinstance(offers, dict):
                        raw_p = offers.get("price") or offers.get("lowPrice")
                        price = clean_price_value(raw_p)
                        avail = str(offers.get("availability", ""))
                        if "OutOfStock" in avail or "Discontinued" in avail:
                            in_stock = False

                    if title and price:
                        clean_img = None
                        if image:
                            clean_img = str(image).strip()
                            if clean_img.startswith("//"):
                                clean_img = "https:" + clean_img
                            if not is_valid_product_image(clean_img):
                                clean_img = None
                        return str(title).strip(), price, clean_img, in_stock
        except Exception:
            continue

    return None, None, None, True


def extract_from_meta_tags(soup: BeautifulSoup) -> Tuple[Optional[str], Optional[int], Optional[str]]:
    """
    Strategy 2: OpenGraph & Twitter Meta Tags.
    Returns (title, price, image)
    """
    title = None
    price = None
    image = None

    og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "twitter:title"})
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()

    og_price = (
        soup.find("meta", property="product:price:amount")
        or soup.find("meta", property="og:price:amount")
        or soup.find("meta", attrs={"name": "twitter:data1"})
    )
    if og_price and og_price.get("content"):
        price = clean_price_value(og_price["content"])

    og_image = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
    if og_image and og_image.get("content"):
        raw_img = og_image["content"].strip()
        if raw_img.startswith("//"):
            raw_img = "https:" + raw_img
        if is_valid_product_image(raw_img):
            image = raw_img

    return title, price, image


def extract_from_html_selectors(soup: BeautifulSoup) -> Tuple[Optional[str], Optional[int]]:
    """
    Strategy 3: Microdata & Common Pakistani E-Commerce CSS Selectors.
    Returns (title, price)
    """
    title = None
    price = None

    # Title extraction
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        title = h1.get_text(strip=True)

    # Price extraction through structured classes
    price_selectors = [
        "[itemprop='price']",
        ".price ins .woocommerce-Price-amount",
        ".woocommerce-Price-amount bdi",
        ".woocommerce-Price-amount",
        "div.hdng",  # WhatMobile price header
        ".product-price .price",
        ".product-price",
        ".current-price",
        ".p-price",
        ".summary .price",
        ".price-box .special-price",
        ".price-box .regular-price",
        "span.price"
    ]

    for sel in price_selectors:
        elements = soup.select(sel)
        for el in elements:
            if el.get("content"):
                p = clean_price_value(el["content"])
                if p:
                    price = p
                    break
            text_val = el.get_text(strip=True)
            p = clean_price_value(text_val)
            if p:
                price = p
                break
        if price:
            break

    return title, price


def extract_from_regex_fallback(html: str, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[int]]:
    """
    Strategy 4: Regex Search over visible text for PKR / Rs price patterns.
    """
    title = None
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    # Look for patterns like Rs. 12,999 or PKR 12999 or ₨ 12,999
    matches = re.findall(
        r'(?:Rs\.?|PKR|₨)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]{4,7})',
        html,
        re.IGNORECASE
    )
    for m in matches:
        p = clean_price_value(m)
        if p and p >= 100:
            return title, p

    return title, None


def parse_page_data(html: str, url: str, query_tokens: List[str]) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Runs multi-strategy extraction waterfall and validates output according to Section 7.
    """
    store_name = get_store_name(url)
    log_info = {
        "url": url,
        "store": store_name,
        "method": None,
        "status": "extracted",
        "title": None,
        "price": None,
        "reason": None
    }

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as e:
        log_info["status"] = "error"
        log_info["reason"] = f"HTML parsing failed: {e}"
        return None, log_info

    title = None
    price = None
    image = None
    in_stock = True
    method = None

    # 1. JSON-LD Strategy
    t, p, img, stock = extract_from_json_ld(soup)
    if p:
        title = t or title
        price = p
        image = img or image
        in_stock = stock
        method = "JSON-LD"

    # 2. Meta Tags Strategy
    if not price:
        t, p, img = extract_from_meta_tags(soup)
        if p:
            title = t or title
            price = p
            image = img or image
            method = "OpenGraph"

    # 3. CSS / Microdata Selectors Strategy
    if not price:
        t, p = extract_from_html_selectors(soup)
        if p:
            title = t or title
            price = p
            method = "CSS Selector"

    # 4. Regex Fallback Strategy
    if not price:
        t, p = extract_from_regex_fallback(html, soup)
        if p:
            title = t or title
            price = p
            method = "Regex Fallback"

    # Fallback title & image if missing
    if not title:
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        else:
            h1 = soup.find("h1")
            if h1:
                title = h1.get_text(strip=True)

    # First, look for dedicated product gallery/featured images in page DOM
    if not image:
        image = extract_product_image_from_soup(soup, url)

    # Fall back to og:image / twitter:image if no dedicated gallery image was identified
    if not image:
        og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
        if og_img and og_img.get("content"):
            cand_img = og_img["content"].strip()
            if cand_img.startswith("//"):
                cand_img = "https:" + cand_img
            if is_valid_product_image(cand_img):
                image = cand_img

    # Clean image: ensure absolute URL and non-logo validity
    if image:
        if image.startswith("//"):
            image = "https:" + image
        elif image.startswith("/"):
            image = urljoin(url, image)
        if not is_valid_product_image(image):
            image = None

    # Clean title: strip store suffixes
    if title:
        title = re.sub(
            r'\s*[-|–]\s*(PriceOye|Daraz|Telemart|Shophive|WhatMobile|Mega\.pk|Laptop Square|Paklap|OLX|TechMobiles|Outfitters|Diners|Charcoal|Uniworth).*$',
            '',
            title,
            flags=re.IGNORECASE
        ).strip()

    # Section 7 Validation: Mandatory fields
    if not title or not price or price <= 0:
        log_info["status"] = "skipped"
        log_info["reason"] = f"Missing mandatory field (title={bool(title)}, price={price})"
        return None, log_info

    # Keyword relevance check: ensure items are genuinely related to search query
    lower_context = (title + " " + url).lower()
    matching_tokens = [tok for tok in query_tokens if tok in lower_context]
    relevance_threshold = max(1, len(query_tokens) // 2)
    if len(matching_tokens) < relevance_threshold:
        log_info["status"] = "skipped"
        log_info["reason"] = f"Irrelevant item (matched {len(matching_tokens)}/{len(query_tokens)} tokens: {matching_tokens})"
        return None, log_info

    log_info["method"] = method
    log_info["title"] = title
    log_info["price"] = price

    product = {
        "title": title[:140],
        "price": price,
        "currency": "PKR",
        "store": store_name,
        "url": url,
        "image": image,
        "inStock": in_stock,
        "extraction_method": method
    }
    return product, log_info


async def fetch_and_extract_url(
    client: httpx.AsyncClient,
    url: str,
    query_tokens: List[str],
    semaphore: asyncio.Semaphore
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fetches a candidate URL and parses product details.
    Returns list of products (single or multiple if collection listing) and diagnostic log.
    """
    store_name = get_store_name(url)
    log_entry = {
        "url": url,
        "store": store_name,
        "http_status": None,
        "method": None,
        "extracted": False,
        "duration_ms": 0,
        "error": None
    }

    start_time = time.time()
    async with semaphore:
        try:
            resp = await client.get(url, timeout=7.0, follow_redirects=True)
            log_entry["http_status"] = resp.status_code
            log_entry["duration_ms"] = int((time.time() - start_time) * 1000)

            if resp.status_code != 200:
                log_entry["error"] = f"HTTP {resp.status_code}"
                return [], log_entry

            soup = BeautifulSoup(resp.text, "html.parser")

            # Check if this is a listing / collection page with multiple product cards
            listing_products = []
            if is_likely_category_url(str(resp.url)) or "/collections/" in str(resp.url) or "/category/" in str(resp.url):
                listing_products = extract_products_from_listing_page(soup, str(resp.url), query_tokens)

            if listing_products:
                log_entry["extracted"] = True
                log_entry["method"] = "Catalog Extraction"
                log_entry["title"] = f"{len(listing_products)} products extracted from listing"
                log_entry["price"] = listing_products[0]["price"]
                return listing_products, log_entry

            # Otherwise, single product extraction
            product, info = parse_page_data(resp.text, str(resp.url), query_tokens)

            # Strategy 5: AI Fallback Extraction if standard methods fail
            if not product:
                try:
                    clean_txt = soup.get_text(" ", strip=True)
                    ai_res = await extract_product_with_ai(clean_txt, " ".join(query_tokens))
                    if ai_res:
                        ai_title, ai_price = ai_res
                        store_name = get_store_name(str(resp.url))
                        img_url = extract_product_image_from_soup(soup, str(resp.url))
                        product = {
                            "title": ai_title,
                            "price": ai_price,
                            "currency": "PKR",
                            "store": store_name,
                            "url": str(resp.url),
                            "image": img_url,
                            "inStock": True,
                            "extraction_method": "AI Extraction"
                        }
                        info["method"] = "AI Extraction"
                except Exception:
                    pass

            # Fallback listing check if single extraction produced no item
            if not product:
                listing_products = extract_products_from_listing_page(soup, str(resp.url), query_tokens)
                if listing_products:
                    log_entry["extracted"] = True
                    log_entry["method"] = "Catalog Extraction"
                    log_entry["title"] = f"{len(listing_products)} products extracted from listing"
                    log_entry["price"] = listing_products[0]["price"]
                    return listing_products, log_entry

            if product:
                log_entry["extracted"] = True
                log_entry["method"] = info.get("method")
                log_entry["title"] = product["title"]
                log_entry["price"] = product["price"]
                return [product], log_entry
            else:
                log_entry["error"] = info.get("reason", "Extraction returned empty")
                return [], log_entry

        except httpx.TimeoutException:
            log_entry["duration_ms"] = int((time.time() - start_time) * 1000)
            log_entry["error"] = "Connection timed out (7s)"
            return [], log_entry
        except Exception as e:
            log_entry["duration_ms"] = int((time.time() - start_time) * 1000)
            log_entry["error"] = str(e)
            return [], log_entry


def search_candidate_urls(query: str, max_results: int = 30) -> List[Dict[str, str]]:
    """
    Queries DuckDuckGo Search for Pakistani stores matching the query.
    Searches multiple commercial query angles to discover more verified stores.
    """
    clean_query = query.strip()
    search_queries = [
        f"{clean_query} price in pakistan",
        f"{clean_query} online shopping pakistan"
    ]
    candidates = []

    try:
        ddgs = DDGS()
        raw_results = []
        for sq in search_queries:
            try:
                res = list(ddgs.text(sq, max_results=max_results // 2 + 5))
                raw_results.extend(res)
            except Exception:
                pass

        seen_urls = set()
        for r in raw_results:
            url = r.get("href") or r.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            try:
                domain = urlparse(url).netloc.lower().replace("www.", "")
                if any(excluded in domain for excluded in EXCLUDED_DOMAINS):
                    continue

                candidates.append({
                    "title": r.get("title", ""),
                    "url": url,
                    "domain": domain,
                    "is_category": is_likely_category_url(url)
                })
            except Exception:
                continue

        # Sort candidates: product URLs first, category URLs second
        candidates.sort(key=lambda x: 1 if x["is_category"] else 0)

    except Exception as e:
        print(f"DDGS Search Error: {e}")

    return candidates


async def crawl_and_extract_products(query: str, max_candidates: int = 30) -> Dict[str, Any]:
    """
    Full crawler pipeline:
    1. Query DuckDuckGo for candidate store URLs across Pakistan
    2. Concurrently fetch and extract product prices in parallel
    3. Filter, validate, deduplicate by store with multi-item support (up to 4 per store), and sort lowest-price-first
    4. Return structured products along with diagnostic crawler logs
    """
    start_total = time.time()
    clean_query = query.strip()
    query_tokens = [t.lower() for t in re.findall(r'\w+', clean_query) if len(t) > 1]

    # Step 1: Discovered candidate URLs
    candidates = search_candidate_urls(clean_query, max_results=max_candidates)
    urls = [c["url"] for c in candidates]

    # Step 2: Parallel Crawling
    semaphore = asyncio.Semaphore(8)  # 8 concurrent requests
    products: List[Dict[str, Any]] = []
    crawl_logs: List[Dict[str, Any]] = []
    store_counts: Dict[str, int] = {}
    seen_urls = set()

    if urls:
        async with httpx.AsyncClient(headers=HTTP_HEADERS, follow_redirects=True) as client:
            tasks = [
                fetch_and_extract_url(client, url, query_tokens, semaphore)
                for url in urls
            ]
            results_and_logs = await asyncio.gather(*tasks, return_exceptions=False)

            for products_found, log_item in results_and_logs:
                crawl_logs.append(log_item)
                for product in products_found:
                    store = product["store"]
                    p_url = product["url"].lower().rstrip("/")
                    if p_url in seen_urls:
                        continue

                    current_store_count = store_counts.get(store, 0)
                    if current_store_count < 4:
                        seen_urls.add(p_url)
                        store_counts[store] = current_store_count + 1
                        products.append(product)

    # Step 3: Sort ascending by price (Section 6.2 Lowest First)
    products.sort(key=lambda x: x["price"])

    duration_ms = int((time.time() - start_total) * 1000)

    return {
        "query": clean_query,
        "count": len(products),
        "results": products,
        "crawler_metrics": {
            "total_urls_discovered": len(urls),
            "pages_crawled": len(crawl_logs),
            "successful_extractions": len(products),
            "total_duration_ms": duration_ms,
            "logs": crawl_logs
        }
    }
