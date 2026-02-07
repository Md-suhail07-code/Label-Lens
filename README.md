# 🔍 Label-Lens: Eat The Truth

> **"A Personal Toxicologist in Your Pocket."**
> *Hackathon Finalist In Buildathon 2K26 NECN*

## 🚨 The Problem
Food labels are designed to confuse you.
* **"Natural Flavoring"** often hides 50+ chemicals.
* **"Sugar Free"** usually means carcinogenic artificial sweeteners.
* **Generic Advice Fails:** High protein is good for an athlete, but **deadly** for a kidney patient.

Consumers don't have time to Google every ingredient. They need a simple **Red/Green** verdict instantly.

## 💡 The Solution: Label-Lens
Label-Lens is a **Neuro-Symbolic AI Health Engine**. It combines the visual reasoning of LLMs with deterministic medical rules to provide **hyper-personalized** food safety ratings in 3 seconds.

### 🌟 Key Features
* **📸 Hybrid Scanning:** Instantly scans barcodes (via OpenFoodFacts) OR reads ingredient lists directly from packaging using OCR.
* **🧬 Context-Aware Safety:** A "Protein Bar" scans **GREEN** for a Gym Goer but **RED** for a user with Kidney Disease.
* **⚖️ Regulatory Grounding:** Automatically flags ingredients banned in the EU/USA but legal in India (e.g., Potassium Bromate).
* **🔄 Healthy Swaps:** Doesn't just say "Stop"; suggests a safer, cleaner alternative available on Indian quick-commerce apps (Blinkit/Zepto).
* **🧹 AI Text Cleaning:** Corrects OCR errors (e.g., reads `Sgr` as `Sugar`) for accurate analysis.

---

## 🏗️ Technology Stack

| Component | Tech Used | Role |
| :--- | :--- | :--- |
| **Frontend** | React.js + Tailwind CSS | Pixel-perfect, "Arc-style" glassmorphism UI. |
| **Backend** | Node.js + Express | API orchestration and business logic. |
| **Database** | MongoDB | Storing user health profiles (Diabetes, Allergies) and scan history. |
| **AI Engine** | **Gemini 1.5 Flash** | Context extraction, OCR correction, and reasoning. |
| **Data Source** | OpenFoodFacts API | Base product metadata and barcode lookup. |
| **Computer Vision** | Bing/Google Images | Visual fallback for product thumbnails. |

---

## 🧠 The "Secret Sauce": Why Not Just Use Gemini?
*Judges often ask: "Why can't I just ask ChatGPT/Gemini if this food is safe?"*

**Answer: Because Chatbots Hallucinate. We Don't.**
We use a **Neuro-Symbolic Architecture**:

1.  **The "Neuro" Layer (Gemini):** Used *only* for Perception (Reading the text, fixing spelling, normalizing ingredient names).
2.  **The "Symbolic" Layer (Our Code):** The safety verdict is **Deterministic**.
    * *Logic:* `IF (Ingredient == "Sodium Benzoate") AND (User == "Hypertensive") THEN Risk = HIGH`.
    * This prevents the AI from hallucinating that a toxin is "safe in moderation."
3.  **Context Injection:** A user cannot type their entire medical history into a chat prompt every time they buy a snack. We inject their MongoDB profile silently into every scan.

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Instance
* Gemini API Key

### 1. Clone the Repo
```bash
git clone [https://github.com/YourUsername/Label-Lens.git](https://github.com/YourUsername/Label-Lens.git)
cd Label-Lens
```
### 2. Backend Setup
```
cd backend
npm install

# Create a .env file
echo "PORT=5000" >> .env
echo "MONGO_URL=your_mongodb_connection_string" >> .env
echo "GEMINI_API_KEY=your_google_ai_studio_key" >> .env

# Start Server
npm start
```
### 3. Frontend Setup
```
cd frontend
npm install
npm run dev
```
