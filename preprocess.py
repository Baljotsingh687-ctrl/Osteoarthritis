import re,numpy as np,pandas as pd
from scipy.interpolate import interp1d
from scipy.signal import find_peaks
import config as cfg
from features import extract_all_trial_features,get_canonical_feature_names
class PreprocessingError(Exception):
    def __init__(self,message,status_code=400):super().__init__(message);self.message=message;self.status_code=status_code
def parse_and_validate_payload(body):
    claimed=float(body.get("sampling_rate_hz") or cfg.DEFAULT_SAMPLING_RATE_HZ)
    if claimed<=0:raise PreprocessingError("sampling_rate_hz must be positive.")
    if isinstance(body.get("sensors"),dict) and body["sensors"]:raw=body["sensors"]
    elif isinstance(body.get("readings"),list):raw={str(body.get("sensor_position") or "shin"):body["readings"]}
    else:raise PreprocessingError("Invalid request body. Expected a non-empty 'sensors' object or a 'readings' array.")
    sensors={str(k).lower():v for k,v in raw.items()}
    unknown=[p for p in sensors if p not in cfg.SENSOR_MAPPING]
    if unknown:raise PreprocessingError(f"Unknown sensor position(s) {unknown}. Use only {sorted(cfg.SENSOR_MAPPING)}.")
    if "shin" not in sensors:raise PreprocessingError("The 'shin' sensor is required (strides are detected from it).")
    req=("t_ms","ax","ay","az","gx","gy","gz")
    for pos,readings in sensors.items():
        if not isinstance(readings,list) or not readings:raise PreprocessingError(f"Sensor '{pos}' contains no readings.")
        if len(readings)<cfg.MIN_READINGS_COUNT:raise PreprocessingError(f"Sensor '{pos}' has {len(readings)} readings. Minimum required is {cfg.MIN_READINGS_COUNT} samples.")
        prev=None
        for i,item in enumerate(readings):
            if not isinstance(item,dict):raise PreprocessingError(f"Sensor '{pos}' reading at index {i} must be a JSON object.")
            miss=[k for k in req if k not in item]
            if miss:raise PreprocessingError(f"Sensor '{pos}' reading at index {i} is missing fields: {miss}")
            for k in req:
                v=item[k]
                if isinstance(v,bool) or not isinstance(v,(int,float)) or not np.isfinite(v):raise PreprocessingError(f"Non-numeric or invalid value at '{pos}[{i}].{k}': {v}")
            cur=float(item["t_ms"])
            if prev is not None and cur<prev:raise PreprocessingError(f"Sensor '{pos}' timestamps must not decrease (index {i}: {cur} < {prev}).")
            prev=cur
        dur=(float(readings[-1]["t_ms"])-float(readings[0]["t_ms"]))/1000
        if dur<cfg.MIN_DURATION_SECONDS:raise PreprocessingError(f"Sensor '{pos}' duration is {dur:.2f}s. Minimum required duration is {cfg.MIN_DURATION_SECONDS:.1f} seconds for gait analysis.")
    return sensors,claimed
def convert_and_resample_sensor_df(readings,target_sampling_rate=100,window_seconds=None):
    df=pd.DataFrame(readings)
    for ax in "xyz":
        df[f"a{ax}_si"]=df[f"a{ax}"].astype(float)*cfg.ACCEL_CONVERSION_FACTOR
        df[f"g{ax}_si"]=df[f"g{ax}"].astype(float)*cfg.GYRO_CONVERSION_FACTOR
        df[f"free_a{ax}_si"]=df[f"a{ax}_si"]-df[f"a{ax}_si"].mean()
    df=df.groupby("t_ms",as_index=False).mean()
    ts=float(df.t_ms.iloc[0]); te=float(df.t_ms.iloc[-1])
    if window_seconds is not None:te=min(te,ts+window_seconds*1000)
    tu=np.arange(ts,te+1e-6,1000/target_sampling_rate); out={"t_ms":tu}
    for col in ["ax_si","ay_si","az_si","free_ax_si","free_ay_si","free_az_si","gx_si","gy_si","gz_si"]:
        out[col]=interp1d(df.t_ms,df[col],kind="linear",fill_value="extrapolate")(tu)
    return pd.DataFrame(out)
