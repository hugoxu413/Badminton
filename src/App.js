import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

const AVATARS = ['😊','🐼','🦊','🐱','🐻','🐯','🐸','🦁','🐺','🐧','🦄','🐙','🦋']
const WEEKDAY_TIMES = ['19:00','20:00','21:00']
const WEEKEND_TIMES = ['09:00','10:00','11:00','14:00','15:00','19:00','20:00']
const VENUE_URL = 'https://vip.hengfu-i.com/index.php?dr_idno=94549706'

// 產生日期範圍內所有日期
function getDatesInRange(from, to) {
  const dates = []
  const cur = new Date(from)
  const end = new Date(to)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function isWeekend(dateStr) {
  const d = new Date(dateStr).getDay()
  return d === 0 || d === 6
}

function dayLabel(dateStr) {
  const days = ['日','一','二','三','四','五','六']
  return '週' + days[new Date(dateStr).getDay()]
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth()+1}/${d.getDate()}（${dayLabel(dateStr)}）`
}

// 產生唯一 join code
function genCode() {
  return Math.random().toString(36).slice(2, 10)
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#0a0a0f;}
  ::-webkit-scrollbar{display:none;}
  #root{display:flex;justify-content:center;min-height:100%;}
  .app{width:100%;max-width:430px;min-height:100vh;background:#0f0f1a;font-family:'Noto Sans TC','PingFang TC',sans-serif;position:relative;padding-bottom:80px;}
  .page{padding:20px 18px 20px;}
  .btn-p{background:linear-gradient(135deg,#4ade80,#22d3ee);color:#0a0a0f;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:opacity .2s,transform .1s;}
  .btn-p:active{transform:scale(.98);}
  .btn-p:disabled{opacity:.35;cursor:not-allowed;}
  .btn-g{background:transparent;color:#666;border:1.5px solid #2a2a3a;border-radius:14px;padding:13px;font-size:14px;cursor:pointer;font-family:inherit;width:100%;}
  .card{background:#161625;border:1px solid #2a2a3a;border-radius:16px;padding:15px;margin-bottom:10px;cursor:pointer;transition:border-color .18s;}
  .card:hover{border-color:#4ade80;}
  .card.sel{border-color:#4ade80;background:rgba(74,222,128,.06);}
  .inp{background:#161625;border:1.5px solid #2a2a3a;border-radius:12px;color:#fff;font-size:15px;font-family:inherit;padding:12px 14px;width:100%;outline:none;transition:border-color .2s;}
  .inp:focus{border-color:#4ade80;}
  .inp-date{background:#161625;border:1.5px solid #2a2a3a;border-radius:12px;color:#fff;font-size:14px;font-family:inherit;padding:11px 12px;outline:none;flex:1;transition:border-color .2s;}
  .inp-date:focus{border-color:#4ade80;}
  .av-btn{font-size:22px;background:#1a1a2e;border:2px solid transparent;border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .15s;flex-shrink:0;}
  .av-btn.on{border-color:#4ade80;background:rgba(74,222,128,.15);}
  .slot-btn{border:1.5px solid #2a2a3a;background:#161625;color:#666;border-radius:10px;padding:9px 4px;cursor:pointer;transition:all .15s;font-size:12px;font-family:inherit;text-align:center;width:100%;}
  .slot-btn:hover{border-color:#4ade80;}
  .slot-btn.on{border-color:#4ade80;background:rgba(74,222,128,.14);color:#4ade80;font-weight:700;}
  .tag{display:inline-block;background:rgba(74,222,128,.12);color:#4ade80;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:700;}
  .tag-blue{display:inline-block;background:rgba(34,211,238,.12);color:#22d3ee;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:700;}
  .nav{display:flex;border-top:1px solid #1a1a2a;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:#0f0f1a;z-index:99;}
  .nb{flex:1;padding:10px 0 12px;background:none;border:none;color:#333;font-size:19px;cursor:pointer;font-family:inherit;}
  .nb.on{color:#4ade80;}
  .nb-lbl{font-size:10px;margin-top:2px;color:#333;}
  .nb.on .nb-lbl{color:#4ade80;}
  .g-text{background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .section-title{color:#555;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;}
  .share-box{background:#161625;border:1.5px dashed #4ade80;border-radius:14px;padding:14px;margin-bottom:16px;}
  .share-url{color:#4ade80;font-size:13px;word-break:break-all;margin-bottom:10px;font-weight:600;}
  .copy-btn{background:rgba(74,222,128,.15);color:#4ade80;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
  .overlap-bar{height:4px;background:#2a2a3a;border-radius:2px;margin-top:8px;overflow:hidden;}
  .overlap-fill{height:100%;background:linear-gradient(90deg,#4ade80,#22d3ee);border-radius:2px;transition:width .3s;}
  @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fu{animation:fu .3s ease forwards;}
  .loading{display:flex;align-items:center;justify-content:center;height:60px;color:#555;font-size:14px;}
  .date-group{background:#161625;border:1px solid #2a2a3a;border-radius:14px;padding:14px;margin-bottom:12px;}
  .date-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .date-title{color:#fff;font-size:14px;font-weight:700;}
  .date-sub{color:#555;font-size:11px;}
  .spinner{width:20px;height:20px;border:2px solid #2a2a3a;border-top-color:#4ade80;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#4ade80;color:#0a0a0f;padding:10px 20px;border-radius:20px;font-size:14px;font-weight:700;z-index:999;white-space:nowrap;}
`

export default function App() {
  // ── 本地使用者資料（存 localStorage）
  const [myName, setMyName] = useState(() => localStorage.getItem('bmt_name') || '')
  const [myAvatar, setMyAvatar] = useState(() => localStorage.getItem('bmt_avatar') || '😊')
  const [myCode] = useState(() => {
    let c = localStorage.getItem('bmt_code')
    if (!c) { c = genCode(); localStorage.setItem('bmt_code', c) }
    return c
  })

  // ── 畫面狀態
  const [screen, setScreen] = useState('home') // home | join | create | fill | results | book
  const [toast, setToast] = useState('')

  // ── 球局資料
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [allAvailability, setAllAvailability] = useState([]) // [{participant_id, slot}]
  const [myAvailability, setMyAvailability] = useState([]) // [slot]
  const [myParticipantId, setMyParticipantId] = useState(null)

  // ── 建立球局
  const [newTitle, setNewTitle] = useState('')
  const [newDateFrom, setNewDateFrom] = useState('')
  const [newDateTo, setNewDateTo] = useState('')

  // ── 加入球局
  const [joinCode, setJoinCode] = useState('')

  // ── 預約
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingDone, setBookingDone] = useState(false)

  const [loading, setLoading] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingName, setEditingName] = useState(false)

  // 儲存名字到 localStorage
  useEffect(() => { localStorage.setItem('bmt_name', myName) }, [myName])
  useEffect(() => { localStorage.setItem('bmt_avatar', myAvatar) }, [myAvatar])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  // 讀取我的球局列表
  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from('participants')
      .select('session_id, sessions(*)')
      .eq('join_code', myCode)
    if (data) setSessions(data.map(d => d.sessions).filter(Boolean))
  }, [myCode])

  useEffect(() => { loadSessions() }, [loadSessions])

  // 讀取球局詳情
  const loadSession = useCallback(async (sessionId) => {
    setLoading(true)
    const [{ data: sess }, { data: parts }, { data: avail }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('participants').select('*').eq('session_id', sessionId),
      supabase.from('availability').select('*').eq('session_id', sessionId),
    ])
    setCurrentSession(sess)
    setParticipants(parts || [])
    setAllAvailability(avail || [])
    const me = parts?.find(p => p.join_code === myCode)
    setMyParticipantId(me?.id || null)
    setMyAvailability(avail?.filter(a => a.participant_id === me?.id).map(a => a.slot) || [])
    setLoading(false)
  }, [myCode])

  // ── 建立球局
  const createSession = async () => {
    if (!myName.trim() || !newTitle.trim() || !newDateFrom || !newDateTo) return
    setLoading(true)
    const { data: sess } = await supabase.from('sessions').insert({
      title: newTitle,
      created_by: myName,
      date_from: newDateFrom,
      date_to: newDateTo,
    }).select().single()

    const { data: part } = await supabase.from('participants').insert({
      session_id: sess.id,
      name: myName,
      avatar: myAvatar,
      join_code: myCode,
    }).select().single()

    setMyParticipantId(part.id)
    setCurrentSession(sess)
    setParticipants([part])
    setAllAvailability([])
    setMyAvailability([])
    setLoading(false)
    setScreen('fill')
    loadSessions()
  }

  // ── 加入球局（透過 session id）
  const joinSession = async (sessionId) => {
    if (!myName.trim()) return
    setLoading(true)
    // 檢查是否已加入
    const { data: existing } = await supabase.from('participants')
      .select('*').eq('session_id', sessionId).eq('join_code', myCode).single()

    if (existing) {
      await loadSession(sessionId)
      setScreen('fill')
      setLoading(false)
      return
    }
    const { data: part } = await supabase.from('participants').insert({
      session_id: sessionId,
      name: myName,
      avatar: myAvatar,
      join_code: myCode,
    }).select().single()

    setMyParticipantId(part.id)
    await loadSession(sessionId)
    setScreen('fill')
    setLoading(false)
  }

  // ── 切換時段
  const toggleSlot = async (slot) => {
    if (!myParticipantId) return
    const has = myAvailability.includes(slot)
    if (has) {
      await supabase.from('availability')
        .delete().eq('participant_id', myParticipantId).eq('slot', slot)
      setMyAvailability(prev => prev.filter(s => s !== slot))
      setAllAvailability(prev => prev.filter(a => !(a.participant_id === myParticipantId && a.slot === slot)))
    } else {
      const { data } = await supabase.from('availability').insert({
        session_id: currentSession.id,
        participant_id: myParticipantId,
        slot,
      }).select().single()
      setMyAvailability(prev => [...prev, slot])
      setAllAvailability(prev => [...prev, data])
    }
  }

  // 計算重疊
  const getOverlap = (slot) => {
    const ids = allAvailability.filter(a => a.slot === slot).map(a => a.participant_id)
    return participants.filter(p => ids.includes(p.id))
  }

  const dates = currentSession ? getDatesInRange(currentSession.date_from, currentSession.date_to) : []

  const bestSlots = dates.flatMap(date => {
    const times = isWeekend(date) ? WEEKEND_TIMES : WEEKDAY_TIMES
    return times.map(t => `${date} ${t}`)
  }).map(slot => ({ slot, people: getOverlap(slot) }))
    .filter(x => x.people.length >= 2)
    .sort((a, b) => b.people.length - a.people.length)
    .slice(0, 8)

  const shareUrl = currentSession ? `${window.location.origin}?join=${currentSession.id}` : ''

  // 檢查 URL 是否有 join 參數
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinId = params.get('join')
    if (joinId) {
      setJoinCode(joinId)
      setScreen('join')
    }
  }, [])

  const saveName = () => {
    if (nameInput.trim()) setMyName(nameInput.trim())
    setEditingName(false)
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      {toast && <div className="toast">{toast}</div>}

      {/* ══ 首頁 ══ */}
      {screen === 'home' && (
        <div className="page fu">
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, paddingTop:16 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:900 }}><span className="g-text">🏸 羽球揪團</span></div>
              <div style={{ color:'#444', fontSize:13, marginTop:2 }}>找共同有空的時間，一起打球</div>
            </div>
            <button onClick={() => { setEditingName(true); setNameInput(myName); setScreen('profile') }}
              style={{ fontSize:32, background:'none', border:'none', cursor:'pointer' }}>{myAvatar}</button>
          </div>

          {/* 我的球局 */}
          {sessions.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div className="section-title">我的球局</div>
              {sessions.map(s => (
                <div key={s.id} className="card" onClick={async () => { await loadSession(s.id); setScreen('fill') }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{s.title}</div>
                      <div style={{ color:'#555', fontSize:12, marginTop:4 }}>
                        {formatDate(s.date_from)} ～ {formatDate(s.date_to)}
                      </div>
                    </div>
                    <span className={s.status === 'confirmed' ? 'tag' : 'tag-blue'}>
                      {s.status === 'confirmed' ? '已確認' : '填寫中'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button className="btn-p" onClick={() => {
              if (!myName) { setScreen('profile'); return }
              setNewTitle(''); setNewDateFrom(''); setNewDateTo('')
              setScreen('create')
            }}>
              + 發起新球局
            </button>
            <button className="btn-g" onClick={() => setScreen('join')}>
              加入朋友的球局
            </button>
          </div>

          {!myName && (
            <div style={{ marginTop:20, background:'rgba(74,222,128,.08)', border:'1px solid rgba(74,222,128,.2)', borderRadius:14, padding:'12px 14px', color:'#888', fontSize:13 }}>
              💡 先點右上角設定你的暱稱
            </div>
          )}
        </div>
      )}

      {/* ══ 我的資料 ══ */}
      {screen === 'profile' && (
        <div className="page fu">
          <button onClick={() => setScreen('home')} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:16, paddingTop:16 }}>←</button>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:4 }}><span className="g-text">我的資料</span></div>
          <p style={{ color:'#444', fontSize:13, marginBottom:28 }}>設定暱稱讓球友認出你</p>

          {/* 頭像 */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>{myAvatar}</div>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8 }}>
              {AVATARS.map(a => (
                <button key={a} className={`av-btn ${myAvatar===a?'on':''}`} onClick={() => setMyAvatar(a)}>{a}</button>
              ))}
            </div>
          </div>

          {/* 暱稱 */}
          <div style={{ marginBottom:28 }}>
            <div className="section-title">暱 稱</div>
            {editingName ? (
              <div style={{ display:'flex', gap:8 }}>
                <input className="inp" value={nameInput} onChange={e => setNameInput(e.target.value)}
                  placeholder="輸入暱稱（最多10字）" maxLength={10} autoFocus
                  onKeyDown={e => e.key==='Enter' && saveName()} />
                <button className="btn-p" style={{ width:'auto', padding:'0 18px', fontSize:14 }} onClick={saveName}>確定</button>
              </div>
            ) : (
              <div onClick={() => { setNameInput(myName); setEditingName(true) }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#161625', border:'1px solid #2a2a3a', borderRadius:14, padding:'14px 16px', cursor:'pointer' }}>
                <span style={{ color: myName ? '#fff' : '#333', fontSize:16, fontWeight:700 }}>
                  {myName || '點此輸入暱稱…'}
                </span>
                <span style={{ color:'#4ade80', fontSize:13 }}>✏️ 編輯</span>
              </div>
            )}
          </div>

          <button className="btn-p" disabled={!myName} onClick={() => setScreen('home')}>儲存並返回</button>
        </div>
      )}

      {/* ══ 建立球局 ══ */}
      {screen === 'create' && (
        <div className="page fu">
          <button onClick={() => setScreen('home')} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:16, paddingTop:16 }}>←</button>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:4 }}>發起新球局</div>
          <p style={{ color:'#444', fontSize:13, marginBottom:28 }}>設定日期範圍，傳連結給朋友填時間</p>

          <div style={{ marginBottom:18 }}>
            <div className="section-title">球局名稱</div>
            <input className="inp" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="例：五月球局、端午連假打球" />
          </div>

          <div style={{ marginBottom:18 }}>
            <div className="section-title">開放填寫的日期範圍</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type="date" className="inp-date" value={newDateFrom} onChange={e => setNewDateFrom(e.target.value)} />
              <span style={{ color:'#555' }}>～</span>
              <input type="date" className="inp-date" value={newDateTo} onChange={e => setNewDateTo(e.target.value)} />
            </div>
            <p style={{ color:'#444', fontSize:12, marginTop:8 }}>💡 建議設 2～4 週，讓大家有足夠選項</p>
          </div>

          <button className="btn-p" style={{ marginTop:8 }}
            disabled={!newTitle.trim() || !newDateFrom || !newDateTo || loading}
            onClick={createSession}>
            {loading ? '建立中…' : '建立球局並邀請朋友 →'}
          </button>
        </div>
      )}

      {/* ══ 加入球局 ══ */}
      {screen === 'join' && (
        <div className="page fu">
          <button onClick={() => { setScreen('home'); window.history.replaceState({}, '', '/') }} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:16, paddingTop:16 }}>←</button>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:4 }}>加入球局</div>
          <p style={{ color:'#444', fontSize:13, marginBottom:28 }}>輸入朋友給你的球局代碼，或直接點連結進來</p>

          {!myName && (
            <div style={{ marginBottom:18 }}>
              <div className="section-title">先設定你的暱稱</div>
              <input className="inp" value={nameInput} onChange={e => setNameInput(e.target.value)}
                placeholder="你叫什麼名字？" maxLength={10}
                onBlur={() => { if(nameInput.trim()) setMyName(nameInput.trim()) }} />
            </div>
          )}

          <div style={{ marginBottom:18 }}>
            <div className="section-title">球局代碼（UUID）</div>
            <input className="inp" value={joinCode} onChange={e => setJoinCode(e.target.value)}
              placeholder="貼上朋友傳來的代碼" />
          </div>

          <button className="btn-p" disabled={!joinCode.trim() || (!myName && !nameInput.trim()) || loading}
            onClick={async () => {
              if (!myName && nameInput.trim()) setMyName(nameInput.trim())
              await joinSession(joinCode.trim())
              window.history.replaceState({}, '', '/')
            }}>
            {loading ? '加入中…' : '加入球局 →'}
          </button>
        </div>
      )}

      {/* ══ 填寫空閒時間 ══ */}
      {screen === 'fill' && currentSession && (
        <div className="page fu">
          <button onClick={() => setScreen('home')} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:12, paddingTop:16 }}>←</button>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{currentSession.title}</div>
            <div style={{ color:'#555', fontSize:12, marginTop:3 }}>
              {formatDate(currentSession.date_from)} ～ {formatDate(currentSession.date_to)}
            </div>
          </div>

          {/* 分享連結 */}
          <div className="share-box" style={{ marginBottom:20 }}>
            <div style={{ color:'#aaa', fontSize:12, marginBottom:6 }}>📤 傳給朋友來填時間</div>
            <div className="share-url">{shareUrl}</div>
            <button className="copy-btn" onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              showToast('已複製連結！')
            }}>複製連結</button>
          </div>

          {/* 參與者 */}
          <div style={{ display:'flex', gap:12, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
            {participants.map(p => (
              <div key={p.id} style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:26 }}>{p.avatar}</div>
                <div style={{ fontSize:10, color: p.join_code===myCode ? '#4ade80' : '#666', marginTop:3 }}>{p.name}</div>
                <div style={{ fontSize:10, color:'#4ade80', marginTop:1 }}>
                  {allAvailability.filter(a => a.participant_id === p.id).length}個
                </div>
              </div>
            ))}
          </div>

          {/* 日期 × 時段 */}
          <div className="section-title" style={{ marginBottom:12 }}>勾選你有空的時段</div>
          {loading ? <div className="loading"><div className="spinner" /></div> : (
            dates.map(date => {
              const times = isWeekend(date) ? WEEKEND_TIMES : WEEKDAY_TIMES
              const hasAny = times.some(t => myAvailability.includes(`${date} ${t}`))
              return (
                <div key={date} className="date-group">
                  <div className="date-header">
                    <div>
                      <span className="date-title">{formatDate(date)}</span>
                    </div>
                    {hasAny && <span className="tag">已填</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(times.length, 4)}, 1fr)`, gap:6 }}>
                    {times.map(t => {
                      const slot = `${date} ${t}`
                      const on = myAvailability.includes(slot)
                      const overlapCount = getOverlap(slot).length
                      return (
                        <button key={t} className={`slot-btn ${on?'on':''}`} onClick={() => toggleSlot(slot)}>
                          <div>{t}</div>
                          {overlapCount >= 2 && <div style={{ fontSize:10, color:'#4ade80', marginTop:2 }}>+{overlapCount}人</div>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}

          <div style={{ marginTop:16 }}>
            <button className="btn-p" onClick={() => setScreen('results')}>
              看大家的重疊時間 →
            </button>
          </div>
        </div>
      )}

      {/* ══ 結果 ══ */}
      {screen === 'results' && currentSession && (
        <div className="page fu">
          <button onClick={() => setScreen('fill')} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:12, paddingTop:16 }}>←</button>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:4 }}><span className="g-text">最佳時段</span></div>
          <p style={{ color:'#444', fontSize:13, marginBottom:20 }}>根據大家填的時間自動找出重疊</p>

          {/* 參與者 */}
          <div style={{ display:'flex', gap:12, marginBottom:20, overflowX:'auto' }}>
            {participants.map(p => (
              <div key={p.id} style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:24 }}>{p.avatar}</div>
                <div style={{ fontSize:10, color:'#666', marginTop:3 }}>{p.name}</div>
              </div>
            ))}
          </div>

          {bestSlots.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#555' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>😅</div>
              <div style={{ fontSize:14, marginBottom:16 }}>目前沒有共同時段<br />叫朋友多填幾個試試</div>
              <button className="btn-g" onClick={() => setScreen('fill')}>回去填時間</button>
            </div>
          ) : (
            <>
              <div className="section-title">找到 {bestSlots.length} 個重疊時段</div>
              {bestSlots.map(({ slot, people }) => {
                const [date, time] = slot.split(' ')
                return (
                  <div key={slot} className={`card ${selectedSlot===slot?'sel':''}`} onClick={() => setSelectedSlot(slot)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{formatDate(date)} {time}</div>
                        <div style={{ display:'flex', gap:4, marginTop:8, alignItems:'center' }}>
                          {people.map((p,i) => <span key={i} style={{ fontSize:18 }}>{p.avatar}</span>)}
                          <span style={{ color:'#555', fontSize:11, marginLeft:4 }}>{people.map(p=>p.name).join('、')}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ color:'#4ade80', fontWeight:900, fontSize:26 }}>{people.length}</div>
                        <div style={{ color:'#555', fontSize:11 }}>人有空</div>
                      </div>
                    </div>
                    <div className="overlap-bar">
                      <div className="overlap-fill" style={{ width:`${(people.length/participants.length)*100}%` }} />
                    </div>
                    {selectedSlot===slot && <div style={{ marginTop:6, color:'#4ade80', fontSize:12, fontWeight:700 }}>✓ 已選擇</div>}
                  </div>
                )
              })}
              {selectedSlot
                ? <button className="btn-p" onClick={() => setScreen('book')}>去預約球場 →</button>
                : <p style={{ color:'#444', fontSize:13, textAlign:'center', marginTop:8 }}>點選一個時段後可預約球場</p>
              }
            </>
          )}
        </div>
      )}

      {/* ══ 預約球場 ══ */}
      {screen === 'book' && (
        <div className="page fu">
          <button onClick={() => setScreen('results')} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer', marginBottom:12, paddingTop:16 }}>←</button>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:16 }}>預約球場</div>

          {selectedSlot && (
            <div style={{ background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.3)', borderRadius:12, padding:'12px 14px', marginBottom:20, color:'#4ade80', fontSize:13, fontWeight:600 }}>
              🏸 {formatDate(selectedSlot.split(' ')[0])} {selectedSlot.split(' ')[1]}
              　· {getOverlap(selectedSlot).length} 人出席
            </div>
          )}

          {!bookingDone ? (
            <div style={{ background:'#161625', border:'1.5px solid #4ade80', borderRadius:16, padding:18 }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:16, marginBottom:8 }}>🏟️ 貓羅羽球館</div>
              <div style={{ color:'#888', fontSize:13, lineHeight:1.8, marginBottom:16 }}>
                時段：<span style={{ color:'#22d3ee', fontWeight:700 }}>
                  {selectedSlot && `${formatDate(selectedSlot.split(' ')[0])} ${selectedSlot.split(' ')[1]}`}
                </span><br />
                出席：{selectedSlot && getOverlap(selectedSlot).map(p => p.name).join('、')}<br />
                <span style={{ color:'#555', fontSize:11 }}>⚠️ 需登入帳號，驗證碼人工操作</span>
              </div>
              <a href={VENUE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block', marginBottom:12 }}>
                <div style={{ background:'linear-gradient(135deg,#4ade80,#22d3ee)', color:'#0a0a0f', borderRadius:12, padding:13, textAlign:'center', fontWeight:700, fontSize:15 }}>
                  登入貓羅羽球館預約 →
                </div>
              </a>
              <button className="btn-g" onClick={async () => {
                if (currentSession) {
                  await supabase.from('sessions').update({
                    status: 'confirmed',
                    confirmed_slot: selectedSlot,
                    venue: '貓羅羽球館',
                  }).eq('id', currentSession.id)
                }
                setBookingDone(true)
              }}>
                ✅ 已完成預約，通知球友！
              </button>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 0' }} className="fu">
              <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:24, marginBottom:8 }}>搞定了！</div>
              <div style={{ color:'#4ade80', fontSize:15, marginBottom:4 }}>
                {selectedSlot && `${formatDate(selectedSlot.split(' ')[0])} ${selectedSlot.split(' ')[1]}`}
              </div>
              <div style={{ color:'#888', fontSize:13, marginBottom:20 }}>貓羅羽球館</div>
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:20 }}>
                {participants.map((p,i) => <span key={i} style={{ fontSize:28 }}>{p.avatar}</span>)}
              </div>
              <div style={{ background:'#161625', border:'1px solid #2a2a3a', borderRadius:14, padding:'12px 16px', marginBottom:20, color:'#666', fontSize:13 }}>
                📣 球局已標記為確認，所有球友都看得到！
              </div>
              <button className="btn-p" onClick={() => { setScreen('home'); setBookingDone(false); setSelectedSlot(null); loadSessions() }}>
                回到首頁
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      {!['profile','create','join','fill'].includes(screen) && (
        <div className="nav">
          {[
            { icon:'🏠', label:'首頁', key:'home' },
            { icon:'🏸', label:'揪球', key:'results' },
            { icon:'🏟️', label:'預約', key:'book' },
          ].map(n => (
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
