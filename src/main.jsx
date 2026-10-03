import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{Camera,CalendarDays,ImagePlus,LogIn,LogOut,MessageCircle,Upload,X,ShieldCheck,IndianRupee}from'lucide-react';
import{supabase,hasSupabase}from'./lib/supabase';
import{studio}from'./lib/config';
import'./styles.css';

const fallbackFrames=[
{id:'1',name:'Classic Portrait Frame',size:'12 × 18 inch',price:499,image:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900'},
{id:'2',name:'Royal Wedding Frame',size:'16 × 24 inch',price:799,image:'https://images.unsplash.com/photo-1519741497674-611481863552?w=900'},
{id:'3',name:'Collage Memory Frame',size:'18 × 24 inch',price:999,image:'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=900'}
];
const fallbackServices=[
{id:'1',name:'Wedding Photography',price_from:15000,description:'Candid + traditional wedding photography'},
{id:'2',name:'Cinematic Wedding Film',price_from:20000,description:'Cinematic wedding videography'},
{id:'3',name:'Pre-Wedding Shoot',price_from:10000,description:'Creative pre-wedding photo session'},
{id:'4',name:'Drone Coverage',price_from:7000,description:'Aerial wedding coverage'}
];

function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
function wa(text){window.open('https://wa.me/'+studio.whatsapp+'?text='+encodeURIComponent(text),'_blank')}
async function loadPublic(setFrames,setServices){
 if(!supabase){setFrames(fallbackFrames);setServices(fallbackServices);return}
 const [{data:frames,error:fe},{data:services,error:se}]=await Promise.all([
  supabase.from('frames').select('*').eq('active',true).order('created_at',{ascending:false}),
  supabase.from('services').select('*').eq('active',true).order('created_at',{ascending:false})
 ]);
 setFrames(!fe&&frames?.length?frames:fallbackFrames);setServices(!se&&services?.length?services:fallbackServices);
}

function App(){
 const[frames,setFrames]=useState([]),[services,setServices]=useState([]),[selected,setSelected]=useState(null),[photo,setPhoto]=useState(null);
 const[admin,setAdmin]=useState(false),[login,setLogin]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const[booking,setBooking]=useState({name:'',phone:'',date:'',location:'',service:''});
 const[tab,setTab]=useState('home');

 useEffect(()=>{loadPublic(setFrames,setServices)},[]);
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>checkAdmin(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>checkAdmin(s));return()=>subscription.unsubscribe()},[]);
 async function checkAdmin(session){if(!session){setAdmin(false);return}const{data}=await supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle();setAdmin(data?.role==='admin')}
 async function signIn(e){e.preventDefault();setBusy(true);setMsg('');if(!supabase){setMsg('Supabase configure karo');setBusy(false);return}const{error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg(error.message);else{setLogin(false);setMsg('Admin login successful')}setBusy(false)}
 async function signOut(){await supabase?.auth.signOut();setAdmin(false)}
 function orderFrame(){
  if(!selected)return;
  const p=photo?'Photo uploaded for preview/order':'Photo not uploaded yet';
  wa(`Hello Devesh Digital Studio, I want to order *${selected.name}* (${selected.size}) for ${money(selected.price)}. ${p}.`);
 }
 function submitBooking(e){e.preventDefault();const s=services.find(x=>String(x.id)===String(booking.service));wa(`Hello Devesh Digital Studio, I want to book *${s?.name||'Wedding Service'}*. Name: ${booking.name}; Phone: ${booking.phone}; Date: ${booking.date}; Location: ${booking.location}`)}
 async function updateFrame(id,patch){
  if(!supabase||!admin)return;
  const{error}=await supabase.from('frames').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){setMsg(error.message);return}
  setFrames(v=>v.map(f=>f.id===id?{...f,...patch}:f));setMsg('Frame updated live ✓');
 }
 async function uploadFrameImage(id,file){
  if(!supabase||!admin)return;
  const ext=file.name.split('.').pop()?.toLowerCase()||'jpg',path=`catalog/${id}-${Date.now()}.${ext}`;
  setBusy(true);
  const{error}=await supabase.storage.from('frame-images').upload(path,file,{upsert:true,contentType:file.type});
  if(error){setMsg(error.message);setBusy(false);return}
  const{data}=supabase.storage.from('frame-images').getPublicUrl(path);
  await updateFrame(id,{image_url:data.publicUrl});setBusy(false);
 }
 return <div className="app">
  <header><div className="brand"><Camera/> <div><b>Devesh Digital Studio</b><small>Photography • Frames • Weddings</small></div></div><div className="actions">{admin?<button className="ghost" onClick={signOut}><LogOut/> Admin Logout</button>:<button className="ghost" onClick={()=>setLogin(true)}><LogIn/> Admin</button>}<button onClick={()=>wa('Hello Devesh Digital Studio, I want an enquiry.')}><MessageCircle/> WhatsApp</button></div></header>
  <main>
   <section className="hero"><div><span className="eyebrow">PAOTA • RAJASTHAN</span><h1>Your moments.<br/><em>Beautifully framed.</em></h1><p>Order custom photo frames and book professional wedding photography, videography, pre-wedding and drone coverage.</p><div className="heroBtns"><button onClick={()=>setTab('frames')}>Shop Frames</button><button className="light" onClick={()=>setTab('services')}>Book Wedding Service</button></div></div><div className="heroCard"><ImagePlus/><b>Upload your photo</b><span>Preview it in your selected frame</span></div></section>
   <nav className="tabs"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}>Home</button><button className={tab==='frames'?'active':''} onClick={()=>setTab('frames')}>Frame Store</button><button className={tab==='services'?'active':''} onClick={()=>setTab('services')}>Wedding Services</button></nav>
   {(tab==='home'||tab==='frames')&&<section><div className="sectionHead"><div><span className="eyebrow">FRAME STORE</span><h2>Choose your frame</h2></div><span>{frames.length} designs</span></div><div className="grid">{frames.map(f=><article className="card" key={f.id}><img src={f.image_url||f.image} /><div className="cardBody"><div><h3>{f.name}</h3><span>{f.size}</span></div><strong>{money(f.price)}</strong><button onClick={()=>setSelected(f)}>Upload & Preview</button></div></article>)}</div></section>}
   {(tab==='home'||tab==='services')&&<section><div className="sectionHead"><div><span className="eyebrow">WEDDINGS</span><h2>Book our team</h2></div></div><div className="serviceGrid">{services.map(s=><article className="service" key={s.id}><Camera/><h3>{s.name}</h3><p>{s.description}</p><b>{money(s.price_from)}+</b><button onClick={()=>setBooking(v=>({...v,service:String(s.id)}))}>Book Now</button></article>)}</div><form className="booking" onSubmit={submitBooking}><h3>Quick booking</h3><div className="formGrid"><input required placeholder="Your name" value={booking.name} onChange={e=>setBooking({...booking,name:e.target.value})}/><input required placeholder="Phone" value={booking.phone} onChange={e=>setBooking({...booking,phone:e.target.value})}/><input required type="date" value={booking.date} onChange={e=>setBooking({...booking,date:e.target.value})}/><input required placeholder="Event location" value={booking.location} onChange={e=>setBooking({...booking,location:e.target.value})}/><select required value={booking.service} onChange={e=>setBooking({...booking,service:e.target.value})}><option value="">Select service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><button type="submit"><CalendarDays/> Send Booking on WhatsApp</button></form></section>}
   {admin&&<section className="admin"><div className="sectionHead"><div><span className="eyebrow">SECURE ADMIN</span><h2>Live catalogue control</h2></div><ShieldCheck/></div>{msg&&<div className="notice">{msg}</div>}{frames.map(f=><div className="adminRow" key={f.id}><input value={f.name} onChange={e=>updateFrame(f.id,{name:e.target.value})}/><input value={f.size} onChange={e=>updateFrame(f.id,{size:e.target.value})}/><label><IndianRupee/> <input type="number" value={f.price} onChange={e=>updateFrame(f.id,{price:Number(e.target.value)})}/></label><label className="upload"><Upload/> Photo<input hidden type="file" accept="image/*" onChange={e=>e.target.files[0]&&uploadFrameImage(f.id,e.target.files[0])}/></label></div>)}</section>}
  </main>
  {selected&&<div className="overlay"><div className="modal"><button className="close" onClick={()=>setSelected(null)}><X/></button><h2>{selected.name}</h2><p>{selected.size} • {money(selected.price)}</p><div className="preview">{photo?<img src={URL.createObjectURL(photo)}/>:<><ImagePlus/><span>Upload your photo to preview</span></>}</div><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0]||null)}/><button onClick={orderFrame}>Order Frame on WhatsApp</button></div></div>}
  {login&&<div className="overlay"><form className="modal login" onSubmit={signIn}><button type="button" className="close" onClick={()=>setLogin(false)}><X/></button><ShieldCheck/><h2>Admin Login</h2><p>Only authorized studio admins can edit prices and catalogue photos.</p><input required type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>{msg&&<div className="notice">{msg}</div>}<button disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button></form></div>}
  <footer>© {new Date().getFullYear()} Devesh Digital Studio • {studio.address}</footer>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);