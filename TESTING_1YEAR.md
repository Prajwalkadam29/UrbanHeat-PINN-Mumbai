(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/gee_export.py --start 2023-11-01 --end 2024-03-01 --num-pixels 10000 --project test-alchemist-demo
/home/prajwal/projects/EDAI7/.venv/lib/python3.11/site-packages/ee/deprecation.py:215: DeprecationWarning: 

Attention required for WorldPop/GP/100m/pop! You are using a deprecated asset.
To make sure your code keeps working, please update it.
This dataset has been superseded by WorldPop/GP/100m/R2025A/v1/pop

Learn more: https://developers.google.com/earth-engine/datasets/catalog/WorldPop_GP_100m_pop

  warnings.warn(warning, category=DeprecationWarning)
Exported 4,597 real pixels to /home/prajwal/projects/EDAI7/data/processed/mumbai_features.parquet
             lst_c         ndvi         ndbi
count  4597.000000  4597.000000  4597.000000
mean     33.595353     0.410454    -0.062658
std       3.310428     0.220289     0.152319
min      26.572719    -0.034653    -0.576196
25%      31.086214     0.211701    -0.166191
50%      33.707836     0.402087    -0.048272
75%      35.803082     0.621218     0.055031
max      43.430394     0.864700     0.545578

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/train_baseline.py
Loaded Mumbai Dataset: 4,597 land pixels
Train set: 3,197 pixels
Validation set: 564 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
random_forest: validation RMSE=1.306, holdout RMSE=1.645
xgboost: validation RMSE=1.239, holdout RMSE=1.689

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/train_pinn.py
Loaded Mumbai Dataset: 4,597 land pixels
Train set: 3,197 pixels
Validation set: 564 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
stage1: validation RMSE=2.368, holdout RMSE=4.029
stage2: validation RMSE=1.249, holdout RMSE=1.911
stage3: validation RMSE=1.258, holdout RMSE=1.864

---

$ python scripts/shap_analysis.py --model xgboost
Loaded Mumbai Dataset: 4,597 land pixels
Train set: 3,197 pixels
Validation set: 564 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
PermutationExplainer explainer: 501it [00:33, 12.08it/s]                                       
Wrote SHAP ranking to /home/prajwal/projects/EDAI7/results/metrics/shap_ranking.json
{
  "ndvi": 0.8712567745685573,
  "emissivity": 0.8143070779395112,
  "albedo": 0.5210215302634242,
  "ndbi": 0.41861075548172044,
  "building_density": 0.3823377282357214
}

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/scenario_sim.py --model xgboost
Loaded Mumbai Dataset: 4,597 land pixels
Train set: 3,197 pixels
Validation set: 564 pixels
Contiguous Spatial Holdout Test set (Zone 4): 836 pixels
Wrote 4,597 scenario rows to /home/prajwal/projects/EDAI7/results/metrics/scenario_impacts.csv
       greening_delta_lst_c  cool_roof_delta_lst_c
count           4597.000000            4597.000000
mean              -0.676874               1.931659
std                0.656514               0.848898
min               -4.436478              -0.013313
25%               -1.056744               1.277035
50%               -0.519127               1.852684
75%               -0.169466               2.566729
max                0.827028               6.049723

---

(.venv) 
(prajwal@Tech2005)-[~/projects/EDAI7] main
$ python scripts/optimize_nsga2.py
Wrote 1 Pareto recommendations to /home/prajwal/projects/EDAI7/results/metrics/nsga2_recommendations.csv

zone_1,zone_2,zone_3,zone_4,zone_5,cooling_gain_c_m2,cost_inr,equity_weighted_benefit
none,none,none,none,none,0.0,0.0,0.0

---
