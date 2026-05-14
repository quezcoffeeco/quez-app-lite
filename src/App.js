import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './screens/LoginScreen';
import './App.css';
function PlaceholderScreen({ name }) {
const { session } = useApp();
return (
<div style={{minHeight:'100vh',background:'var(--color-black)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:24}}>
<div style={{background:'var(--color-dark-gray)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:16,padding:'32px 28px',maxWidth:400,width:'100%',textAlign:'center'}}>
<p style={{color:'var(--color-gold)',fontFamily:'Georgia,serif',fontSize:20,margin:'0 0 8px'}}>{name}</p>
<p style={{color:'var(--color-cream)',opacity:0.5,fontSize:13,margin:'0 0 24px'}}>Coming in a future session</p>
<p style={{color:'var(--color-cream)',opacity:0.4,fontSize:12,margin:0}}>Logged in as: {session && session.name}</p>
</div>
</div>
);
}
const NAV_ITEMS = {
owner:[{screen:'ownerDashboard',label:'Dashboard'},{screen:'dailyChecklist',label:'Checklist'},{screen:'orderEntry',label:'Orders'},{screen:'recipes',label:'Recipes'},{screen:'scheduling',label:'Schedule'},{screen:'settings',label:'Settings'}],
manager:[{screen:'dailyChecklist',label:'Checklist'},{screen:'orderEntry',label:'Orders'},{screen:'recipes',label:'Recipes'},{screen:'scheduling',label:'Schedule'},{screen:'training',label:'Training'}],
leadBarista:[{screen:'dailyChecklist',label:'Checklist'},{screen:'orderEntry',label:'Orders'},{screen:'recipes',label:'Recipes'},{screen:'training',label:'Training'}],
barista:[{screen:'dailyChecklist',label:'Checklist'},{screen:'orderEntry',label:'Orders'},{screen:'recipes',label:'Recipes'}],
trainee:[{screen:'training',label:'Training'},{screen:'recipes',label:'Recipes'}],
};
function BottomNav() {
const { session, currentScreen, navigate, logout } = useApp();
if (!session) return null;
const items = NAV_ITEMS[session.role] || [];
return (
<nav className="bottom-nav">
{items.map(function(item) {
return (
<button key={item.screen} className={'bottom-nav-item ' + (currentScreen === item.screen ? 'active' : '')} onClick={function(){ navigate(item.screen); }}>
<span className="bottom-nav-label">{item.label}</span>
</button>
);
})}
<button className="bottom-nav-item bottom-nav-logout" onClick={logout}>Out</button>
</nav>
);
}
function AppRouter() {
const { session, currentScreen } = useApp();
if (!session) return <LoginScreen />;
const screens = {
ownerDashboard:<PlaceholderScreen name="Owner Dashboard" />,
dailyChecklist:<PlaceholderScreen name="Daily Checklist" />,
orderEntry:<PlaceholderScreen name="Order Entry" />,
recipes:<PlaceholderScreen name="Recipe Viewer" />,
scheduling:<PlaceholderScreen name="Scheduling" />,
settings:<PlaceholderScreen name="Settings" />,
training:<PlaceholderScreen name="Training Portal" />,
};
return (
<div className="app-shell">
<main className="app-main">
{screens[currentScreen] || <PlaceholderScreen name={currentScreen} />}
</main>
<BottomNav />
</div>
);
}
export default function App() {
return (
<AppProvider>
<AppRouter />
</AppProvider>
);
}