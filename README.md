# CardioViz

Cardiovascular risk prediction with an interactive 3D coronary map. Multimodal AI Hackathon 2026, Track A.
Predicts overall CAD and LAD / LCX / RCA stenosis from 16 clinical inputs, colours each artery by predicted probability, and explains each prediction with exact SHAP values.

> **Clinical safety notice:** for decision support and education only. Not a diagnosis; does not replace imaging or a clinician's judgement.

- Website and demo: deploy with the steps in [DEPLOY.md](DEPLOY.md). The demo is `public/app/index.html` (served at `/app/`).
- Demo weights are illustrative, not trained on patient data. Train real models with `train.py` on the Z-Alizadeh Sani dataset (UCI) if you add it.
- Limitations: small single-centre dataset, no external validation, linear models, schematic anatomy.
- Licence: MIT. Contact: devprakashsahu348@gmail.com. © Dev Prakash Sahu.
