# PennyWise ₨.pk

> **Pakistan's Dedicated Smart Price Comparison & Real-Time E-Commerce Engine**

PennyWise addresses fragmentation in Pakistani e-commerce by indexing live prices directly from certified store checkout pages. We eliminate synthetic estimates, rank verified lowest prices first, and connect users straight to the authentic merchant.

Developed with passion by **three university students** in Pakistan.

---

## 🌟 What's the Need?

Online shopping in Pakistan has grown exponentially, but with that growth came chaos. Anyone who has ever tried buying a new smartphone, laptop, air conditioner, or gaming console knows the exact headache:

- **Tab Overload**: Opening dozens of browser tabs—Daraz Mall, PriceOye, Telemart, Shophive, Paklap, and Mega.pk—mindlessly hopping back and forth.
- **Hidden Price Gaps**: Identical products often differ by Rs. 5,000 to Rs. 40,000 between stores.
- **Deceptive Discounts**: Misleading slashed sales, differing warranty policies, and unpredictable shipping fees.

**PennyWise replaces this manual scavenger hunt with an instant, unified search:**
- **Zero Mindless Searching**: Compare live prices across top Pakistani merchants in a single query.
- **Ascending Deal Ranking**: The verified lowest price always receives the **#1 Lowest** badge.
- **Transparent Outlinks**: Direct links to certified retailer product listings with zero sponsored ranking bias.

---

## 🚀 Key Features

- **Live Search (`pages/results.html`)**: Instant multi-merchant price comparison with distinct product imagery for individual listings.
- **Trending Deals (`pages/deals.html`)**: Real-time verified price drops across Smartphones, Laptops, Audio, and Appliances with pure CSS category filtering.
- **Product Details (`pages/product.html`)**: Deep dive into merchant specifications, warranty tiers, and historical trends.
- **Side-by-Side Compare (`pages/compare.html`)**: Evaluate up to 3 products side-by-side on price, delivery time, return policy, and store reputation.
- **Transit & Travel Fare Comparison (`pages/tickets.html`)**: Compare Daewoo Express, Faisal Movers, domestic flights (PIA, AirSial), and Pakistan Railways Green Line schedules.
- **Wishlist & Search History (`pages/wishlist.html`, `pages/history.html`)**: Fast local tracking without compulsory registration.
- **Dark Luxury Design System**: Custom burgundy/gold aesthetic, Inter typography, responsive layouts, and Bootstrap pill rounded buttons.

---

## 🛠️ Tech Stack

- **Frontend**:
  - HTML5 (Semantic, accessible markup)
  - [Tailwind CSS](https://tailwindcss.com/) (Utility-first styling)
  - [Bootstrap 5](https://getbootstrap.com/) (`bootstrap@5.3.3` with pill rounded buttons & responsive system)
  - [Bootstrap Icons](https://icons.getbootstrap.com/) (`bootstrap-icons@1.11.3`)
  - Custom Dark Luxury CSS (`css/style.css`)
  - [dotLottie](https://lottiefiles.com/) interactive 3D coin animation
- **Prototype Engine**:
  - Python 3.10+
  - FastAPI / Uvicorn
  - SQLite database

---

## 👥 Developers & Contributors

PennyWise was developed by three university students in Pakistan who wanted to bring price transparency to everyday consumers.

- **x-AR2** — [GitHub Profile](https://github.com/x-AR2)
- **0xGhost63** — [GitHub Profile](https://github.com/0xGhost63/)

---

## 📁 Repository Structure

```text
PennyWise/
├── index.html                  # Landing page & featured showcase
├── README.md                   # Project documentation & setup guide
├── assets/
│   ├── animations/
│   │   └── coin.lottie         # 3D spinning coin animation
│   ├── icons/
│   │   ├── favicon.ico
│   │   └── favicon.svg
│   └── images/
│       ├── pakistan.svg        # National flag badge
│       ├── sony-headphones.jpg
│       ├── iphone-15.jpg
│       ├── ps5-console.jpg
│       ├── macbook-air.jpg
│       ├── airpods-pro.jpg
│       ├── lenovo-legion.jpg
│       ├── dawlance-ac.jpg
│       ├── redmi-note.jpg
│       ├── samsung-s26.jpg
│       ├── philips-airfry.jpg
│       └── headphones/         # Dedicated product variations
│           ├── headphone_1.jpg
│           ├── headphone_2.jpg
│           ├── headphone_3.jpg
│           ├── headphone_4.jpg
│           ├── headphone_5.jpg
│           └── headphone_6.jpg
├── css/
│   └── style.css               # PennyWise dark luxury design system
├── js/
│   ├── main.js                 # Global utilities & navigation counts
│   └── results.js              # Live crawler engine controller
├── pages/
│   ├── 404.html                # Error page
│   ├── about.html              # Story, "What's the Need" & student creators note
│   ├── compare.html            # Side-by-side product comparison
│   ├── deals.html              # Verified trending price drops
│   ├── history.html            # Search query history
│   ├── login.html              # Customer authentication
│   ├── price-history.html      # 30-day price trend analysis
│   ├── product.html            # Product inspection page
│   ├── results.html            # Live Search results across Pakistani stores
│   ├── tickets.html            # Transit & travel fare comparison
│   └── wishlist.html           # Bookmarked items
└── Prototype/                  # Backend crawler prototype
    ├── app/
    ├── requirements.txt
    ├── main.py
    ├── run.sh
    └── run.bat
```

---

## 💻 Quick Start & Running Locally

### Option 1: Static Frontend (No Setup Needed)
Simply open `index.html` in any modern web browser or serve it with any lightweight HTTP server:

```bash
# Using Python built-in server
python3 -m http.server 3000
```
Then navigate to `http://localhost:3000`.

---

### Option 2: Full Prototype (Linux)

#### Prerequisites
- Python 3.10+
- `pip`
- `git`

#### Instructions
1. **Clone the repository:**
   ```bash
   git clone git@github.com:x-AR2/PennyWise.git
   cd PennyWise/Prototype
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *(Alternatively, run `./run.sh`)*

5. **Open in your browser:**
   Navigate to [http://localhost:8000](http://localhost:8000)

---

### Option 3: Full Prototype (Windows)

#### Prerequisites
- Python 3.10+
- `pip`
- `git`

#### Instructions
1. **Clone the repository:**
   ```cmd
   git clone git@github.com:x-AR2/PennyWise.git
   cd PennyWise\Prototype
   ```

2. **Create and activate a virtual environment:**
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
   *(If using PowerShell, run: `.\venv\Scripts\Activate.ps1`)*

3. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```cmd
   python -m uvicorn main:app --reload --port 8000
   ```
   *(Alternatively, run `run.bat`)*

5. **Open in your browser:**
   Navigate to [http://localhost:8000](http://localhost:8000)

---

## 📜 License & Disclaimers

All merchant trademarks, logos, and brand assets (including PriceOye, Telemart, Shophive, Daraz Mall, Mega.pk, Paklap, PIA, Daewoo Express, and Faisal Movers) belong strictly to their respective owners. Price data is aggregated for fair comparison and consumer convenience.
