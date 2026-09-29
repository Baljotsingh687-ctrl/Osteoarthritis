import os,json,logging,joblib,numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI,Request,status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel,Field
import config
from preprocess import preprocess_and_extract_features,PreprocessingError
logging.basicConfig(level=logging.INFO);log=logging.getLogger("sensor_api")
class SensorReadingPoint(BaseModel):
    t_ms: float; ax: float; ay: float; az: float; gx: float; gy: float; gz: float
class AnalyzeSensorRequest(BaseModel):
    sampling_rate_hz: float=config.DEFAULT_SAMPLING_RATE_HZ
    sensors: dict[str,list[SensorReadingPoint]]|None=None
    readings: list[SensorReadingPoint]|None=None
    sensor_position: str="shin"
class Features(BaseModel):
    stride_count:int; mean_stride_duration_s:float; stride_duration_std_s:float|None=None; stride_duration_cv:float; cadence_steps_per_min:float
    stride_asymmetry:float|None=None; shin_peak_angular_velocity_rad_s:float; shin_mean_accel_norm_m_s2:float
    thigh_peak_angular_velocity_rad_s:float|None=None; mapped_sensors:list[str]; missing_sensors:list[str]; imputed_feature_fraction:float
class Response(BaseModel):
    status:str="complete"; prediction:str; confidence:float; risk_score:float; risk_tier:str; interpretation:str; features:dict; warnings:list[str]=[]; prototype:bool=True
def interpret_probability(p):
    p=max(0,min(1,float(p))); c=max(p,1-p)
    if p>=config.RISK_THRESHOLD_HIGH:return "high",config.LABEL_HIGH,c
    if p<=config.RISK_THRESHOLD_LOW:return "low",config.LABEL_LOW,c
    return "monitor",config.LABEL_BORDERLINE,c
@asynccontextmanager
async def lifespan(app):
    app.state.model=app.state.scaler=app.state.feature_cols=None;app.state.model_loaded=False
    try:
        with open(config.FEATURE_COLUMNS_PATH,encoding="utf8") as f:app.state.feature_cols=json.load(f)
        app.state.scaler=joblib.load(config.SCALER_PATH);app.state.model=joblib.load(config.MODEL_PATH)
        n=len(app.state.feature_cols);app.state.model_loaded=(getattr(app.state.scaler,"n_features_in_",n)==n and getattr(app.state.model,"n_features_in_",n)==n)
        log.info("Loaded model=%s features=%d",type(app.state.model).__name__,n)
    except Exception:log.exception("Model loading failed")
    yield
app=FastAPI(title="KOA Wearable Sensor Inference API",version="1.1.0",lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=False,allow_methods=["*"],allow_headers=["*"])
@app.exception_handler(PreprocessingError)
async def pe(_,e):return JSONResponse(status_code=e.status_code,content={"status":"error","error_type":"ValidationError","message":e.message,"detail":e.message})
@app.exception_handler(RequestValidationError)
async def ve(_,e):return JSONResponse(status_code=422,content={"status":"error","error_type":"RequestValidationError","message":str(e),"detail":str(e)})
@app.get("/health")
def health():return {"status":"ok","model_loaded":bool(app.state.model_loaded),"model_type":type(app.state.model).__name__ if app.state.model else None,"features_count":len(app.state.feature_cols) if app.state.feature_cols else None,"fill_mode":config.FILL_MODE}
@app.post("/analyze-sensor")
def analyze(req:AnalyzeSensorRequest):
    if not app.state.model_loaded:return JSONResponse(status_code=503,content={"status":"error","error_type":"ModelNotLoaded","message":"Model not loaded. Ensure model artifacts exist in sensor/model/.","detail":"Model artifacts missing or inconsistent."})
    X,summ,warns=preprocess_and_extract_features(req.model_dump(exclude_none=True),app.state.scaler,app.state.feature_cols,config.FILL_MODE)
    Xs=app.state.scaler.transform(X);model=app.state.model;classes=list(getattr(model,"classes_",[0,1]));p=float(model.predict_proba(Xs)[0][classes.index(1)])
    tier,label,conf=interpret_probability(p)
    return {"status":"complete","prediction":label,"confidence":round(conf,4),"risk_score":round(p*100,2),"risk_tier":tier,"interpretation":config.INTERPRETATION,"features":summ,"warnings":warns,"prototype":config.IS_PROTOTYPE}
if __name__=="__main__":
 import uvicorn;uvicorn.run("sensor_api:app",host="0.0.0.0",port=int(os.environ.get("PORT","8001")))
