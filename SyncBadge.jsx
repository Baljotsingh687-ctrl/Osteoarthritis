import { useEffect, useState } from 'react'
import { db } from '../lib/db.js'
import { syncPendingScreenings } from '../lib/sync.js'

export default function SyncBadge() {
  const [pendingCount, setPendingCount] = useState(0); const [online, setOnline] = useState(navigator.onLine)
  async function refresh(){ const [a,b]=await Promise.all([db.outbox.where('synced').equals(false).count(),db.captureQueue.where('synced').equals(false).count()]); setPendingCount(a+b) }
  useEffect(()=>{refresh(); const onlineHandler=async()=>{setOnline(true);await syncPendingScreenings();await refresh()};const off=()=>setOnline(false);window.addEventListener('online',onlineHandler);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',onlineHandler);window.removeEventListener('offline',off)}},[])
  const synced=online&&pendingCount===0
  return <div className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md bg-white/10"><span className={`w-2 h-2 rounded-full ${synced?'bg-risk-low':'bg-gold'}`}/><span>{!online?'Offline — saving locally':pendingCount>0?`Syncing ${pendingCount} item${pendingCount>1?'s':''}...`:'All records synced'}</span></div>
}
