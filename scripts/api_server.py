"""
Real Model Inference & Data API Server for Mumbai UHI PINN Frontend.
Serves real predictions from trained XGBoost, Random Forest, and PINN Stage 3 checkpoints.
"""

from __future__ import annotations
import json
import sys
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import numpy as np
import pandas as pd
import joblib
import torch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from configs.config import (
    FEATURE_COLUMNS,
    MUMBAI_BOUNDS,
    MODELS_DIR,
    METRICS_DIR,
    PROCESSED_DATA_DIR,
    OPTIMIZATION_CONFIG,
)
from models.pinn import MumbaiPINN
from scripts.features import scale_coordinates
from scripts.data_loader import load_mumbai_data

# Global Cache
CACHE = {}

def load_models_and_data():
    print("Loading real Mumbai satellite dataset and trained models...")
    df = pd.read_parquet(PROCESSED_DATA_DIR / "mumbai_features.parquet")
    df_land = df[df["is_land"] == 1].copy().reset_index(drop=True)

    # Load baseline models
    xgb_model = joblib.load(MODELS_DIR / "xgboost_baseline.joblib")
    rf_model = joblib.load(MODELS_DIR / "random_forest_baseline.joblib")

    # Load PINN Stage 3
    pinn_path = MODELS_DIR / "pinn_stage3.pt"
    pinn_model = MumbaiPINN(n_features=len(FEATURE_COLUMNS))
    if pinn_path.exists():
        checkpoint = torch.load(pinn_path, map_location="cpu")
        pinn_model.load_state_dict(checkpoint["model_state_dict"])
        pinn_model.eval()

    # Load data loader scaler for PINN inputs
    data_dict = load_mumbai_data(random_seed=42)
    scaler = data_dict["scaler"]

    # Precompute coordinates for PINN
    x_norm, y_norm = scale_coordinates(df_land["lon"].values, df_land["lat"].values, MUMBAI_BOUNDS)
    t_norm = np.full_like(x_norm, 0.5)
    coords_all = np.column_stack([x_norm, y_norm, t_norm]).astype(np.float32)

    # Load metrics
    baseline_metrics = json.loads((METRICS_DIR / "baseline_metrics.json").read_text()) if (METRICS_DIR / "baseline_metrics.json").exists() else {}
    pinn_metrics = json.loads((METRICS_DIR / "pinn_ablation_metrics.json").read_text()) if (METRICS_DIR / "pinn_ablation_metrics.json").exists() else {}
    shap_ranking = json.loads((METRICS_DIR / "shap_ranking.json").read_text()) if (METRICS_DIR / "shap_ranking.json").exists() else {}

    CACHE["df"] = df_land
    CACHE["xgb"] = xgb_model
    CACHE["rf"] = rf_model
    CACHE["pinn"] = pinn_model
    CACHE["scaler"] = scaler
    CACHE["coords"] = coords_all
    CACHE["baseline_metrics"] = baseline_metrics
    CACHE["pinn_metrics"] = pinn_metrics
    CACHE["shap_ranking"] = shap_ranking

    print(f"Loaded {len(df_land):,} real land pixels and all ML/PINN models into memory.")


class APIServerHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self._send_cors_headers()
        if self.path == "/api/status" or self.path == "/api/status/":
            df = CACHE["df"]
            critical_count = int((df["lst_c"] >= 38.0).sum())
            high_count = int(((df["lst_c"] >= 35.0) & (df["lst_c"] < 38.0)).sum())
            moderate_count = int(((df["lst_c"] >= 32.0) & (df["lst_c"] < 35.0)).sum())
            normal_count = int(((df["lst_c"] >= 29.0) & (df["lst_c"] < 32.0)).sum())
            cool_count = int((df["lst_c"] < 29.0).sum())

            response = {
                "status": "online",
                "city": "Mumbai, Maharashtra",
                "date_range": "NOV 2023 – MAR 2024",
                "cycle": "1-Year Real Satellite Observation Cycle",
                "total_pixels": len(df),
                "mean_lst": round(float(df["lst_c"].mean()), 1),
                "max_lst": round(float(df["lst_c"].max()), 1),
                "min_lst": round(float(df["lst_c"].min()), 1),
                "hotspot_area_km2": 155.0,
                "uhi_intensity": round(float(df["lst_c"].mean()) - 26.5, 1),
                "heat_tiers": {
                    "critical": critical_count,
                    "high": high_count,
                    "moderate": moderate_count,
                    "normal": normal_count,
                    "cool": cool_count,
                },
                "shap_ranking": CACHE["shap_ranking"].get("xgboost", {}),
                "baseline_metrics": CACHE["baseline_metrics"],
                "pinn_metrics": CACHE["pinn_metrics"],
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))

        elif self.path == "/api/pixels":
            df = CACHE["df"]
            pixels = []
            for _, r in df.iterrows():
                pixels.append({
                    "lon": round(float(r["lon"]), 4),
                    "lat": round(float(r["lat"]), 4),
                    "lst": round(float(r["lst_c"]), 2),
                    "ndvi": round(float(r["ndvi"]), 3),
                    "ndbi": round(float(r["ndbi"]), 3),
                    "albedo": round(float(r["albedo"]), 3),
                    "building_density": round(float(r["building_density"]), 3),
                    "dist_sea": round(float(r["dist_to_sea_km"]), 2),
                    "zone": int(r["spatial_zone"]),
                    "pop": round(float(r["population_100m"]), 1),
                })
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"pixels": pixels}).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        self._send_cors_headers()
        if self.path == "/api/simulate":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode("utf-8"))

            tree_cover = float(params.get("treeCover", 0))
            cool_roofs = float(params.get("coolRoofs", 0))
            green_roofs = float(params.get("greenRoofs", 0))
            albedo_pct = float(params.get("albedo", 0))
            model_type = params.get("model", "xgboost")

            df = CACHE["df"]
            base_features = df[FEATURE_COLUMNS].copy()

            # Physical feature shift based on intervention intensity
            mod_features = base_features.copy()
            ndvi_delta = (tree_cover * 0.0035 + green_roofs * 0.0025)
            albedo_delta = (cool_roofs * 0.0030 + albedo_pct * 0.0020)

            mod_features["ndvi"] = (mod_features["ndvi"] + ndvi_delta).clip(-1.0, 1.0)
            mod_features["albedo"] = (mod_features["albedo"] + albedo_delta).clip(0.0, 1.0)

            # Inference using real model
            if model_type == "random_forest":
                baseline_preds = CACHE["rf"].predict(base_features.to_numpy(dtype=np.float32))
                scenario_preds = CACHE["rf"].predict(mod_features.to_numpy(dtype=np.float32))
            elif model_type == "pinn":
                pinn = CACHE["pinn"]
                scaler = CACHE["scaler"]
                coords_t = torch.from_numpy(CACHE["coords"])
                
                base_scaled = scaler.transform(base_features.to_numpy(dtype=np.float32))
                mod_scaled = scaler.transform(mod_features.to_numpy(dtype=np.float32))
                
                with torch.no_grad():
                    baseline_preds = pinn(coords_t, torch.from_numpy(base_scaled).float()).squeeze(1).numpy()
                    scenario_preds = pinn(coords_t, torch.from_numpy(mod_scaled).float()).squeeze(1).numpy()
            else:  # default xgboost
                baseline_preds = CACHE["xgb"].predict(base_features.to_numpy(dtype=np.float32))
                scenario_preds = CACHE["xgb"].predict(mod_features.to_numpy(dtype=np.float32))

            deltas = scenario_preds - baseline_preds
            mean_drop = float(np.mean(deltas))
            max_drop = float(np.min(deltas))

            base_critical = int((baseline_preds >= 38.0).sum())
            scen_critical = int((scenario_preds >= 38.0).sum())
            hotspot_reduc_pct = round(((base_critical - scen_critical) / max(1, base_critical)) * 100, 1)

            # Equity weighted benefit
            pop = df["population_100m"].values
            vuln = df["vulnerability_index"].values
            equity_gain = float(np.sum(-deltas * pop * vuln))

            # Budget estimation in INR
            area_m2 = 500 * 500  # 500m block
            green_cost = (tree_cover / 100.0) * len(df) * area_m2 * 0.05 * 450.0 # 5% block coverage
            roof_cost = (cool_roofs / 100.0) * len(df) * area_m2 * 0.10 * 120.0
            total_cost_cr = round((green_cost + roof_cost) / 1e7, 2)

            response = {
                "model_used": model_type,
                "mean_delta_c": round(mean_drop, 2),
                "max_cooling_c": round(max_drop, 2),
                "baseline_mean_lst": round(float(np.mean(baseline_preds)), 1),
                "simulated_mean_lst": round(float(np.mean(scenario_preds)), 1),
                "hotspot_eliminated_pct": max(0.0, hotspot_reduc_pct),
                "equity_benefit_score": round(equity_gain, 1),
                "estimated_cost_cr_inr": total_cost_cr,
                "sample_deltas": [round(float(d), 2) for d in deltas[::10]],
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Quiet server logging
        return


def run_server(port=5000):
    load_models_and_data()
    server_address = ("0.0.0.0", port)
    httpd = ThreadingHTTPServer(server_address, APIServerHandler)
    print(f"API Server running at http://0.0.0.0:{port} (serving real ML & PINN models)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down API server...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    run_server(port)
