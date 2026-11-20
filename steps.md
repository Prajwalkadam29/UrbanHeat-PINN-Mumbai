(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/gee_export.py --num-pixels 10000 --project test-alchemist-demo
/home/prajwal/projects/EDAI7/.venv/lib/python3.11/site-packages/ee/deprecation.py:215: DeprecationWarning: 

Attention required for WorldPop/GP/100m/pop! You are using a deprecated asset.
To make sure your code keeps working, please update it.
This dataset has been superseded by WorldPop/GP/100m/R2025A/v1/pop

Learn more: https://developers.google.com/earth-engine/datasets/catalog/WorldPop_GP_100m_pop

  warnings.warn(warning, category=DeprecationWarning)
Exported 4,595 real pixels to /home/prajwal/projects/EDAI7/data/processed/mumbai_features.parquet
             lst_c         ndvi         ndbi
count  4595.000000  4595.000000  4595.000000
mean     31.363037     0.386176    -0.061279
std       2.911813     0.212044     0.151531
min      24.110036    -0.029625    -0.567376
25%      29.107181     0.196525    -0.162399
50%      31.434852     0.368383    -0.043764
75%      33.395087     0.579488     0.051466
max      40.331958     0.849078     0.495330

---

(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/train_baseline.py
Loaded Mumbai Dataset: 4,595 land pixels
Train set: 3,196 pixels
Validation set: 563 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
random_forest: validation RMSE=1.299, holdout RMSE=1.344
xgboost: validation RMSE=1.219, holdout RMSE=1.374

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/train_pinn.py
Loaded Mumbai Dataset: 4,595 land pixels
Train set: 3,196 pixels
Validation set: 563 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
stage1: validation RMSE=2.095, holdout RMSE=3.043
stage2: validation RMSE=1.213, holdout RMSE=1.469
stage3: validation RMSE=1.190, holdout RMSE=1.474

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/shap_analysis.py --model xgboost
Loaded Mumbai Dataset: 4,595 land pixels
Train set: 3,196 pixels
Validation set: 563 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
PermutationExplainer explainer: 501it [00:32, 12.08it/s]                                   
Wrote SHAP ranking to /home/prajwal/projects/EDAI7/results/metrics/shap_ranking.json
{
  "emissivity": 0.7687049471402169,
  "ndvi": 0.6700385509204867,
  "ndbi": 0.6234227064061159,
  "albedo": 0.509987494609356,
  "u_wind": 0.3258650708436966
}

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/scenario_sim.py --model xgboost
Loaded Mumbai Dataset: 4,595 land pixels
Train set: 3,196 pixels
Validation set: 563 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
Wrote 4,595 scenario rows to /home/prajwal/projects/EDAI7/results/metrics/scenario_impacts.csv
       greening_delta_lst_c  cool_roof_delta_lst_c
count           4595.000000            4595.000000
mean              -0.609353               2.083691
std                0.631378               0.905125
min               -3.422775              -0.647167
25%               -0.957499               1.390147
50%               -0.400005               1.969940
75%               -0.120538               2.697735
max                0.614674               4.591661

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/optimize_nsga2.py
Wrote 1 Pareto recommendations to /home/prajwal/projects/EDAI7/results/metrics/nsga2_recommendations.csv

zone_1,zone_2,zone_3,zone_4,zone_5,cooling_gain_c_m2,cost_inr,equity_weighted_benefit
none,none,none,none,none,0.0,0.0,0.0

---