def detect_strides_from_shin(shin_df,sampling_rate=100):
    gm=np.sqrt(shin_df.gx_si**2+shin_df.gy_si**2+shin_df.gz_si**2).values
    dist=max(1,int((cfg.STRIDE_PEAK_MIN_DISTANCE_MS/1000)*sampling_rate))
    prom=max(cfg.STRIDE_PEAK_PROMINENCE,cfg.STRIDE_PEAK_REL_PROMINENCE*float(np.percentile(gm,95)))
    peaks,_=find_peaks(gm,distance=dist,prominence=prom)
    if len(peaks)<cfg.MIN_STRIDES_REQUIRED:peaks,_=find_peaks(gm,distance=dist,prominence=max(.15,prom*.5))
    if len(peaks)<cfg.MIN_STRIDES_REQUIRED:raise PreprocessingError(f"Could not detect sufficient gait cycles from shin sensor. Found {len(peaks)} stride peak(s); minimum required is {cfg.MIN_STRIDES_REQUIRED}. Please ensure the subject is walking continuously and the sensor is securely attached.",422)
    ev=[[int(peaks[i]),int(peaks[i+1])] for i in range(len(peaks)-1)]; ds=[(e[1]-e[0])/sampling_rate for e in ev]; md=float(np.mean(ds)); sd=float(np.std(ds))
    return ev,{"stride_count":len(ev),"mean_stride_duration_s":round(md,3),"stride_duration_std_s":round(sd,3),"stride_duration_cv":round(sd/md,3) if md else 0.0,"cadence_steps_per_min":round((60/md)*2,1) if md else 0.0,"shin_peak_angular_velocity_rad_s":round(float(gm.max()),2)}
def build_wide_dataframe(resampled):
    ml=min(len(x) for x in resampled.values()); wide=pd.DataFrame({"PacketCounter":np.arange(ml)}); mapped=[]
    for pos,df in resampled.items():
        pre=cfg.SENSOR_MAPPING.get(pos.lower())
        if not pre:continue
        mapped.append(pre); sub=df.iloc[:ml]
        for ax in "XYZ":
            lo=ax.lower(); wide[f"{pre}_Acc_{ax}"]=sub[f"a{lo}_si"].values; wide[f"{pre}_FreeAcc_{ax}"]=sub[f"free_a{lo}_si"].values; wide[f"{pre}_Gyr_{ax}"]=sub[f"g{lo}_si"].values
    return wide,mapped,[s for s in cfg.ALL_TRAINING_SENSORS if s not in mapped]
_UNMEASURED=re.compile(r"^(left_stride_.*|stride_asymmetry|total_stride_count|.*_left_stridecv_(mean|peak))$")
def preprocess_and_extract_features(payload,scaler=None,expected_feature_cols=None,fill_mode=cfg.FILL_MODE):
    warnings=[]; sensors,_=parse_and_validate_payload(payload); rate=cfg.DEFAULT_SAMPLING_RATE_HZ
    resampled={p:convert_and_resample_sensor_df(r,rate,cfg.TRAIN_TRIAL_SECONDS) for p,r in sensors.items()}
    shin=resampled["shin"]; events,metrics=detect_strides_from_shin(shin,rate)
    meta={"rightGaitEvents":events,"leftGaitEvents":[]}; wide,mapped,missing=build_wide_dataframe(resampled)
    if "LB" in mapped:warnings.append("Thigh IMU is mapped to the training lower-back (LB) slot; no thigh sensor existed in training data.")
    if missing:warnings.append(f"Missing training sensor locations: {missing}. Imputing them using FILL_MODE='{fill_mode}'.")
    raw=extract_all_trial_features(wide,meta,rate)
    for k in list(raw):
        if _UNMEASURED.match(k):raw[k]=np.nan
    warnings.append("Only one leg is instrumented: left-leg stride features and stride asymmetry were treated as missing.")
    cols=expected_feature_cols or get_canonical_feature_names(); vec=np.zeros(len(cols),float); means=getattr(scaler,"mean_",None); imp=0
    for i,c in enumerate(cols):
        v=raw.get(c)
        if v is None or not np.isfinite(v):
            imp+=1; vec[i]=float(means[i]) if means is not None and fill_mode in ("zero_after_scaling","train_mean") else 0.0
        else:vec[i]=float(v)
    frac=imp/max(1,len(cols))
    if imp:warnings.append(f"{imp} of {len(cols)} model features ({frac:.0%}) were imputed because the live hardware cannot measure them.")
    summary=dict(metrics); summary["mapped_sensors"]=mapped; summary["missing_sensors"]=missing; summary["imputed_feature_fraction"]=round(frac,3); summary["stride_asymmetry"]=None
    summary["shin_mean_accel_norm_m_s2"]=round(float(np.sqrt(shin.ax_si**2+shin.ay_si**2+shin.az_si**2).mean()),2)
    if "thigh" in resampled:
        t=resampled["thigh"];summary["thigh_peak_angular_velocity_rad_s"]=round(float(np.sqrt(t.gx_si**2+t.gy_si**2+t.gz_si**2).max()),2)
    return vec.reshape(1,-1),summary,warnings
