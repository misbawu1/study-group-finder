'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '../lib/supabase/client'

const supabase = createClient()

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'S'
}

export default function Home() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('signup')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const messageEnd = useRef(null)
  const user = session?.user
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    let authEventReceived = false
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true
      if (mounted) setSession(nextSession)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && !authEventReceived) {
        setSession(data.session)
      }
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const loadGroups = useCallback(async () => {
    if (!supabase || !user) return
    const { data, error } = await supabase
      .from('study_groups')
      .select('id, name, subject, description, owner_id, created_at, owner:profiles!study_groups_owner_id_fkey(full_name), group_members(user_id)')
      .order('created_at', { ascending: false })
    if (error) setNotice(error.message)
    else setGroups(data || [])
  }, [user])

  useEffect(() => { loadGroups() }, [loadGroups])

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return groups
    return groups.filter(group => `${group.name} ${group.subject} ${group.description || ''}`.toLowerCase().includes(term))
  }, [groups, search])

  useEffect(() => {
    if (!supabase || !activeGroup || !user) return
    let mounted = true
    supabase.from('messages').select('id, content, created_at, user_id, profiles(full_name)')
      .eq('group_id', activeGroup.id).order('created_at', { ascending: true }).limit(100)
      .then(({ data, error }) => { if (mounted) error ? setNotice(error.message) : setMessages(data || []) })
    const channel = supabase.channel(`messages:${activeGroup.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${activeGroup.id}` }, async payload => {
        const { data } = await supabase.from('messages').select('id, content, created_at, user_id, profiles(full_name)').eq('id', payload.new.id).single()
        if (data) setMessages(current => current.some(message => message.id === data.id) ? current : [...current, data])
      }).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel); setMessages([]) }
  }, [activeGroup, user])

  useEffect(() => { messageEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleAuth(event) {
    event.preventDefault()
    if (!supabase) return
    setAuthBusy(true); setAuthMessage('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    const fullName = form.get('full_name')
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password })
    setAuthBusy(false)
    setAuthMessage(result.error?.message || (authMode === 'signup' && !result.data.session ? 'Check your email to confirm your account, then sign in.' : ''))
  }

  async function createGroup(event) {
    event.preventDefault(); if (!supabase || !user) return
    setBusy(true); setNotice('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const { error } = await supabase.from('study_groups').insert({
      name: form.get('name'), subject: form.get('subject'), description: form.get('description'), owner_id: user.id
    })
    if (!error) {
      setShowCreate(false); formElement.reset(); await loadGroups()
    } else setNotice(error.message)
    setBusy(false)
  }

  async function joinGroup(group) {
    setBusy(true); setNotice('')
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
    setNotice(error ? (error.code === '23505' ? 'You are already in this group.' : error.message) : `Joined ${group.name}.`)
    await loadGroups(); setBusy(false)
  }

  async function leaveGroup(group) {
    setBusy(true)
    const { error } = await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', user.id)
    if (error) setNotice(error.message)
    if (activeGroup?.id === group.id) setActiveGroup(null)
    await loadGroups(); setBusy(false)
  }

  async function sendMessage(event) {
    event.preventDefault(); if (!supabase || !activeGroup || !user) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const content = String(form.get('content') || '').trim()
    if (!content) return
    const { error } = await supabase.from('messages').insert({ group_id: activeGroup.id, user_id: user.id, content })
    if (error) setNotice(error.message)
    else formElement.reset()
  }

  const memberIds = group => group.group_members?.map(member => member.user_id) || []

  if (!supabase) return <main className="setup-screen"><div className="setup-card"><span className="brand-mark">✳</span><p className="eyebrow">ONE QUICK SETUP</p><h1>Connect your Supabase project</h1><p>Add your project URL and publishable key to <code>.env.local</code> to get the app running.</p><pre>NEXT_PUBLIC_SUPABASE_URL=…{ '\n' }NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…</pre><p>Follow the setup guide in <strong>README.md</strong> to create the free database and tables.</p></div></main>

  if (!user) return <main className="auth-screen">
    <section className="auth-art"><div className="auth-brand"><span className="brand-mark">✳</span> studycircle</div><div className="art-copy"><p className="eyebrow">GOOD STUDYING IS BETTER TOGETHER</p><h1>Find your people.<br /><em>Find your focus.</em></h1><p>Small groups, shared goals, and a little momentum for whatever you’re learning.</p><div className="floating-note"><span>✦</span><div><strong>Your next study session</strong><small>starts with one conversation.</small></div></div></div><div className="art-footer">A calmer way to learn together <span>✳</span></div></section>
    <section className="auth-panel"><div className="auth-form-wrap"><p className="eyebrow">YOUR STUDY SPACE</p><h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p className="muted">{authMode === 'signup' ? 'Join a group or start one of your own.' : 'Pick up where your group left off.'}</p>
      <form className="form-stack" onSubmit={handleAuth}>{authMode === 'signup' && <label>Your name<input name="full_name" placeholder="e.g. Alex Morgan" autoComplete="name" required /></label>}<label>Email address<input name="email" type="email" placeholder="you@school.edu" autoComplete="email" required /></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" minLength="6" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required /></label><button className="button button-primary button-wide" disabled={authBusy}>{authBusy ? 'One moment…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <span>→</span></button></form>
      {authMessage && <p className="inline-message">{authMessage}</p>}<p className="switch-auth">{authMode === 'signup' ? 'Already have an account?' : 'New to Study Circle?'} <button onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setAuthMessage('') }}>{authMode === 'signup' ? 'Sign in' : 'Create an account'}</button></p><p className="auth-footnote">Free to use for your class, club, or study crew.</p></div></section>
  </main>

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><a className="brand" href="#home" onClick={() => { setActiveGroup(null); setMobileNav(false) }}><span className="brand-mark">✳</span><span>studycircle<small>LEARN BETTER, TOGETHER</small></span></a><div className="side-label">YOUR SPACE</div><button className={`nav-item ${!activeGroup ? 'nav-active' : ''}`} onClick={() => { setActiveGroup(null); setMobileNav(false) }}><span>▦</span> Discover groups</button><div className="side-label side-groups">YOUR GROUPS <span>{groups.filter(g => memberIds(g).includes(user.id)).length}</span></div><div className="side-group-list">{groups.filter(g => memberIds(g).includes(user.id)).slice(0, 8).map(group => <button key={group.id} className={`group-nav ${activeGroup?.id === group.id ? 'group-nav-active' : ''}`} onClick={() => { setActiveGroup(group); setMobileNav(false) }}><i>{initials(group.name)}</i><span>{group.name}</span></button>)}{groups.filter(g => memberIds(g).includes(user.id)).length === 0 && <p className="side-empty">Your joined groups will show here.</p>}</div><div className="sidebar-bottom"><div className="profile-chip"><span className="avatar">{initials(displayName)}</span><span className="profile-name">{displayName}<small>{user.email}</small></span><button title="Sign out" onClick={() => supabase.auth.signOut()}>↗</button></div></div></aside>
    <section className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}>☰</button><div className="breadcrumb">Workspace <span>/</span> {activeGroup ? activeGroup.name : 'Discover groups'}</div><div className="topbar-actions"><span className="online-indicator">● <span>YOUR STUDY SPACE</span></span><button className="avatar top-avatar">{initials(displayName)}</button></div></header>
      {activeGroup ? <section className="chat-view"><div className="chat-heading"><button className="back-link" onClick={() => setActiveGroup(null)}>← All groups</button><div className="chat-title-row"><div className="group-icon large-icon">{initials(activeGroup.name)}</div><div><p className="eyebrow">{activeGroup.subject}</p><h1>{activeGroup.name}</h1><p className="muted">{activeGroup.description || 'A space to learn and make progress together.'}</p></div></div><div className="chat-meta"><span>◉ {memberIds(activeGroup).length} members</span><span>✦ Group chat</span></div></div><div className="messages-area">{messages.length === 0 ? <div className="empty-chat"><div>✳</div><h3>Start the conversation</h3><p>Share a question, a useful resource, or what you’re working on.</p></div> : messages.map(message => <article key={message.id} className={`message ${message.user_id === user.id ? 'message-mine' : ''}`}><span className="avatar message-avatar">{initials(message.profiles?.full_name || 'S')}</span><div><div className="message-byline"><strong>{message.user_id === user.id ? 'You' : message.profiles?.full_name || 'Student'}</strong><time>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div><p>{message.content}</p></div></article>)}<div ref={messageEnd} /></div><form className="message-form" onSubmit={sendMessage}><input name="content" placeholder={`Message ${activeGroup.name}…`} maxLength="2000" autoComplete="off" /><button className="send-button" aria-label="Send message">↑</button><small>Keep it kind. Keep it curious.</small></form></section> : <section className="discover-view"><div className="welcome-row"><div><p className="eyebrow">{today.toUpperCase()}</p><h1>Good to see you, {displayName.split(' ')[0]} <span>✳</span></h1><p className="muted">A little progress adds up. What would you like to work on?</p></div><button className="button button-primary create-button" onClick={() => setShowCreate(true)}><span>＋</span> Create a group</button></div><div className="stats-row"><div className="stat-card"><span className="stat-icon mint">▦</span><span><strong>{groups.length}</strong><small>STUDY GROUPS</small></span></div><div className="stat-card"><span className="stat-icon peach">✦</span><span><strong>{groups.filter(g => memberIds(g).includes(user.id)).length}</strong><small>YOUR GROUPS</small></span></div><div className="stat-card stat-note"><span>“</span><p>Little by little, a little becomes a lot.</p></div></div><div className="section-heading"><div><p className="eyebrow">FIND YOUR PEOPLE</p><h2>Explore study groups</h2></div><div className="search-box"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search groups or subjects" /></div></div>{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><form className="create-modal" onSubmit={createGroup} onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><p className="eyebrow">MAKE A LITTLE SPACE TO LEARN</p><h2>Create a study group</h2><p className="muted">Set the topic and invite classmates to join.</p><label>Group name<input name="name" placeholder="e.g. Biology exam prep" required maxLength="80" /></label><label>Subject or course<input name="subject" placeholder="e.g. BIO 202" required maxLength="80" /></label><label>What will you work on?<textarea name="description" placeholder="Share a goal, topic, or meeting plan…" rows="3" maxLength="300" /></label><button className="button button-primary button-wide" disabled={busy}>{busy ? 'Creating…' : 'Create group'} <span>→</span></button></form></div>}
        {visibleGroups.length === 0 ? <div className="empty-groups"><div>✳</div><h3>{search ? 'No groups match that search' : 'Your first study group is waiting'}</h3><p>{search ? 'Try another subject or group name.' : 'Start a group around a class, an exam, or a skill you want to learn.'}</p>{!search && <button className="button button-outline" onClick={() => setShowCreate(true)}>Create the first group <span>→</span></button>}</div> : <div className="group-grid">{visibleGroups.map((group, index) => { const joined = memberIds(group).includes(user.id); const owner = group.owner_id === user.id; return <article className="group-card" key={group.id}><div className="card-top"><div className={`group-icon color-${index % 4}`}>{initials(group.name)}</div><span className="subject-pill">{group.subject}</span></div><h3>{group.name}</h3><p className="group-description">{group.description || 'A welcoming space to learn and make progress together.'}</p><div className="card-footer"><div className="member-stack"><span className="avatar">{initials(group.owner?.full_name || 'S')}</span><span className="member-count">{memberIds(group).length} {memberIds(group).length === 1 ? 'member' : 'members'}</span></div>{joined ? <div className="joined-actions"><button className="button button-small button-chat" onClick={() => setActiveGroup(group)}>Open group <span>→</span></button>{!owner && <button className="leave-button" title="Leave group" onClick={() => leaveGroup(group)}>Leave</button>}</div> : <button className="button button-small button-join" disabled={busy} onClick={() => joinGroup(group)}>Join group <span>＋</span></button>}</div></article>})}</div>}</section>}
      <footer className="app-footer"><span>Made for curious minds <b>✳</b></span><span>Study at your own pace, together.</span></footer>
    </section>
  </main>
}
