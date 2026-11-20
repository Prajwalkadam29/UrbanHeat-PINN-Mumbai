# UrbanHeat-PINN: Physics-Informed Neural Network & Equity-Aware Cooling Decision Support System for Mumbai

[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black.svg?style=flat&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Earth Engine](https://img.shields.io/badge/Google_Earth_Engine-API-4285F4.svg?style=flat&logo=google-cloud&logoColor=white)](https://earthengine.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end, industry-grade scientific framework combining **Physics-Informed Deep Learning (PINN)**, **Earth Observation Satellite Ingestion**, **Game-Theoretic Explainability (SHAP)**, and **Multi-Objective Genetic Optimization (NSGA-II)** to predict Land Surface Temperature (LST) and formulate budget-constrained, equity-focused heat mitigation policies for the Mumbai Metropolitan Region (MMR).

---

## 🏛️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │   Google Earth Engine (GEE) Satellite Feeds  │
                       │ Landsat 8/9 L2, Sentinel-2, ERA5, MODIS,     │
                       │ Google Open Buildings, WorldPop, SRTM Terrain│
                       └──────────────────────┬───────────────────────┘
                                              │ scripts/gee_export.py
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │      4,597 Co-Registered Satellite Pixels    │
                       │        (data/processed/mumbai_features)      │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │  Empirical ML Baselines │                     │   MumbaiPINN (PyTorch)  │
         │  Random Forest & XGBoost│                     │ 3-Stage Physics Loss:   │
         │  (scripts/train_base)   │                     │  - Data Loss (MSE)      │
         └────────────┬────────────┘                     │  - Heat Diffusion       │
                      │                                  │  - Sea-Breeze Advection │
                      │                                  │ (scripts/train_pinn.py) │
                      │                                  └────────────┬────────────┘
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │        SHAP Explainability Analysis          │
                       │  Identifies heating drivers vs cooling sinks │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │       What-If Scenario Simulation            │
                       │   Simulate +NDVI (trees) & +Albedo (cool rf) │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │  NSGA-II Multi-Objective Equity Optimizer    │
                       │  Max Cooling | Min Cost (₹25 Cr) | Max Equity│
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │   Interactive 3D Decision Support Dashboard  │
                       │   React 18 + Three.js 3D Spatial Grid + API  │
                       └──────────────────────────────────────────────┘
```

---

## 🔬 Core Innovations

1. **Advection-Diffusion Physics Embedding:**
   Unlike black-box algorithms that overfit superficial surface reflections, `MumbaiPINN` explicitly enforces the 2D heat equation via automatic differentiation (`torch.autograd`):
   $$\text{Residual} = \frac{\partial T}{\partial t} - \alpha \left(\frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2}\right) + \left(u_{\text{eff}} \frac{\partial T}{\partial x} + v_{\text{eff}} \frac{\partial T}{\partial y}\right) + \lambda_{\text{exch}} (T - T_{\text{air}}) - S$$
   where the Arabian Sea breeze decays exponentially inland:
   $$u_{\text{eff}} = u_{\text{wind}} \cdot \exp\left(-\frac{\text{dist\_to\_sea}}{k_d}\right)$$
2. **Inverse Parameter Discovery:**
   The network does not rely on assumed textbook constants; it dynamically discovers Mumbai's effective thermal diffusivity ($\alpha$) and coastal penetration scale ($k_d$) directly from satellite observations.
3. **Contiguous Spatial Holdout (No Data Leakage):**
   Random train/test splits artificially inflate geospatial model performance due to spatial autocorrelation. This project isolates **Zone 4 (Eastern Suburbs: Kurla, Chembur, Govandi — 836 pixels)** as a blind spatial holdout.
4. **Equity-Aware Resource Allocation (NSGA-II):**
   Interventions are weighted by population density (WorldPop) and socio-economic heat vulnerability, ensuring municipal investments (capped at ₹25 Crore) prioritize disadvantaged communities.

---

## 📊 Experimental Results (1-Year Dry Season: Nov 2023 – Mar 2024)

Evaluated across **4,597 real satellite pixels** spanning temperatures from **26.6°C to 43.4°C**:

| Model Architecture | Validation RMSE | Spatial Holdout (Zone 4) RMSE | Key Finding |
| :--- | :---: | :---: | :--- |
| **Random Forest Baseline** | $1.306^\circ\text{C}$ | $1.645^\circ\text{C}$ | Empirical benchmark (300 trees) |
| **XGBoost Baseline** | $1.239^\circ\text{C}$ | $1.689^\circ\text{C}$ | Non-linear benchmark + SHAP explainer |
| **PINN Stage 1 (Data-Only MLP)** | $2.368^\circ\text{C}$ | $4.029^\circ\text{C}$ | Severe spatial overfitting without physics |
| **PINN Stage 2 (+Diffusion)** | $1.249^\circ\text{C}$ | $1.911^\circ\text{C}$ | **$\sim 52\%$ error drop** via physical regularization |
| **PINN Stage 3 (+Sea Breeze Advection)** | **$1.258^\circ\text{C}$** | **$1.864^\circ\text{C}$** | **Best holdout generalizability**; sea breeze improves coastal accuracy |

### Top SHAP Heat Drivers in Mumbai:
1. **Vegetation Index (NDVI):** `0.871 °C` (Primary natural cooling sink)
2. **Surface Emissivity:** `0.814 °C` (Thermal re-radiation from surfaces)
3. **Shortwave Albedo:** `0.521 °C` (Solar reflection from pavements and roofs)
4. **Built-Up Concrete (NDBI):** `0.419 °C` (Primary artificial heat-trapping driver)
5. **Building Density:** `0.382 °C` (Urban roughness & building concentration)

---

## 💻 System Prerequisites & Compatibility

> [!IMPORTANT]
> **Python Version Requirement:**
> * **Recommended:** **Python 3.10** or **Python 3.11** (Tested on Python `3.11.18`).
> * **Warning regarding Python 3.14:** Python 3.14 is currently **not supported** by PyTorch, SHAP, and Geospatial C-extensions (NumPy 1.26 wheel compilation errors).
>
> **Node.js & npm Requirement:**
> * **Node.js:** `>= 18.0.0` (Tested on `v22.22.1`).
> * **npm:** `>= 9.0.0` (Tested on `9.2.0`).

---

## 🚀 Step-by-Step Installation & Execution Guide

### Step 1: Clone Repository & Create Virtual Environment

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/UrbanHeat-PINN-Mumbai.git
cd UrbanHeat-PINN-Mumbai

# 2. Create Python 3.11 virtual environment
# On Linux / Ubuntu:
python3.11 -m venv .venv
source .venv/bin/activate

# On Windows (PowerShell):
# py -3.11 -m venv .venv
# .venv\Scripts\Activate.ps1
```

### Step 2: Install Python Dependencies

```bash
# 1. Upgrade pip
pip install --upgrade pip

# 2. Install PyTorch (CPU version; or use CUDA index if NVIDIA GPU is present)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# 3. Install core geospatial and scientific requirements
pip install -r requirements.txt
pip install joblib
```

### Step 3: Google Earth Engine (GEE) Authentication

A Google Cloud Project with the Earth Engine API enabled is required for satellite ingestion:

```bash
# 1. Authenticate local account via OAuth
earthengine authenticate --auth_mode=localhost

# 2. Set your Cloud Project ID (e.g. your-project-id)
earthengine set_project YOUR_GOOGLE_CLOUD_PROJECT_ID

# 3. Verify connection
python -c "import ee; ee.Initialize(project='YOUR_GOOGLE_CLOUD_PROJECT_ID'); print('GEE Authenticated!')"
```

### Step 4: Ingest & Export Real Satellite Features

Pull 4,500+ co-registered pixels over Mumbai across Landsat 8/9, Sentinel-2, ERA5, MODIS, and Open Buildings:

```bash
# Ingest 1-Year Dry Season data (Nov 2023 - Mar 2024)
python scripts/gee_export.py --start 2023-11-01 --end 2024-03-01 --num-pixels 10000 --project YOUR_GOOGLE_CLOUD_PROJECT_ID
```
*Outputs: `data/processed/mumbai_features.parquet` and `.csv`.*

### Step 5: Train ML Baselines (Random Forest & XGBoost)

```bash
python scripts/train_baseline.py
```
*Outputs: `results/models/*_baseline.joblib` and `results/metrics/baseline_metrics.json`.*

### Step 6: Train Physics-Informed Neural Network (PINN)

Executes the 3-stage training progression:
* Stage 1: Data loss only (150 epochs)
* Stage 2: Adds heat diffusion equation (250 epochs)
* Stage 3: Adds wind advection & parameter discovery (350 epochs)

```bash
python scripts/train_pinn.py
```
*Outputs: `results/models/pinn_stage*.pt` and `results/metrics/pinn_ablation_metrics.json`.*

### Step 7: Feature Attribution with SHAP

```bash
python scripts/shap_analysis.py --model xgboost
```
*Outputs: `results/metrics/shap_ranking.json`.*

### Step 8: What-If Cooling Scenario Simulation

Simulates real policy modifications (+0.20 NDVI and +0.20 Albedo):

```bash
python scripts/scenario_sim.py --model xgboost
```
*Outputs: `results/metrics/scenario_impacts.csv`.*

### Step 9: Multi-Objective Policy Optimization (NSGA-II)

Finds the Pareto-optimal investment portfolio across Mumbai zones under a ₹25 Cr budget:

```bash
python scripts/optimize_nsga2.py
```
*Outputs: `results/metrics/nsga2_recommendations.csv`.*

---

## 🖥️ Running the Interactive 3D Web Application

The project includes an interactive React + Three.js decision support application with a live Python inference backend.

### 1. Launch the Real Model API Server (Terminal 1)
Serves live predictions from your trained PyTorch PINN and XGBoost models:
```bash
source .venv/bin/activate
python scripts/api_server.py 5000
```
*Server listening at `http://localhost:5000`.*

### 2. Launch the React 3D Dashboard (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Application available at **`http://localhost:5173`**.*

### Dashboard Features:
* **3D Heat Map:** 3D extruded grid of Mumbai with orbit controls, interactive heat tier filtering (Critical, High, Moderate, Normal, Cool), and hover pixel inspection.
* **Heat Drivers:** Visual breakdown of SHAP heating drivers vs cooling sinks.
* **Scenario Simulator:** Real-time policy sliders (Tree Cover, Cool Roofs, Green Roofs, Albedo) with live PyTorch/XGBoost inference and a BMC budget gauge (₹25 Cr cap).

---

## 📁 Repository Structure

```
.
├── configs/
│   └── config.py                 # Geospatial coordinates, bounds, costs, and hyperparams
├── data/
│   ├── processed/                # Model-ready parquet & csv satellite datasets
│   └── vector/                   # Boundary files
├── frontend/                     # React 18 + Vite + Three.js 3D Web Application
│   ├── src/
│   │   ├── components/           # Sidebar, HeatMap3D, HeatDrivers, Scenarios, Modal
│   │   ├── data/                 # Exported real-data JSON
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── models/
│   ├── pinn.py                   # MumbaiPINN PyTorch neural network architecture
│   └── physics_loss.py           # 2D Advection-Diffusion autograd physics loss
├── notebooks/
│   └── mumbai_pinn_demo.ipynb    # Interactive evaluation walkthrough & figures
├── results/
│   ├── metrics/                  # JSON metrics, SHAP rankings, Pareto recommendations
│   └── models/                   # Saved .pt and .joblib trained checkpoints
├── scripts/
│   ├── api_server.py             # Real model inference API server
│   ├── data_loader.py            # Spatial holdout split & normalization
│   ├── features.py               # Remote sensing indices & distance transforms
│   ├── gee_export.py             # Google Earth Engine multi-sensor extractor
│   ├── optimize_nsga2.py         # Multi-objective genetic optimizer
│   ├── scenario_sim.py           # Policy scenario simulator
│   ├── shap_analysis.py          # SHAP explainability pipeline
│   ├── train_baseline.py         # Random Forest and XGBoost trainer
│   └── train_pinn.py             # 3-Stage PINN training pipeline
├── requirements.txt              # Python package requirements
├── .gitignore                    # Production gitignore (ignores models, venv, node_modules)
└── README.md                     # Comprehensive documentation
```

---

## 👥 Academic Credits & Acknowledgements

* **Project:** B.Tech CSE (AIML) Capstone Project (FF-180 Group 16)
* **Team Members:** Prajwal Kadam, Atharva Kangralkar
* **Faculty Guide:** Mrs. Grishma Bobhate
* **Institution:** Department of Computer Science & Engineering (AI & ML)

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
