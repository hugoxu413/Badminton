import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

// ── 常數
const AVATARS = ['🏸','😊','🐼','🦊','🐱','🐻','🐯','🐸','🦁','🐺','🐧','🦄','🐙']
const WEEKDAY_TIMES = ['19:00','20:00','21:00']
const WEEKEND_TIMES = ['09:00','10:00','11:00','14:00','15:00','19:00','20:00']
const VENUE_URL = 'https://vip.hengfu-i.com/index.php?dr_idno=94549706'
const DAYS_ZH = ['日','一','二','三','四','五','六']

function getDates(from, to) {
  const dates = [], cur = new Date(from), end = new Date(to)
  while (cur <= end) { dates.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1) }
  return dates
}
function isWeekend(d) { const day = new Date(d).getDay(); return day===0||day===6 }
function dayZh(d) { return '週'+DAYS_ZH[new Date(d).getDay()] }
function fmtDate(d) { const x=new Date(d); return `${x.getMonth()+1}/${x.getDate()}（${dayZh(d)}）` }
function fmtSlot(slot) { const [d,t]=slot.split(' '); return `${fmtDate(d)} ${t}` }
function genCode() { return Math.random().toString(36).slice(2,10) }

// ── 全域 CSS（明亮活潑風格）
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#f0fdf4;font-family:'Noto Sans TC','PingFang TC',sans-serif;}
  ::-webkit-scrollbar{display:none;}
  #root{display:flex;justify-content:center;min-height:100%;}

  .app{width:100%;max-width:430px;min-height:100vh;background:#fff;position:relative;padding-bottom:80px;box-shadow:0 0 40px rgba(0,0,0,.08);}
  .page{padding:16px 16px 24px;}
  .topbar{background:linear-gradient(135deg,#16a34a,#0ea5e9);padding:20px 16px 16px;color:#fff;}
  .topbar-title{font-size:22px;font-weight:900;letter-spacing:.5px;}
  .topbar-sub{font-size:13px;opacity:.85;margin-top:2px;}

  /* 按鈕 */
  .btn-green{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:all .15s;box-shadow:0 4px 12px rgba(22,163,74,.3);}
  .btn-green:active{transform:scale(.98);}
  .btn-green:disabled{opacity:.4;cursor:not-allowed;box-shadow:none;}
  .btn-blue{background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:all .15s;box-shadow:0 4px 12px rgba(14,165,233,.3);}
  .btn-blue:active{transform:scale(.98);}
  .btn-outline{background:#fff;color:#16a34a;border:2px solid #16a34a;border-radius:14px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
  .btn-red{background:#fff;color:#ef4444;border:2px solid #fecaca;border-radius:12px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
  .btn-sm{background:#f0fdf4;color:#16a34a;border:1.5px solid #bbf7d0;border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

  /* 輸入 */
  .inp{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;color:#1e293b;font-size:15px;font-family:inherit;padding:12px 14px;width:100%;outline:none;transition:border-color .2s;}
  .inp:focus{border-color:#16a34a;background:#fff;}
  .inp-date{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;color:#1e293b;font-size:14px;font-family:inherit;padding:11px 12px;outline:none;flex:1;transition:border-color .2s;}
  .inp-date:focus{border-color:#16a34a;}

  /* 卡片 */
  .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:15px;margin-bottom:10px;cursor:pointer;transition:all .15s;}
  .card:hover{border-color:#16a34a;box-shadow:0 4px 16px rgba(22,163,74,.1);}
  .card.sel{border-color:#16a34a;background:#f0fdf4;}
  .card-flat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:10px;}

  /* 標籤 */
  .tag-green{display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#15803d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-blue{display:inline-flex;align-items:center;gap:4px;background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-orange{display:inline-flex;align-items:center;gap:4px;background:#ffedd5;color:#c2410c;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-gray{display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;color:#64748b;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-red{display:inline-flex;align-items:center;gap:4px;background:#fee2e2;color:#dc2626;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}

  /* 月曆 */
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:16px;}
  .cal-header{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px;}
  .cal-hd{text-align:center;font-size:11px;font-weight:700;color:#94a3b8;padding:4px 0;}
  .cal-hd.we{color:#ef4444;}
  .cal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:#f8fafc;position:relative;}
  .cal-day:hover{border-color:#16a34a;background:#f0fdf4;}
  .cal-day.has-slot{background:#dcfce7;border-color:#86efac;}
  .cal-day.my-slot{background:#16a34a;border-color:#15803d;}
  .cal-day.my-slot .cal-day-num{color:#fff;}
  .cal-day.past{opacity:.35;cursor:not-allowed;}
  .cal-day.empty{background:transparent;border-color:transparent;cursor:default;}
  .cal-day-num{font-size:14px;font-weight:700;color:#1e293b;}
  .cal-day-dot{width:5px;height:5px;border-radius:50%;background:#16a34a;margin-top:2px;}
  .cal-day.my-slot .cal-day-dot{background:#fff;}

  /* 時段選擇 */
  .time-grid{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
  .time-btn{border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;border-radius:10px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .15s;}
  .time-btn:hover{border-color:#16a34a;color:#16a34a;}
  .time-btn.on{border-color:#16a34a;background:#16a34a;color:#fff;}
  .time-btn.others{border-color:#86efac;background:#f0fdf4;color:#15803d;}

  /* 導航 */
  .nav{display:flex;border-top:1px solid #e2e8f0;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:#fff;z-index:99;}
  .nb{flex:1;padding:10px 0 14px;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;font-family:inherit;transition:color .15s;}
  .nb.on{color:#16a34a;}
  .nb-lbl{font-size:10px;margin-top:2px;}
  .nb.on .nb-lbl{color:#16a34a;}

  /* 其他 */
  .section-title{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:10px;}
  .av-btn{font-size:22px;background:#f8fafc;border:2px solid transparent;border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
  .av-btn.on{border-color:#16a34a;background:#dcfce7;}
  .share-box{background:#f0fdf4;border:1.5px dashed #86efac;border-radius:14px;padding:14px;margin-bottom:16px;}
  .overlap-bar{height:6px;background:#e2e8f0;border-radius:3px;margin-top:8px;overflow:hidden;}
  .overlap-fill{height:100%;background:linear-gradient(90deg,#16a34a,#0ea5e9);border-radius:3px;transition:width .3s;}
  .spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#16a34a;border-radius:50%;animation:spin .7s linear infinite;margin:20px auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fu{animation:fu .3s ease forwards;}
  .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(22,163,74,.4);}
  .divider{height:1px;background:#f1f5f9;margin:16px 0;}
  .booking-badge{display:flex;align-items:center;gap:8px;background:#fefce8;border:1px solid #fde047;border-radius:12px;padding:10px 14px;margin-bottom:12px;}
`

export default function App() {
  // ── Auth
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── 個人資料
  const [myName, setMyName] = useState('')
  const [myAvatar, setMyAvatar] = useState('🏸')

  // ── 畫面
  const [screen, setScreen] = useState('home')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // ── 球局列表
  const [sessions, setSessions] = useState([])

  // ── 目前球局
  const [currentSession, setCurrentSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [allAvail, setAllAvail] = useState([])
  const [myParticipantId, setMyParticipantId] = useState(null)
  const [myAvail, setMyAvail] = useState([])

  // ── 月曆
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  // ── 建立球局
  const [newTitle, setNewTitle] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')

  // ── 加入
  const [joinCode, setJoinCode] = useState('')

  // ── 預約
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingNote, setBookingNote] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)

  // ── 名字編輯
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500) }

  // ── Auth 監聽
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const meta = session.user.user_metadata
        setMyName(meta.full_name || meta.name || '')
        setMyAvatar(localStorage.getItem('bmt_avatar') || '🏸')
      }
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const meta = session.user.user_metadata
        setMyName(meta.full_name || meta.name || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (myAvatar) localStorage.setItem('bmt_avatar', myAvatar) }, [myAvatar])

  // ── URL join 參數
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const j = p.get('join')
    if (j) { setJoinCode(j); setScreen('join') }
  }, [])

  // ── Magic Link 登入
  const [emailInput, setEmailInput] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const sendMagicLink = async () => {
    if (!emailInput.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput.trim(),
      options: { emailRedirectTo: window.location.origin }
    })
    setLoading(false)
    if (error) { showToast('❌ 發送失敗，請確認 Email'); return }
    setMagicSent(true)
  }
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setSessions([]); setScreen('home'); setMagicSent(false); setEmailInput('')
  }

  // ── 讀取我的球局
  const loadSessions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('participants').select('session_id, sessions(*)')
      .eq('user_id', user.id)
    if (data) setSessions(data.map(d=>d.sessions).filter(Boolean).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))
  }, [user])

  useEffect(() => { loadSessions() }, [loadSessions])

  // ── 讀取球局詳情
  const loadSession = useCallback(async (sessionId) => {
    setLoading(true)
    const [{ data: sess }, { data: parts }, { data: avail }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('participants').select('*').eq('session_id', sessionId),
      supabase.from('availability').select('*').eq('session_id', sessionId),
    ])
    setCurrentSession(sess)
    setParticipants(parts||[])
    setAllAvail(avail||[])
    const me = parts?.find(p => p.user_id === user?.id)
    setMyParticipantId(me?.id||null)
    setMyAvail(avail?.filter(a=>a.participant_id===me?.id).map(a=>a.slot)||[])
    setLoading(false)
  }, [user])

  // ── 建立球局
  const createSession = async () => {
    if (!user || !myName.trim() || !newTitle.trim() || !newFrom || !newTo) return
    setLoading(true)
    const { data: sess } = await supabase.from('sessions').insert({
      title: newTitle, created_by: user.id,
      creator_name: myName, creator_avatar: myAvatar,
      date_from: newFrom, date_to: newTo,
    }).select().single()
    const { data: part } = await supabase.from('participants').insert({
      session_id: sess.id, user_id: user.id, name: myName, avatar: myAvatar,
    }).select().single()
    setMyParticipantId(part.id)
    setCurrentSession(sess); setParticipants([part]); setAllAvail([]); setMyAvail([])
    setLoading(false); loadSessions(); setScreen('fill')
  }

  // ── 加入球局
  const joinSession = async (sessionId) => {
    if (!user || !myName.trim()) return
    setLoading(true)
    const { data: existing } = await supabase.from('participants')
      .select('*').eq('session_id', sessionId).eq('user_id', user.id).single()
    if (existing) {
      await loadSession(sessionId); setScreen('fill'); setLoading(false); return
    }
    await supabase.from('participants').insert({
      session_id: sessionId, user_id: user.id, name: myName, avatar: myAvatar,
    })
    await loadSession(sessionId)
    setScreen('fill'); setLoading(false)
    window.history.replaceState({}, '', '/')
  }

  // ── 切換時段
  const toggleSlot = async (slot) => {
    if (!myParticipantId) return
    const has = myAvail.includes(slot)
    if (has) {
      await supabase.from('availability').delete().eq('participant_id', myParticipantId).eq('slot', slot)
      setMyAvail(p=>p.filter(s=>s!==slot))
      setAllAvail(p=>p.filter(a=>!(a.participant_id===myParticipantId&&a.slot===slot)))
    } else {
      const { data } = await supabase.from('availability').insert({
        session_id: currentSession.id, participant_id: myParticipantId, slot,
      }).select().single()
      setMyAvail(p=>[...p,slot]); setAllAvail(p=>[...p,data])
    }
  }

  // ── 計算重疊
  const getOverlap = (slot) => {
    const ids = allAvail.filter(a=>a.slot===slot).map(a=>a.participant_id)
    return participants.filter(p=>ids.includes(p.id))
  }

  const dates = currentSession ? getDates(currentSession.date_from, currentSession.date_to) : []
  const isCreator = currentSession && user && currentSession.created_by === user.id

  // ── 月曆資料
  const calDates = () => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth()
    const first = new Date(y, m, 1).getDay()
    const days = new Date(y, m+1, 0).getDate()
    return { first, days, y, m }
  }

  // ── 最佳時段
  const bestSlots = dates.flatMap(date => {
    const times = isWeekend(date) ? WEEKEND_TIMES : WEEKDAY_TIMES
    return times.map(t => `${date} ${t}`)
  }).map(slot => ({ slot, people: getOverlap(slot) }))
    .filter(x => x.people.length >= 2)
    .sort((a,b) => b.people.length - a.people.length)
    .slice(0, 10)

  // ── 確認球局
  const confirmSession = async (slot) => {
    await supabase.from('sessions').update({ status: 'confirmed', confirmed_slot: slot }).eq('id', currentSession.id)
    setCurrentSession(p => ({ ...p, status: 'confirmed', confirmed_slot: slot }))
    setSelectedSlot(slot); showToast('✅ 已確認時段！')
    loadSessions()
  }

  // ── 登記預約
  const submitBooking = async () => {
    const confirmedSlot = currentSession.confirmed_slot || selectedSlot
    await supabase.from('sessions').update({
      booking_status: 'booked',
      confirmed_by: myName,
      confirmed_slot: confirmedSlot,
      booking_note: bookingNote,
    }).eq('id', currentSession.id)
    setCurrentSession(p => ({ ...p, booking_status: 'booked', confirmed_by: myName, booking_note: bookingNote }))
    setShowBookingForm(false); showToast('🎉 預約登記成功！')
    loadSessions()
  }

  // ── 刪除球局
  const deleteSession = async () => {
    if (!window.confirm('確定要刪除這個球局嗎？')) return
    await supabase.from('sessions').delete().eq('id', currentSession.id)
    setScreen('home'); setCurrentSession(null); loadSessions()
    showToast('已刪除球局')
  }

  const shareUrl = currentSession ? `${window.location.origin}?join=${currentSession.id}` : ''

  // ══════════════════════════════════════════
  if (authLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0fdf4' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🏸</div>
        <div className="spinner" />
      </div>
    </div>
  )

  return (
    <div className="app">
      <style>{CSS}</style>
      {toast && <div className="toast">{toast}</div>}

      {/* ══ 登入頁 ══ */}
      {!user && screen !== 'join' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:32 }}>
          <div style={{ fontSize:72, marginBottom:16 }}>🏸</div>
          <div style={{ fontSize:28, fontWeight:900, color:'#15803d', marginBottom:6 }}>羽球揪團</div>
          <div style={{ color:'#64748b', fontSize:14, marginBottom:32, textAlign:'center' }}>
            和朋友找共同有空的時間<br />一起預約貓羅羽球館打球！
          </div>
          {!magicSent ? (
            <div style={{ width:'100%', maxWidth:320 }}>
              <div style={{ color:'#64748b', fontSize:13, marginBottom:10, textAlign:'center' }}>
                輸入你的 Email，我們寄一個登入連結給你
              </div>
              <input className="inp" style={{ marginBottom:12, textAlign:'center' }}
                type="email" value={emailInput} onChange={e=>setEmailInput(e.target.value)}
                placeholder="your@gmail.com"
                onKeyDown={e=>e.key==='Enter'&&sendMagicLink()} />
              <button className="btn-green" disabled={!emailInput.trim()||loading} onClick={sendMagicLink}>
                {loading ? '寄送中…' : '寄送登入連結 →'}
              </button>
              <p style={{ color:'#94a3b8', fontSize:11, marginTop:12, textAlign:'center' }}>
                免費使用，換手機也不怕資料消失
              </p>
            </div>
          ) : (
            <div style={{ textAlign:'center', maxWidth:300 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
              <div style={{ fontWeight:700, color:'#15803d', fontSize:18, marginBottom:8 }}>連結已寄出！</div>
              <div style={{ color:'#64748b', fontSize:14, marginBottom:20, lineHeight:1.6 }}>
                請去 <strong>{emailInput}</strong> 收信<br />
                點信裡的連結就會自動登入
              </div>
              <button className="btn-outline" style={{ fontSize:13 }} onClick={()=>setMagicSent(false)}>
                重新輸入 Email
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ 首頁 ══ */}
      {user && screen === 'home' && (
        <div className="fu">
          <div className="topbar">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div className="topbar-title">🏸 羽球揪團</div>
                <div className="topbar-sub">嗨，{myName || user.email} 👋</div>
              </div>
              <button onClick={() => setScreen('profile')}
                style={{ fontSize:32, background:'rgba(255,255,255,.2)', border:'none', borderRadius:'50%', width:46, height:46, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {myAvatar}
              </button>
            </div>
          </div>

          <div className="page">
            {/* 球局列表 */}
            {sessions.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div className="section-title">我的球局</div>
                {sessions.map(s => {
                  const isOwner = s.created_by === user.id
                  const statusTag = s.booking_status === 'booked'
                    ? <span className="tag-green">✅ 已預約</span>
                    : s.status === 'confirmed'
                    ? <span className="tag-blue">🎯 已確認</span>
                    : <span className="tag-orange">📝 填寫中</span>
                  return (
                    <div key={s.id} className="card" onClick={async () => { await loadSession(s.id); setSelectedDate(null); setScreen('fill') }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ color:'#1e293b', fontWeight:700, fontSize:15 }}>{s.title}</span>
                            {isOwner && <span className="tag-gray">👑 我建的</span>}
                          </div>
                          <div style={{ color:'#64748b', fontSize:12 }}>
                            {fmtDate(s.date_from)} ～ {fmtDate(s.date_to)}
                          </div>
                        </div>
                        {statusTag}
                      </div>
                      {s.booking_status === 'booked' && (
                        <div style={{ background:'#f0fdf4', borderRadius:10, padding:'8px 10px', fontSize:12, color:'#15803d', marginTop:4 }}>
                          🏟️ {s.confirmed_slot && fmtSlot(s.confirmed_slot)} · 由 {s.confirmed_by} 預約
                          {s.booking_note && <span style={{ color:'#64748b' }}> · {s.booking_note}</span>}
                        </div>
                      )}
                      {s.status === 'confirmed' && s.booking_status !== 'booked' && (
                        <div style={{ background:'#eff6ff', borderRadius:10, padding:'8px 10px', fontSize:12, color:'#1d4ed8', marginTop:4 }}>
                          🎯 確認時段：{s.confirmed_slot && fmtSlot(s.confirmed_slot)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {sessions.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏸</div>
                <div style={{ fontSize:14 }}>還沒有球局，發起一個吧！</div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button className="btn-green" onClick={() => { setNewTitle(''); setNewFrom(''); setNewTo(''); setScreen('create') }}>
                + 發起新球局
              </button>
              <button className="btn-outline" onClick={() => setScreen('join')}>
                加入朋友的球局
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ 個人資料 ══ */}
      {user && screen === 'profile' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => setScreen('home')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div className="topbar-title">我的資料</div>
          </div>
          <div className="page">
            <div style={{ textAlign:'center', marginBottom:24, paddingTop:8 }}>
              <div style={{ fontSize:64, marginBottom:12 }}>{myAvatar}</div>
              <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8 }}>
                {AVATARS.map(a => (
                  <button key={a} className={`av-btn ${myAvatar===a?'on':''}`} onClick={() => setMyAvatar(a)}>{a}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div className="section-title">暱 稱</div>
              {editingName ? (
                <div style={{ display:'flex', gap:8 }}>
                  <input className="inp" value={nameInput} onChange={e=>setNameInput(e.target.value)}
                    placeholder="輸入暱稱" maxLength={10} autoFocus
                    onKeyDown={e=>e.key==='Enter'&&nameInput.trim()&&(setMyName(nameInput.trim()),setEditingName(false))} />
                  <button className="btn-green" style={{ width:'auto', padding:'0 18px' }}
                    onClick={() => { if(nameInput.trim()) setMyName(nameInput.trim()); setEditingName(false) }}>確定</button>
                </div>
              ) : (
                <div onClick={() => { setNameInput(myName); setEditingName(true) }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'14px 16px', cursor:'pointer' }}>
                  <span style={{ color: myName?'#1e293b':'#94a3b8', fontSize:16, fontWeight:700 }}>
                    {myName || '點此設定暱稱'}
                  </span>
                  <span style={{ color:'#16a34a', fontSize:13 }}>✏️ 編輯</span>
                </div>
              )}
            </div>

            <div className="card-flat" style={{ marginBottom:20 }}>
              <div style={{ color:'#64748b', fontSize:13 }}>登入帳號</div>
              <div style={{ color:'#1e293b', fontWeight:600, marginTop:4 }}>{user.email}</div>
            </div>

            <button className="btn-red" onClick={signOut}>登出</button>
          </div>
        </div>
      )}

      {/* ══ 建立球局 ══ */}
      {user && screen === 'create' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => setScreen('home')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div className="topbar-title">發起新球局</div>
            <div className="topbar-sub">設定日期範圍，傳連結給朋友填時間</div>
          </div>
          <div className="page">
            <div style={{ marginBottom:16 }}>
              <div className="section-title">球局名稱</div>
              <input className="inp" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="例：五月球局、端午打球" />
            </div>
            <div style={{ marginBottom:20 }}>
              <div className="section-title">開放填寫的日期範圍</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="date" className="inp-date" value={newFrom} onChange={e=>setNewFrom(e.target.value)} />
                <span style={{ color:'#94a3b8' }}>～</span>
                <input type="date" className="inp-date" value={newTo} onChange={e=>setNewTo(e.target.value)} />
              </div>
              <p style={{ color:'#94a3b8', fontSize:12, marginTop:8 }}>💡 建議設 2～3 週</p>
            </div>
            <button className="btn-green" disabled={!newTitle.trim()||!newFrom||!newTo||loading} onClick={createSession}>
              {loading ? '建立中…' : '建立球局 →'}
            </button>
          </div>
        </div>
      )}

      {/* ══ 加入球局 ══ */}
      {screen === 'join' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => { setScreen(user?'home':'home'); window.history.replaceState({},'','/') }}
              style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div className="topbar-title">加入球局</div>
          </div>
          <div className="page">
            {!user ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
                <div style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>請先登入才能加入球局</div>
                <button className="btn-green" onClick={()=>setScreen('home')}>去登入</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:16 }}>
                  <div className="section-title">球局代碼</div>
                  <input className="inp" value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="貼上朋友傳來的代碼" />
                </div>
                <button className="btn-green" disabled={!joinCode.trim()||loading}
                  onClick={async () => { await joinSession(joinCode.trim()); window.history.replaceState({},'','/') }}>
                  {loading ? '加入中…' : '加入球局 →'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ 填寫空閒（月曆模式）══ */}
      {user && screen === 'fill' && currentSession && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => setScreen('home')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="topbar-title">{currentSession.title}</div>
                <div className="topbar-sub">{fmtDate(currentSession.date_from)} ～ {fmtDate(currentSession.date_to)}</div>
              </div>
              {isCreator && (
                <button className="btn-sm" style={{ background:'rgba(255,255,255,.25)', color:'#fff', border:'none', marginTop:4 }}
                  onClick={() => setScreen('admin')}>管理 ▶</button>
              )}
            </div>
          </div>

          <div className="page">
            {/* 預約狀態 */}
            {currentSession.booking_status === 'booked' && (
              <div className="booking-badge">
                <span style={{ fontSize:20 }}>🎉</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#854d0e' }}>已預約成功！</div>
                  <div style={{ fontSize:12, color:'#92400e' }}>
                    {currentSession.confirmed_slot && fmtSlot(currentSession.confirmed_slot)} · 由 {currentSession.confirmed_by} 預約
                    {currentSession.booking_note && ` · ${currentSession.booking_note}`}
                  </div>
                </div>
              </div>
            )}

            {/* 分享連結 */}
            <div className="share-box">
              <div style={{ color:'#15803d', fontSize:12, fontWeight:700, marginBottom:6 }}>📤 邀請朋友填時間</div>
              <div style={{ color:'#166534', fontSize:12, wordBreak:'break-all', marginBottom:8 }}>{shareUrl}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-sm" onClick={() => { navigator.clipboard.writeText(shareUrl); showToast('已複製連結！') }}>
                  複製連結
                </button>
                <button className="btn-sm" onClick={() => { navigator.clipboard.writeText(currentSession.id); showToast('已複製代碼！') }}>
                  複製代碼
                </button>
              </div>
            </div>

            {/* 參與者 */}
            <div style={{ display:'flex', gap:12, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
              {participants.map(p => {
                const count = allAvail.filter(a=>a.participant_id===p.id).length
                const isMe = p.user_id === user.id
                return (
                  <div key={p.id} style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:26, background: isMe?'#dcfce7':'#f8fafc', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{p.avatar}</div>
                    <div style={{ fontSize:10, color: isMe?'#15803d':'#64748b', marginTop:3, fontWeight: isMe?700:400 }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'#16a34a', marginTop:1 }}>{count>0?`${count}個`:'未填'}</div>
                  </div>
                )
              })}
            </div>

            {/* 月曆 */}
            {loading ? <div className="spinner" /> : (() => {
              const { first, days, y, m } = calDates()
              const today = new Date().toISOString().slice(0,10)
              return (
                <>
                  {/* 月份切換 */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <button className="btn-sm" onClick={() => setCalMonth(p => { const d=new Date(p); d.setMonth(d.getMonth()-1); return d })}>‹</button>
                    <span style={{ fontWeight:700, color:'#1e293b', fontSize:15 }}>{y}年{m+1}月</span>
                    <button className="btn-sm" onClick={() => setCalMonth(p => { const d=new Date(p); d.setMonth(d.getMonth()+1); return d })}>›</button>
                  </div>

                  {/* 週標題 */}
                  <div className="cal-header">
                    {['日','一','二','三','四','五','六'].map((d,i) => (
                      <div key={d} className={`cal-hd ${i===0||i===6?'we':''}`}>{d}</div>
                    ))}
                  </div>

                  {/* 日期格子 */}
                  <div className="cal-grid">
                    {Array(first).fill(null).map((_,i) => <div key={`e${i}`} className="cal-day empty" />)}
                    {Array(days).fill(null).map((_,i) => {
                      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                      const inRange = dates.includes(dateStr)
                      const isPast = dateStr < today
                      const times = isWeekend(dateStr) ? WEEKEND_TIMES : WEEKDAY_TIMES
                      const myCount = times.filter(t => myAvail.includes(`${dateStr} ${t}`)).length
                      const othersCount = times.filter(t => {
                        const slot = `${dateStr} ${t}`
                        return allAvail.some(a => a.slot===slot && a.participant_id!==myParticipantId)
                      }).length
                      const isSelected = selectedDate === dateStr

                      if (!inRange) return (
                        <div key={dateStr} className={`cal-day ${isPast?'past':''}`} style={{ background:'transparent', border:'none', cursor:'default' }}>
                          <span className="cal-day-num" style={{ color:'#cbd5e1', fontSize:13 }}>{i+1}</span>
                        </div>
                      )
                      return (
                        <div key={dateStr}
                          className={`cal-day ${myCount>0?'my-slot':othersCount>0?'has-slot':''} ${isPast?'past':''}`}
                          style={{ outline: isSelected?'2.5px solid #0ea5e9':'none', outlineOffset:1 }}
                          onClick={() => !isPast && setSelectedDate(isSelected?null:dateStr)}>
                          <span className="cal-day-num">{i+1}</span>
                          {(myCount>0||othersCount>0) && <div className="cal-day-dot" />}
                        </div>
                      )
                    })}
                  </div>

                  {/* 圖例 */}
                  <div style={{ display:'flex', gap:12, marginBottom:16, fontSize:11, color:'#64748b' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:12,height:12,borderRadius:3,background:'#16a34a' }} />我有空</div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:12,height:12,borderRadius:3,background:'#dcfce7',border:'1px solid #86efac' }} />別人有空</div>
                  </div>

                  {/* 選中日期的時段 */}
                  {selectedDate && (
                    <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:16, padding:16, marginBottom:16 }}>
                      <div style={{ fontWeight:700, color:'#1e293b', marginBottom:12 }}>
                        {fmtDate(selectedDate)}
                        <span style={{ color:'#64748b', fontSize:12, fontWeight:400, marginLeft:8 }}>
                          {isWeekend(selectedDate)?'週末':'平日下班後'}
                        </span>
                      </div>
                      <div className="time-grid">
                        {(isWeekend(selectedDate)?WEEKEND_TIMES:WEEKDAY_TIMES).map(t => {
                          const slot = `${selectedDate} ${t}`
                          const on = myAvail.includes(slot)
                          const overlap = getOverlap(slot).filter(p=>p.user_id!==user.id)
                          const cls = on ? 'on' : overlap.length>0 ? 'others' : ''
                          return (
                            <button key={t} className={`time-btn ${cls}`} onClick={() => toggleSlot(slot)}>
                              {t}
                              {overlap.length>0 && <span style={{ fontSize:10, marginLeft:4 }}>
                                {overlap.map(p=>p.avatar).join('')}
                              </span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}

            <button className="btn-green" onClick={() => setScreen('results')}>
              看大家的重疊時間 →
            </button>
          </div>
        </div>
      )}

      {/* ══ 結果頁 ══ */}
      {user && screen === 'results' && currentSession && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => setScreen('fill')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div className="topbar-title">最佳時段</div>
            <div className="topbar-sub">根據大家填的時間自動排序</div>
          </div>
          <div className="page">
            {/* 預約狀態顯示 */}
            {currentSession.booking_status === 'booked' && (
              <div className="booking-badge">
                <span style={{ fontSize:20 }}>🎉</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#854d0e' }}>已預約！</div>
                  <div style={{ fontSize:12, color:'#92400e' }}>
                    {currentSession.confirmed_slot && fmtSlot(currentSession.confirmed_slot)} · 由 {currentSession.confirmed_by} 預約
                    {currentSession.booking_note && ` · ${currentSession.booking_note}`}
                  </div>
                </div>
              </div>
            )}

            {bestSlots.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>😅</div>
                <div style={{ fontSize:14, marginBottom:16 }}>還沒有共同時段<br />叫朋友多填幾個！</div>
                <button className="btn-outline" onClick={() => setScreen('fill')}>回去填時間</button>
              </div>
            ) : (
              <>
                <div className="section-title">找到 {bestSlots.length} 個重疊時段</div>
                {bestSlots.map(({ slot, people }) => {
                  const [date, time] = slot.split(' ')
                  const isConfirmed = currentSession.confirmed_slot === slot
                  return (
                    <div key={slot} className={`card ${selectedSlot===slot||isConfirmed?'sel':''}`}
                      onClick={() => setSelectedSlot(slot)}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ color:'#1e293b', fontWeight:700, fontSize:15 }}>{fmtDate(date)} {time}</span>
                            {isConfirmed && <span className="tag-green">✅ 已確認</span>}
                          </div>
                          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                            {people.map((p,i) => <span key={i} style={{ fontSize:18 }}>{p.avatar}</span>)}
                            <span style={{ color:'#64748b', fontSize:11 }}>{people.map(p=>p.name).join('、')}</span>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', marginLeft:8 }}>
                          <div style={{ color:'#16a34a', fontWeight:900, fontSize:26 }}>{people.length}</div>
                          <div style={{ color:'#94a3b8', fontSize:11 }}>人有空</div>
                        </div>
                      </div>
                      <div className="overlap-bar">
                        <div className="overlap-fill" style={{ width:`${(people.length/participants.length)*100}%` }} />
                      </div>
                    </div>
                  )
                })}

                {/* 預約區塊 */}
                {selectedSlot && (
                  <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:16, padding:16, marginTop:8 }}>
                    <div style={{ fontWeight:700, color:'#15803d', marginBottom:12 }}>
                      🏟️ 前往預約貓羅羽球館
                    </div>
                    <div style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>
                      時段：<strong style={{ color:'#15803d' }}>{fmtSlot(selectedSlot)}</strong><br />
                      出席：{getOverlap(selectedSlot).map(p=>p.name).join('、')}
                    </div>

                    {!showBookingForm ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <a href={VENUE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                          <button className="btn-green" style={{ fontSize:14 }}>開啟貓羅球館預約頁 →</button>
                        </a>
                        <button className="btn-outline" style={{ fontSize:13 }} onClick={() => { setShowBookingForm(true); if(isCreator) confirmSession(selectedSlot) }}>
                          ✅ 我已完成預約，登記給大家看
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="section-title" style={{ marginBottom:8 }}>登記預約資訊</div>
                        <input className="inp" style={{ marginBottom:10 }} value={bookingNote}
                          onChange={e=>setBookingNote(e.target.value)}
                          placeholder="備註（例：已訂1號場 2小時）" />
                        <button className="btn-green" onClick={submitBooking}>確認登記</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ 發起人管理後台 ══ */}
      {user && screen === 'admin' && currentSession && isCreator && (
        <div className="fu">
          <div className="topbar">
            <button onClick={() => setScreen('fill')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', marginBottom:8, borderRadius:10, padding:'4px 10px' }}>←</button>
            <div className="topbar-title">👑 管理球局</div>
            <div className="topbar-sub">{currentSession.title}</div>
          </div>
          <div className="page">
            {/* 球局狀態 */}
            <div className="card-flat" style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#1e293b' }}>球局狀態</div>
                  <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>
                    {fmtDate(currentSession.date_from)} ～ {fmtDate(currentSession.date_to)}
                  </div>
                </div>
                {currentSession.booking_status==='booked'
                  ? <span className="tag-green">✅ 已預約</span>
                  : currentSession.status==='confirmed'
                  ? <span className="tag-blue">🎯 已確認</span>
                  : <span className="tag-orange">📝 填寫中</span>
                }
              </div>
              {currentSession.booking_status==='booked' && (
                <div style={{ marginTop:10, fontSize:13, color:'#15803d', background:'#f0fdf4', borderRadius:10, padding:'8px 12px' }}>
                  🏟️ {fmtSlot(currentSession.confirmed_slot)} · 由 {currentSession.confirmed_by} 預約<br />
                  {currentSession.booking_note && <span style={{ color:'#64748b' }}>{currentSession.booking_note}</span>}
                </div>
              )}
            </div>

            {/* 出席狀況 */}
            <div style={{ marginBottom:20 }}>
              <div className="section-title">出席狀況（{participants.length} 人）</div>
              {participants.map(p => {
                const count = allAvail.filter(a=>a.participant_id===p.id).length
                const isMe = p.user_id === user.id
                return (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'12px 14px', marginBottom:8 }}>
                    <span style={{ fontSize:26 }}>{p.avatar}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>
                        {p.name} {isMe && <span style={{ color:'#16a34a', fontSize:11 }}>（我）</span>}
                      </div>
                      <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>
                        {count>0 ? `已填 ${count} 個時段` : '⚠️ 還沒填！記得催他'}
                      </div>
                    </div>
                    {count>0
                      ? <span className="tag-green">{count} 個</span>
                      : <span className="tag-red">未填</span>
                    }
                  </div>
                )
              })}
            </div>

            {/* 最佳時段快覽 */}
            {bestSlots.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div className="section-title">最佳時段快覽</div>
                {bestSlots.slice(0,3).map(({ slot, people }) => (
                  <div key={slot} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#15803d', fontSize:14 }}>{fmtSlot(slot)}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{people.map(p=>p.name).join('、')}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ color:'#16a34a', fontWeight:900, fontSize:20 }}>{people.length}</span>
                      <span style={{ color:'#94a3b8', fontSize:11 }}>/{participants.length}人</span>
                    </div>
                  </div>
                ))}
                <button className="btn-outline" style={{ fontSize:13, marginTop:4 }} onClick={() => setScreen('results')}>
                  查看全部時段並確認 →
                </button>
              </div>
            )}

            <div className="divider" />

            {/* 刪除球局 */}
            <button className="btn-red" onClick={deleteSession}>🗑️ 刪除此球局</button>
          </div>
        </div>
      )}

      {/* 底部導航 */}
      {user && ['home','results','admin'].includes(screen) && (
        <div className="nav">
          {[
            { icon:'🏠', label:'首頁', key:'home' },
            { icon:'🏸', label:'時段', key:'results' },
            { icon:'👑', label:'管理', key:'admin', hide: !isCreator },
          ].filter(n => !n.hide).map(n => (
            <button key={n.key} className={`nb ${screen===n.key?'on':''}`} onClick={() => setScreen(n.key)}>
              <div>{n.icon}</div>
              <div className="nb-lbl">{n.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
