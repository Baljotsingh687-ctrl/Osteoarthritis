import re, numpy as np, pandas as pd
from scipy import stats
from scipy.fft import rfft, rfftfreq
SIGNAL_COL_PATTERN=re.compile(r"^(HE|LB|LF|RF)_(Acc|FreeAcc|Gyr|Mag)_[XYZ]$",re.I)
def extract_axis_features(signal,sr,prefix):
    signal=np.asarray(signal,dtype=float); signal=signal[~np.isnan(signal)]
    keys=["mean","std","min","max","range","rms","skew","kurtosis","zcr","dom_freq","spec_energy"]
    if len(signal)<4:return {f"{prefix}_{k}":np.nan for k in keys}
    f={}
    f[f"{prefix}_mean"]=float(np.mean(signal)); f[f"{prefix}_std"]=float(np.std(signal))
    f[f"{prefix}_min"]=float(np.min(signal)); f[f"{prefix}_max"]=float(np.max(signal))
    f[f"{prefix}_range"]=float(np.ptp(signal)); f[f"{prefix}_rms"]=float(np.sqrt(np.mean(signal**2)))
    f[f"{prefix}_skew"]=float(stats.skew(signal)); f[f"{prefix}_kurtosis"]=float(stats.kurtosis(signal))
    mean_val=signal.mean(); f[f"{prefix}_zcr"]=float(len(np.where(np.diff(np.sign(signal-mean_val)))[0])/len(signal))
    freqs=rfftfreq(len(signal),d=1.0/sr); mags=np.abs(rfft(signal-mean_val))
    if len(mags)>1:
        f[f"{prefix}_dom_freq"]=float(freqs[1:][np.argmax(mags[1:])]); f[f"{prefix}_spec_energy"]=float(np.sum(mags**2))
    else:f[f"{prefix}_dom_freq"]=0.0; f[f"{prefix}_spec_energy"]=0.0
    return f
def extract_signal_features(df,sr):
    row={}
    for col in [c for c in df.columns if SIGNAL_COL_PATTERN.match(c)]:row.update(extract_axis_features(df[col].values,sr,col))
    return row
def extract_gait_event_features(meta,sampling_rate_hz):
    feats={};means={}
    for side,key in [("left","leftGaitEvents"),("right","rightGaitEvents")]:
        events=meta.get(key,[]) or []; durations=[(e[1]-e[0])/sampling_rate_hz for e in events if len(e)==2]
        feats[f"{side}_stride_count"]=float(len(durations))
        if durations:
            feats[f"{side}_stride_dur_mean"]=float(np.mean(durations)); feats[f"{side}_stride_dur_std"]=float(np.std(durations))
            feats[f"{side}_stride_dur_cv"]=float(np.std(durations)/np.mean(durations)) if np.mean(durations)>0 else np.nan; means[side]=np.mean(durations)
        else:
            feats[f"{side}_stride_dur_mean"]=np.nan; feats[f"{side}_stride_dur_std"]=np.nan; feats[f"{side}_stride_dur_cv"]=np.nan
    feats["stride_asymmetry"]=float(abs(means["left"]-means["right"])/((means["left"]+means["right"])/2.0)) if "left" in means and "right" in means and means["left"]+means["right"]>0 else np.nan
    feats["total_stride_count"]=feats["left_stride_count"]+feats["right_stride_count"]; return feats
def extract_stride_signal_variability(df,meta,sensors=["HE","LB","LF","RF"]):
    if df is None or "PacketCounter" not in df.columns:return {}
    row={}
    for sensor in sensors:
        for mag_name in ["FreeAcc","Gyr"]:
            cols=[f"{sensor}_{mag_name}_{ax}" for ax in ["X","Y","Z"]]
            if not all(c in df.columns for c in cols):continue
            magnitude=np.sqrt((df[cols].astype(float)**2).sum(axis=1))
            for side,key in [("left","leftGaitEvents"),("right","rightGaitEvents")]:
                events=meta.get(key,[]) or []; means=[]; peaks=[]
                for ev in events:
                    if len(ev)!=2:continue
                    seg=magnitude[(df["PacketCounter"]>=int(ev[0]))&(df["PacketCounter"]<=int(ev[1]))]
                    if len(seg)<2:continue
                    means.append(seg.mean()); peaks.append(seg.max())
                prefix=f"{sensor}_{mag_name}_{side}"
                row[f"{prefix}_stridecv_mean"]=float(np.std(means)/abs(np.mean(means))) if len(means)>=2 and np.mean(means)!=0 else np.nan
                row[f"{prefix}_stridecv_peak"]=float(np.std(peaks)/abs(np.mean(peaks))) if len(peaks)>=2 and np.mean(peaks)!=0 else np.nan
    return row
def extract_all_trial_features(df,meta,sampling_rate_hz):
    x=extract_signal_features(df,sampling_rate_hz); x.update(extract_gait_event_features(meta,sampling_rate_hz)); x.update(extract_stride_signal_variability(df,meta)); return x
def get_canonical_feature_names():
    names=[]; stats_keys=["mean","std","min","max","range","rms","skew","kurtosis","zcr","dom_freq","spec_energy"]
    for s in ["HE","LB","LF","RF"]:
        for sig in ["Acc","FreeAcc","Gyr"]:
            for ax in ["X","Y","Z"]:
                for k in stats_keys:names.append(f"{s}_{sig}_{ax}_{k}")
    names += ["left_stride_count","left_stride_dur_mean","left_stride_dur_std","left_stride_dur_cv","right_stride_count","right_stride_dur_mean","right_stride_dur_std","right_stride_dur_cv","stride_asymmetry","total_stride_count"]
    for s in ["HE","LB","LF","RF"]:
        for m in ["FreeAcc","Gyr"]:
            for side in ["left","right"]:
                names += [f"{s}_{m}_{side}_stridecv_mean",f"{s}_{m}_{side}_stridecv_peak"]
    return names
