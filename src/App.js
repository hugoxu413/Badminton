import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

const AVATARS = ['🏸','😊','🐼','🦊','🐱','🐻','🐯','🐸','🦁','🐺','🐧','🦄','🐙','🦋','🐨','🐮']
const WEEKDAY_TIMES = ['19:00','20:00','21:00']
const WEEKEND_TIMES = ['09:00','10:00','11:00','14:00','15:00','19:00','20:00']
const DAYS_ZH = ['日','一','二','三','四','五','六']
const VENUES = ['貓羅羽球館','其他球館','待確認']

function getDates(from, to) {
  const dates = [], cur = new Date(from), end = new Date(to)
  while (cur <= end) { dates.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1) }
  return dates
}
function isWeekend(d) { const day = new Date(d+'T00:00:00').getDay(); return day===0||day===6 }
function dayZh(d) { return '週'+DAYS_ZH[new Date(d+'T00:00:00').getDay()] }
function fmtDate(d) { const x=new Date(d+'T00:00:00'); return `${x.getMonth()+1}/${x.getDate()}(${dayZh(d)})` }
function fmtSlot(slot) { if(!slot) return ''; const [d,t]=slot.split(' '); return `${fmtDate(d)} ${t}` }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#f0fdf4;font-family:'Noto Sans TC','PingFang TC',sans-serif;}
  ::-webkit-scrollbar{display:none;}
  #root{display:flex;justify-content:center;min-height:100%;}
  .app{width:100%;max-width:430px;min-height:100vh;background:#fff;position:relative;padding-bottom:80px;box-shadow:0 0 30px rgba(0,0,0,.07);}
  .page{padding:16px 16px 24px;}
  .topbar{background:linear-gradient(135deg,#16a34a,#0ea5e9);padding:52px 16px 16px;color:#fff;}
  .topbar-title{font-size:22px;font-weight:900;}
  .topbar-sub{font-size:13px;opacity:.8;margin-top:2px;}
  .btn-green{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;box-shadow:0 4px 12px rgba(22,163,74,.3);transition:all .15s;}
  .btn-green:active{transform:scale(.98);}
  .btn-green:disabled{opacity:.4;cursor:not-allowed;box-shadow:none;}
  .btn-blue{background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;box-shadow:0 4px 12px rgba(14,165,233,.3);transition:all .15s;}
  .btn-outline{background:#fff;color:#16a34a;border:2px solid #16a34a;border-radius:14px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
  .btn-red{background:#fff;color:#ef4444;border:2px solid #fecaca;border-radius:12px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
  .btn-sm{background:#f0fdf4;color:#16a34a;border:1.5px solid #bbf7d0;border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
  .btn-gray{background:#f1f5f9;color:#64748b;border:none;border-radius:10px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
  .inp{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;color:#1e293b;font-size:15px;font-family:inherit;padding:12px 14px;width:100%;outline:none;transition:border-color .2s;}
  .inp:focus{border-color:#16a34a;background:#fff;}
  .inp-date{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;color:#1e293b;font-size:14px;font-family:inherit;padding:11px 12px;outline:none;flex:1;}
  .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:15px;margin-bottom:10px;cursor:pointer;transition:all .15s;}
  .card:hover{border-color:#16a34a;box-shadow:0 4px 16px rgba(22,163,74,.1);}
  .card.sel{border-color:#16a34a;background:#f0fdf4;}
  .card-flat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:10px;}
  .tag-green{display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#15803d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-blue{display:inline-flex;align-items:center;gap:4px;background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-orange{display:inline-flex;align-items:center;gap:4px;background:#ffedd5;color:#c2410c;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .tag-gray{display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;color:#64748b;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:8px;}
  .cal-hd{text-align:center;font-size:11px;font-weight:700;color:#94a3b8;padding:4px 0;}
  .cal-hd.we{color:#ef4444;}
  .cal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:#f8fafc;}
  .cal-day:hover{border-color:#16a34a;background:#f0fdf4;}
  .cal-day.has-avail{background:#dcfce7;border-color:#86efac;}
  .cal-day.out-range{background:transparent;border-color:transparent;cursor:default;}
  .cal-day.past{opacity:.3;cursor:not-allowed;}
  .cal-day.selected{border-color:#0ea5e9 !important;background:#eff6ff !important;outline:2px solid #0ea5e9;outline-offset:1px;}
  .cal-day-num{font-size:13px;font-weight:700;color:#1e293b;}
  .cal-day.out-range .cal-day-num{color:#e2e8f0;}
  .cal-dot{width:5px;height:5px;border-radius:50%;background:#16a34a;margin-top:1px;}
  .time-btn{border:1.5px solid #e2e8f0;background:#f8fafc;color:#64748b;border-radius:10px;padding:9px 12px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .15s;}
  .time-btn:hover{border-color:#16a34a;}
  .time-btn.on{border-color:#16a34a;background:#16a34a;color:#fff;}
  .time-btn.others{border-color:#86efac;background:#f0fdf4;color:#15803d;}
  .nav{display:flex;border-top:1px solid #e2e8f0;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:#fff;z-index:99;}
  .nb{flex:1;padding:10px 0 14px;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;font-family:inherit;}
  .nb.on{color:#16a34a;}
  .nb-lbl{font-size:10px;margin-top:2px;color:inherit;}
  .section-title{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;}
  .av-btn{font-size:20px;background:#f8fafc;border:2px solid transparent;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
  .av-btn.on{border-color:#16a34a;background:#dcfce7;}
  .share-box{background:#f0fdf4;border:1.5px dashed #86efac;border-radius:14px;padding:12px;margin-bottom:14px;}
  .overlap-bar{height:6px;background:#e2e8f0;border-radius:3px;margin-top:8px;overflow:hidden;}
  .overlap-fill{height:100%;background:linear-gradient(90deg,#16a34a,#0ea5e9);border-radius:3px;transition:width .3s;}
  .spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#16a34a;border-radius:50%;animation:spin .7s linear infinite;margin:20px auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fu{animation:fu .3s ease forwards;}
  .toast{position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(22,163,74,.4);}
  .member-chip{display:inline-flex;align-items:center;gap:6px;border:2px solid #e2e8f0;border-radius:20px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:700;color:#64748b;background:#f8fafc;transition:all .15s;}
  .member-chip.on{border-color:#16a34a;background:#dcfce7;color:#15803d;}
  .divider{height:1px;background:#f1f5f9;margin:16px 0;}
  select.inp{cursor:pointer;}
`

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [screen, setScreen] = useState('home')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [myName, setMyName] = useState('')
  const [myAvatar, setMyAvatar] = useState('🏸')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [myMembers, setMyMembers] = useState([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberAvatar, setNewMemberAvatar] = useState('😊')
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [allMembers, setAllMembers] = useState([])
  const [allAvail, setAllAvail] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [newVenue, setNewVenue] = useState('貓羅羽球館')
  const [joinCode, setJoinCode] = useState('')
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [fillingMemberId, setFillingMemberId] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingNote, setBookingNote] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const j = p.get('join')
    if (j) { setJoinCode(j); setScreen('join') }
  }, [])

  const doLogin = async () => {
    setAuthError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    setLoading(false)
    if (error) setAuthError('Email 或密碼錯誤，請確認後再試')
  }

  const doRegister = async () => {
    setAuthError(''); setLoading(true)
    if (!myName.trim()) { setAuthError('請輸入暱稱'); setLoading(false); return }
    if (authPassword.length < 6) { setAuthError('密碼至少需要6個字'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({
      email: authEmail, password: authPassword,
      options: { data: { name: myName, avatar: myAvatar } }
    })
    if (error) { setAuthError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('members').insert({ user_id: data.user.id, name: myName, avatar: myAvatar, is_self: true })
    }
    setLoading(false)
    showToast('註冊成功！')
  }

  const doLogout = async () => {
    await supabase.auth.signOut(); setUser(null); setSessions([]); setScreen('home')
  }

  const loadMyMembers = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('members').select('*').eq('user_id', user.id).order('created_at')
    if (data) {
      setMyMembers(data)
      const self = data.find(m => m.is_self)
      if (self) { setMyName(self.name); setMyAvatar(self.avatar) }
    }
  }, [user])

  useEffect(() => { loadMyMembers() }, [loadMyMembers])

  const loadSessions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('session_users').select('session_id, sessions(*)').eq('user_id', user.id)
    if (data) setSessions(data.map(d=>d.sessions).filter(Boolean).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))
  }, [user])

  useEffect(() => { loadSessions() }, [loadSessions])

  const loadSession = useCallback(async (sessionId) => {
    setLoading(true)
    const [{ data: sess }, { data: su }, { data: avail }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('session_users').select('user_id').eq('session_id', sessionId),
      supabase.from('availability').select('*').eq('session_id', sessionId),
    ])
    const userIds = (su||[]).map(u=>u.user_id)
    const { data: mems } = await supabase.from('members').select('*').in('user_id', userIds)
    setCurrentSession(sess)
    setAllMembers(mems||[])
    setAllAvail(avail||[])
    setLoading(false)
  }, [])

  const joinSession = async (sessionId) => {
    if (!user) return
    setLoading(true)
    const { data: existing } = await supabase.from('session_users')
      .select('id').eq('session_id', sessionId).eq('user_id', user.id).single()
    if (!existing) {
      await supabase.from('session_users').insert({ session_id: sessionId, user_id: user.id })
    }
    await loadSession(sessionId)
    setScreen('fill'); setLoading(false)
    window.history.replaceState({}, '', '/')
  }

  const createSession = async () => {
    if (!user || !newTitle.trim() || !newFrom || !newTo) return
    setLoading(true)
    const { data: sess } = await supabase.from('sessions').insert({
      title: newTitle, created_by: user.id, creator_name: myName,
      date_from: newFrom, date_to: newTo, venue: newVenue,
    }).select().single()
    await supabase.from('session_users').insert({ session_id: sess.id, user_id: user.id })
    await loadSession(sess.id)
    setLoading(false); loadSessions(); setScreen('fill')
  }

  const toggleSlot = async (slot, memberId, memberName) => {
    if (!currentSession) return
    const has = allAvail.some(a => a.session_id===currentSession.id && a.member_id===memberId && a.slot===slot)
    if (has) {
      await supabase.from('availability').delete()
        .eq('session_id', currentSession.id).eq('member_id', memberId).eq('slot', slot)
      setAllAvail(p => p.filter(a => !(a.member_id===memberId && a.slot===slot)))
    } else {
      const { data } = await supabase.from('availability').insert({
        session_id: currentSession.id, member_id: memberId,
        member_name: memberName, slot, filled_by: user.id,
      }).select().single()
      if (data) setAllAvail(p => [...p, data])
    }
  }

  const dates = currentSession ? getDates(currentSession.date_from, currentSession.date_to) : []

  const bestSlots = dates.flatMap(date => {
    const times = isWeekend(date) ? WEEKEND_TIMES : WEEKDAY_TIMES
    return times.map(t => `${date} ${t}`)
  }).map(slot => {
    const people = allAvail.filter(a => a.slot === slot)
    const unique = [...new Map(people.map(p => [p.member_name, p])).values()]
    return { slot, people: unique, count: unique.length }
  }).filter(x => x.count >= 2)
    .sort((a,b) => b.count - a.count)
    .slice(0, 5)

  const mySessionMembers = allMembers.filter(m => m.user_id === user?.id)

  const calDates = () => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth()
    const first = new Date(y, m, 1).getDay()
    const days = new Date(y, m+1, 0).getDate()
    return { first, days, y, m }
  }

  const confirmSession = async (slot) => {
    await supabase.from('sessions').update({ status:'confirmed', confirmed_slot: slot }).eq('id', currentSession.id)
    setCurrentSession(p => ({ ...p, status:'confirmed', confirmed_slot: slot }))
    setSelectedSlot(slot); showToast('已確認時段！'); loadSessions()
  }

  const submitBooking = async () => {
    const slot = currentSession.confirmed_slot || selectedSlot
    await supabase.from('sessions').update({
      booking_status: 'booked', confirmed_by: myName,
      confirmed_slot: slot, booking_note: bookingNote,
    }).eq('id', currentSession.id)
    setCurrentSession(p => ({ ...p, booking_status:'booked', confirmed_by: myName, booking_note: bookingNote }))
    setShowBookingForm(false); showToast('預約登記成功！'); loadSessions()
  }

  const deleteSession = async () => {
    if (!window.confirm('確定刪除這個球局？')) return
    await supabase.from('sessions').delete().eq('id', currentSession.id)
    setScreen('home'); setCurrentSession(null); loadSessions(); showToast('已刪除球局')
  }

  const shareUrl = currentSession ? `${window.location.origin}?join=${currentSession.id}` : ''

  if (authLoading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#f0fdf4'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>🏸</div><div className="spinner"/></div>
    </div>
  )

  return (
    <div className="app">
      <style>{CSS}</style>
      {toast && <div className="toast">{toast}</div>}

      {/* 登入/註冊 */}
      {!user && screen !== 'join' && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:28}}>
          <div style={{fontSize:64,marginBottom:12}}>🏸</div>
          <div style={{fontSize:26,fontWeight:900,color:'#15803d',marginBottom:4}}>羽球揪團</div>
          <div style={{color:'#64748b',fontSize:13,marginBottom:24,textAlign:'center'}}>和朋友找共同有空的時間打球！</div>
          <div style={{width:'100%',maxWidth:340}}>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <button className={authMode==='login'?'btn-green':'btn-outline'} style={{fontSize:14}} onClick={()=>setAuthMode('login')}>登入</button>
              <button className={authMode==='register'?'btn-green':'btn-outline'} style={{fontSize:14}} onClick={()=>setAuthMode('register')}>註冊</button>
            </div>
            {authMode==='register' && (
              <>
                <div className="section-title">暱稱 + 頭像</div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{fontSize:34}}>{myAvatar}</div>
                  <input className="inp" value={myName} onChange={e=>setMyName(e.target.value)} placeholder="你的暱稱" maxLength={10}/>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
                  {AVATARS.map(a=><button key={a} className={`av-btn ${myAvatar===a?'on':''}`} onClick={()=>setMyAvatar(a)}>{a}</button>)}
                </div>
              </>
            )}
            <div className="section-title">Email</div>
            <input className="inp" style={{marginBottom:10}} type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="your@email.com"/>
            <div className="section-title">密碼（至少6字）</div>
            <input className="inp" style={{marginBottom:16}} type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="••••••"
              onKeyDown={e=>e.key==='Enter'&&(authMode==='login'?doLogin():doRegister())}/>
            {authError && <div style={{color:'#ef4444',fontSize:13,marginBottom:10,textAlign:'center'}}>{authError}</div>}
            <button className="btn-green" disabled={!authEmail||!authPassword||loading} onClick={authMode==='login'?doLogin:doRegister}>
              {loading?'處理中…':authMode==='login'?'登入':'註冊'}
            </button>
          </div>
        </div>
      )}

      {/* 加入球局 */}
      {screen==='join' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={()=>{setScreen('home');window.history.replaceState({},'','/')}} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',marginBottom:8,borderRadius:10,padding:'4px 10px'}}>←</button>
            <div className="topbar-title">加入球局</div>
          </div>
          <div className="page">
            {!user ? (
              <div style={{textAlign:'center',padding:'32px 0'}}>
                <div style={{fontSize:40,marginBottom:12}}>🔐</div>
                <div style={{color:'#64748b',fontSize:14,marginBottom:20}}>請先登入才能加入球局</div>
                <button className="btn-green" onClick={()=>setScreen('home')}>去登入 / 註冊</button>
              </div>
            ) : (
              <>
                <div style={{marginBottom:16}}>
                  <div className="section-title">球局代碼</div>
                  <input className="inp" value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="貼上朋友傳來的代碼"/>
                </div>
                <button className="btn-green" disabled={!joinCode.trim()||loading} onClick={()=>joinSession(joinCode.trim())}>
                  {loading?'加入中…':'加入球局 →'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 首頁 */}
      {user && screen==='home' && (
        <div className="fu">
          <div className="topbar">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div><div className="topbar-title">🏸 羽球揪團</div><div className="topbar-sub">嗨，{myName} 👋</div></div>
              <button onClick={()=>setScreen('profile')} style={{fontSize:28,background:'rgba(255,255,255,.2)',border:'none',borderRadius:'50%',width:42,height:42,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{myAvatar}</button>
            </div>
          </div>
          <div className="page">
            {sessions.length>0 && (
              <div style={{marginBottom:20}}>
                <div className="section-title">球局列表</div>
                {sessions.map(s=>(
                  <div key={s.id} className="card" onClick={async()=>{await loadSession(s.id);setSelectedDate(null);setSelectedSlot(null);setShowBookingForm(false);setScreen('fill')}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,color:'#1e293b',fontSize:15,marginBottom:2}}>{s.title}</div>
                        <div style={{color:'#64748b',fontSize:12}}>📍 {s.venue}</div>
                        <div style={{color:'#94a3b8',fontSize:11}}>{fmtDate(s.date_from)} ～ {fmtDate(s.date_to)}</div>
                      </div>
                      <div style={{marginLeft:8,flexShrink:0}}>
                        {s.booking_status==='booked'?<span className="tag-green">✅ 已預約</span>
                        :s.status==='confirmed'?<span className="tag-blue">🎯 已確認</span>
                        :<span className="tag-orange">📝 填寫中</span>}
                      </div>
                    </div>
                    {s.booking_status==='booked'&&<div style={{background:'#f0fdf4',borderRadius:10,padding:'7px 10px',fontSize:12,color:'#15803d'}}>{fmtSlot(s.confirmed_slot)} · {s.confirmed_by} 預約{s.booking_note&&` · ${s.booking_note}`}</div>}
                    {s.status==='confirmed'&&s.booking_status!=='booked'&&<div style={{background:'#eff6ff',borderRadius:10,padding:'7px 10px',fontSize:12,color:'#1d4ed8'}}>確認時段：{fmtSlot(s.confirmed_slot)}</div>}
                  </div>
                ))}
              </div>
            )}
            {sessions.length===0&&<div style={{textAlign:'center',padding:'32px 0',color:'#94a3b8'}}><div style={{fontSize:48,marginBottom:12}}>🏸</div><div style={{fontSize:14}}>還沒有球局，發起一個吧！</div></div>}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button className="btn-green" onClick={()=>{setNewTitle('');setNewFrom('');setNewTo('');setNewVenue('貓羅羽球館');setScreen('create')}}>+ 發起新球局</button>
              <button className="btn-outline" onClick={()=>setScreen('join')}>加入朋友的球局</button>
            </div>
          </div>
        </div>
      )}

      {/* 個人資料 */}
      {user && screen==='profile' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={()=>setScreen('home')} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',marginBottom:8,borderRadius:10,padding:'4px 10px'}}>←</button>
            <div className="topbar-title">我的資料</div>
          </div>
          <div className="page">
            <div style={{textAlign:'center',marginBottom:18,paddingTop:4}}>
              <div style={{fontSize:52,marginBottom:8}}>{myAvatar}</div>
              <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:5}}>
                {AVATARS.map(a=><button key={a} className={`av-btn ${myAvatar===a?'on':''}`} onClick={async()=>{setMyAvatar(a);const self=myMembers.find(m=>m.is_self);if(self)await supabase.from('members').update({avatar:a}).eq('id',self.id)}}>{a}</button>)}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div className="section-title">我的暱稱</div>
              {editingName?(
                <div style={{display:'flex',gap:8}}>
                  <input className="inp" value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="輸入暱稱" maxLength={10} autoFocus/>
                  <button className="btn-green" style={{width:'auto',padding:'0 16px'}} onClick={async()=>{
                    if(!nameInput.trim())return
                    const self=myMembers.find(m=>m.is_self)
                    if(self)await supabase.from('members').update({name:nameInput.trim()}).eq('id',self.id)
                    setMyName(nameInput.trim());setEditingName(false);loadMyMembers()
                  }}>確定</button>
                </div>
              ):(
                <div onClick={()=>{setNameInput(myName);setEditingName(true)}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:14,padding:'13px 16px',cursor:'pointer'}}>
                  <span style={{color:'#1e293b',fontSize:16,fontWeight:700}}>{myName}</span>
                  <span style={{color:'#16a34a',fontSize:13}}>✏️ 編輯</span>
                </div>
              )}
            </div>
            <div className="divider"/>
            <div style={{marginBottom:18}}>
              <div className="section-title">附屬成員（可幫他們代填）</div>
              {myMembers.filter(m=>!m.is_self).map(m=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:14,padding:'10px 14px',marginBottom:8}}>
                  <span style={{fontSize:22}}>{m.avatar}</span>
                  <span style={{flex:1,fontWeight:600,color:'#1e293b'}}>{m.name}</span>
                  <button className="btn-gray" onClick={async()=>{await supabase.from('members').delete().eq('id',m.id);loadMyMembers()}}>移除</button>
                </div>
              ))}
              <div style={{background:'#f8fafc',border:'1.5px dashed #e2e8f0',borderRadius:14,padding:12}}>
                <div style={{color:'#64748b',fontSize:12,marginBottom:8}}>+ 新增附屬成員</div>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <span style={{fontSize:26}}>{newMemberAvatar}</span>
                  <input className="inp" value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="成員暱稱" maxLength={10}/>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                  {AVATARS.map(a=><button key={a} className={`av-btn ${newMemberAvatar===a?'on':''}`} style={{width:34,height:34,fontSize:17}} onClick={()=>setNewMemberAvatar(a)}>{a}</button>)}
                </div>
                <button className="btn-sm" disabled={!newMemberName.trim()} onClick={async()=>{
                  await supabase.from('members').insert({user_id:user.id,name:newMemberName.trim(),avatar:newMemberAvatar,is_self:false})
                  setNewMemberName('');setNewMemberAvatar('😊');loadMyMembers();showToast(`已新增 ${newMemberName}`)
                }}>新增成員</button>
              </div>
            </div>
            <div className="divider"/>
            <div style={{color:'#94a3b8',fontSize:12,marginBottom:8}}>帳號：{user.email}</div>
            <button className="btn-red" onClick={doLogout}>登出</button>
          </div>
        </div>
      )}

      {/* 建立球局 */}
      {user && screen==='create' && (
        <div className="fu">
          <div className="topbar">
            <button onClick={()=>setScreen('home')} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',marginBottom:8,borderRadius:10,padding:'4px 10px'}}>←</button>
            <div className="topbar-title">發起新球局</div>
          </div>
          <div className="page">
            <div style={{marginBottom:14}}><div className="section-title">球局名稱</div><input className="inp" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="例：五月球局"/></div>
            <div style={{marginBottom:14}}><div className="section-title">地點</div><select className="inp" value={newVenue} onChange={e=>setNewVenue(e.target.value)}>{VENUES.map(v=><option key={v}>{v}</option>)}</select></div>
            <div style={{marginBottom:20}}>
              <div className="section-title">開放日期範圍</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="date" className="inp-date" value={newFrom} onChange={e=>setNewFrom(e.target.value)}/>
                <span style={{color:'#94a3b8'}}>～</span>
                <input type="date" className="inp-date" value={newTo} onChange={e=>setNewTo(e.target.value)}/>
              </div>
              <p style={{color:'#94a3b8',fontSize:12,marginTop:6}}>💡 建議設 2～3 週</p>
            </div>
            <button className="btn-green" disabled={!newTitle.trim()||!newFrom||!newTo||loading} onClick={createSession}>{loading?'建立中…':'建立球局 →'}</button>
          </div>
        </div>
      )}

      {/* 填時間 */}
      {user && screen==='fill' && currentSession && (
        <div className="fu">
          <div className="topbar">
            <button onClick={()=>setScreen('home')} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',marginBottom:8,borderRadius:10,padding:'4px 10px'}}>←</button>
            <div className="topbar-title">{currentSession.title}</div>
            <div className="topbar-sub">📍 {currentSession.venue} · {fmtDate(currentSession.date_from)} ～ {fmtDate(currentSession.date_to)}</div>
          </div>
          <div className="page">
            {currentSession.booking_status==='booked'&&(
              <div style={{background:'#fefce8',border:'1px solid #fde047',borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:18}}>🎉</span>
                <div><div style={{fontWeight:700,fontSize:13,color:'#854d0e'}}>已預約！</div><div style={{fontSize:12,color:'#92400e'}}>{fmtSlot(currentSession.confirmed_slot)} · {currentSession.confirmed_by}{currentSession.booking_note&&` · ${currentSession.booking_note}`}</div></div>
              </div>
            )}
            <div className="share-box">
              <div style={{color:'#15803d',fontSize:12,fontWeight:700,marginBottom:6}}>📤 邀請朋友加入</div>
              <div style={{color:'#166534',fontSize:11,wordBreak:'break-all',marginBottom:8}}>{shareUrl}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-sm" onClick={()=>{navigator.clipboard.writeText(shareUrl);showToast('已複製連結！')}}>複製連結</button>
                <button className="btn-sm" onClick={()=>{navigator.clipboard.writeText(currentSession.id);showToast('已複製代碼！')}}>複製代碼</button>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div className="section-title">幫誰填時間（可切換）</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {mySessionMembers.map(m=>(
                  <button key={m.id} className={`member-chip ${fillingMemberId===m.id?'on':''}`} onClick={()=>setFillingMemberId(fillingMemberId===m.id?null:m.id)}>
                    {m.avatar} {m.name} {allAvail.some(a=>a.member_id===m.id)&&<span>✓</span>}
                  </button>
                ))}
              </div>
              {!fillingMemberId&&<p style={{color:'#f59e0b',fontSize:12,marginTop:6}}>⚠️ 請先點選要幫誰填</p>}
              {fillingMemberId&&<p style={{color:'#16a34a',fontSize:12,marginTop:6}}>正在幫 <strong>{mySessionMembers.find(m=>m.id===fillingMemberId)?.name}</strong> 填 · 點日期選時段</p>}
            </div>
            {loading?<div className="spinner"/>:(()=>{
              const {first,days,y,m}=calDates()
              const today=new Date().toISOString().slice(0,10)
              return (
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <button className="btn-sm" onClick={()=>setCalMonth(p=>{const d=new Date(p);d.setMonth(d.getMonth()-1);return d})}>‹</button>
                    <span style={{fontWeight:700,color:'#1e293b',fontSize:15}}>{y}年{m+1}月</span>
                    <button className="btn-sm" onClick={()=>setCalMonth(p=>{const d=new Date(p);d.setMonth(d.getMonth()+1);return d})}>›</button>
                  </div>
                  <div className="cal-grid">
                    {['日','一','二','三','四','五','六'].map((d,i)=><div key={d} className={`cal-hd ${i===0||i===6?'we':''}`}>{d}</div>)}
                  </div>
                  <div className="cal-grid">
                    {Array(first).fill(null).map((_,i)=><div key={`e${i}`} className="cal-day out-range" style={{background:'transparent',border:'none'}}/>)}
                    {Array(days).fill(null).map((_,i)=>{
                      const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
                      const inRange=dates.includes(dateStr)
                      const isPast=dateStr<today
                      const myIds=mySessionMembers.map(m=>m.id)
                      const hasMyAvail=allAvail.some(a=>myIds.includes(a.member_id)&&a.slot.startsWith(dateStr))
                      const isSelected=selectedDate===dateStr
                      if(!inRange)return <div key={dateStr} className="cal-day out-range"><span className="cal-day-num" style={{color:'#e2e8f0',fontSize:12}}>{i+1}</span></div>
                      return (
                        <div key={dateStr} className={`cal-day ${hasMyAvail?'has-avail':''} ${isPast?'past':''} ${isSelected?'selected':''}`}
                          onClick={()=>!isPast&&fillingMemberId&&setSelectedDate(isSelected?null:dateStr)}>
                          <span className="cal-day-num">{i+1}</span>
                          {hasMyAvail&&<div className="cal-dot"/>}
                        </div>
                      )
                    })}
                  </div>
                  {selectedDate&&fillingMemberId&&(()=>{
                    const member=mySessionMembers.find(m=>m.id===fillingMemberId)
                    const times=isWeekend(selectedDate)?WEEKEND_TIMES:WEEKDAY_TIMES
                    return (
                      <div style={{background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:16,padding:16,marginBottom:14}}>
                        <div style={{fontWeight:700,color:'#1e293b',marginBottom:4}}>{fmtDate(selectedDate)}</div>
                        <div style={{color:'#64748b',fontSize:12,marginBottom:10}}>幫 {member?.name} 選有空的時段</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                          {times.map(t=>{
                            const slot=`${selectedDate} ${t}`
                            const on=allAvail.some(a=>a.member_id===fillingMemberId&&a.slot===slot)
                            const others=allAvail.filter(a=>a.slot===slot&&a.member_id!==fillingMemberId).length
                            return <button key={t} className={`time-btn ${on?'on':others>0?'others':''}`} onClick={()=>toggleSlot(slot,fillingMemberId,member?.name||'')}>
                              {t}{others>0&&!on&&<span style={{fontSize:10,marginLeft:3}}>+{others}</span>}
                            </button>
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </>
              )
            })()}
            <button className="btn-green" style={{marginTop:8}} onClick={()=>setScreen('results')}>看大家的重疊時間 →</button>
          </div>
        </div>
      )}

      {/* 結果 */}
      {user && screen==='results' && currentSession && (
        <div className="fu">
          <div className="topbar">
            <button onClick={()=>setScreen('fill')} style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',marginBottom:8,borderRadius:10,padding:'4px 10px'}}>←</button>
            <div className="topbar-title">最佳時段</div>
            <div className="topbar-sub">📍 {currentSession.venue}</div>
          </div>
          <div className="page">
            {currentSession.booking_status==='booked'&&(
              <div style={{background:'#fefce8',border:'1px solid #fde047',borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',gap:8}}>
                <span style={{fontSize:18}}>🎉</span>
                <div><div style={{fontWeight:700,fontSize:13,color:'#854d0e'}}>已預約！</div><div style={{fontSize:12,color:'#92400e'}}>{fmtSlot(currentSession.confirmed_slot)} · {currentSession.confirmed_by}{currentSession.booking_note&&` · ${currentSession.booking_note}`}</div></div>
              </div>
            )}
            <div style={{display:'flex',gap:10,marginBottom:14,overflowX:'auto',paddingBottom:4}}>
              {allMembers.map(m=>{
                const count=allAvail.filter(a=>a.member_id===m.id).length
                return (
                  <div key={m.id} style={{textAlign:'center',flexShrink:0}}>
                    <div style={{fontSize:22,background:'#f8fafc',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto'}}>{m.avatar}</div>
                    <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{m.name}</div>
                    <div style={{fontSize:10,color:count>0?'#16a34a':'#ef4444',marginTop:1}}>{count>0?`${count}個`:'未填'}</div>
                  </div>
                )
              })}
            </div>
            {bestSlots.length===0?(
              <div style={{textAlign:'center',padding:'32px 0',color:'#94a3b8'}}>
                <div style={{fontSize:40,marginBottom:12}}>😅</div>
                <div style={{fontSize:14,marginBottom:16}}>還沒有共同時段，叫大家多填幾個！</div>
                <button className="btn-outline" onClick={()=>setScreen('fill')}>回去填時間</button>
              </div>
            ):(
              <>
                <div className="section-title">前 {bestSlots.length} 個最佳時段</div>
                {bestSlots.map(({slot,people,count},idx)=>{
                  const [date,time]=slot.split(' ')
                  const isConfirmed=currentSession.confirmed_slot===slot
                  return (
                    <div key={slot} className={`card ${selectedSlot===slot||isConfirmed?'sel':''}`} onClick={()=>setSelectedSlot(slot)}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
                            {idx===0&&<span style={{background:'#fef9c3',color:'#854d0e',borderRadius:8,padding:'1px 7px',fontSize:11,fontWeight:700}}>🥇 最佳</span>}
                            {isConfirmed&&<span className="tag-green">✅ 已確認</span>}
                          </div>
                          <div style={{fontWeight:700,color:'#1e293b',fontSize:15}}>{fmtDate(date)} {time}</div>
                          <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{people.map(p=>p.member_name).join('、')}</div>
                        </div>
                        <div style={{textAlign:'right',marginLeft:8}}>
                          <div style={{color:'#16a34a',fontWeight:900,fontSize:26}}>{count}</div>
                          <div style={{color:'#94a3b8',fontSize:11}}>人</div>
                        </div>
                      </div>
                      <div className="overlap-bar"><div className="overlap-fill" style={{width:`${(count/Math.max(allMembers.length,1))*100}%`}}/></div>
                      {selectedSlot===slot&&<div style={{marginTop:6,color:'#16a34a',fontSize:12,fontWeight:700}}>✓ 已選擇</div>}
                    </div>
                  )
                })}
                {selectedSlot&&(
                  <div style={{background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:16,padding:16,marginTop:4}}>
                    <div style={{fontWeight:700,color:'#15803d',marginBottom:8}}>🏟️ {currentSession.venue}</div>
                    <div style={{color:'#64748b',fontSize:13,marginBottom:12}}>
                      時段：<strong style={{color:'#15803d'}}>{fmtSlot(selectedSlot)}</strong><br/>
                      出席：{bestSlots.find(x=>x.slot===selectedSlot)?.people.map(p=>p.member_name).join('、')}
                    </div>
                    {!showBookingForm?(
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {currentSession.venue==='貓羅羽球館'&&(
                          <a href="https://vip.hengfu-i.com/index.php?dr_idno=94549706" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                            <button className="btn-green" style={{fontSize:14}}>開啟貓羅球館預約頁 →</button>
                          </a>
                        )}
                        {!currentSession.confirmed_slot&&(
                          <button className="btn-blue" style={{fontSize:13}} onClick={()=>confirmSession(selectedSlot)}>確認這個時段（通知大家）</button>
                        )}
                        <button className="btn-outline" style={{fontSize:13}} onClick={()=>setShowBookingForm(true)}>✅ 登記已完成預約</button>
                      </div>
                    ):(
                      <div>
                        <input className="inp" style={{marginBottom:10}} value={bookingNote} onChange={e=>setBookingNote(e.target.value)} placeholder="備註（例：已訂1號場2小時）"/>
                        <button className="btn-green" onClick={submitBooking}>確認登記</button>
                      </div>
                    )}
                  </div>
                )}
                <div style={{height:1,background:'#f1f5f9',margin:'16px 0'}}/>
                <button className="btn-red" onClick={deleteSession}>🗑️ 刪除此球局</button>
              </>
            )}
          </div>
        </div>
      )}

      {user && ['home','results'].includes(screen) && (
        <div className="nav">
          {[{icon:'🏠',label:'首頁',key:'home'},{icon:'🏸',label:'時段',key:'results'}].map(n=>(
            <button key={n.key} className={`nb ${screen===n.key?'on':''}`} onClick={()=>setScreen(n.key)}>
              <div>{n.icon}</div><div className="nb-lbl">{n.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
