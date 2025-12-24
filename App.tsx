import React, { useState, useRef, useEffect } from 'react';

// ==========================================
// 1. Interfaces & Types
// ==========================================
interface AnalysisResult {
  feasibility_check: { is_possible: boolean; status_title: string; reason: string };
  vital_stats: { 
    ideal_temp: string; 
    ideal_humidity: string; 
    ideal_ph: string; 
    soil_type: string; 
    sun_requirement: string; 
  };
  soil_composition: { 
    primary_mix: string; 
    amendments: string; 
    layering: string; 
  };
  fertilizer_guide: { 
    veg_stage_npk: string; 
    flower_stage_npk: string; 
    organic_recipe: string; 
    application_frequency: string; 
  };
  organic_wisdom: { 
      soil_prep: string; 
      fertilizer_recipe: string; 
      pest_control_recipe: string; 
      microorganism_technique: string; 
  };
  disease_treatment: { 
      detected: boolean; 
      name: string; 
      cause: string; 
      steps: string[]; 
  };
  deep_propagation: { 
      seed_treatment: string; 
      propagation_source: string; 
      special_technique: string; 
      step_by_step: string; 
  };
  action_timeline: { 
      period: string; 
      action: string; 
      details: string; 
      formula?: string; 
      benefit?: string; 
      checkpoint?: string; 
  }[];
  resilience_profile: { [key: string]: { level: string; advice: string } };
  transplant_advice: { needed: boolean; trigger: string; method: string };
  env_summary: { temp: string; light: string };
  soil_summary: string;
  soil_adjustment_detailed: string; 
}

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  usage_daily: number;
  limit_daily: number;
}

// ==========================================
// 2. Simple Charts
// ==========================================
const SimplePieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let cumulativePercent = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-32 h-32">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
          {data.map((slice, i) => {
            const start = [Math.cos(2 * Math.PI * cumulativePercent), Math.sin(2 * Math.PI * cumulativePercent)];
            cumulativePercent += slice.value / total;
            const end = [Math.cos(2 * Math.PI * cumulativePercent), Math.sin(2 * Math.PI * cumulativePercent)];
            const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
            return <path key={i} d={`M 0 0 L ${start[0]} ${start[1]} A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]} Z`} fill={slice.color} stroke="#1e293b" strokeWidth="0.02" />;
          })}
        </svg>
      </div>
      <div className="space-y-1">
        {data.map((d, i) => <div key={i} className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full" style={{backgroundColor:d.color}}></span><span className="text-slate-300">{d.label}: {d.value}</span></div>)}
      </div>
    </div>
  );
};

const SimpleBarChart = ({ users }: { users: User[] }) => {
  return (
    <div className="w-full space-y-3">
      {users.map((u, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <div className="w-20 text-slate-400 truncate text-right">{u.username}</div>
          <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden relative">
            <div className={`h-full rounded-full transition-all ${u.usage_daily > u.limit_daily * 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min((u.usage_daily/u.limit_daily)*100, 100)}%`}}></div>
          </div>
          <div className="w-16 text-slate-300 text-xs">{u.usage_daily}/{u.limit_daily}</div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 3. Translations
// ==========================================
const translations = {
  th: {
    title: "Agri Goal AI Pro (Yanapanya)", login: "เข้าสู่ระบบ", register: "ลงทะเบียน",
    username: "ชื่อผู้ใช้", password: "รหัสผ่าน",
    plant: "ชื่อพืช", region: "จังหวัด/พื้นที่", country: "ประเทศ",
    env: "สภาพแวดล้อม", system: "ระบบปลูก",
    analyzeBtn: "วิเคราะห์ระดับปรมาจารย์ (Master Analysis)", analyzing: "กำลังเขียนตำราปลูกอย่างละเอียด...",
    upload: "อัปโหลดรูป", imgSelected: "เลือกรูปแล้ว",
    print: "พิมพ์รายงาน", export: "บันทึกไฟล์", qr: "สร้าง QR Code",
    logout: "ออกจากระบบ", adminPanel: "ระบบจัดการ (Admin)", appView: "หน้าใช้งาน",
    outdoor_sun: "กลางแจ้ง (แดดจัด)", outdoor_shade: "กลางแจ้ง (ร่มรำไร)",
    greenhouse: "โรงเรือน", indoor_room: "ในอาคาร",
    soil: "ลงดิน", pot: "กระถาง", hydroponics: "ไฮโดรโปนิกส์",
    feasibility: "บทวิเคราะห์ความเป็นไปได้", vital: "ข้อมูลจำเพาะ (Vital Stats)",
    soilMix: "สูตรผสมดิน & วัสดุปลูก", fert: "ตารางปุ๋ย & การบำรุง",
    organic: "คัมภีร์เกษตรอินทรีย์ & ภูมิปัญญา", pest: "สมุนไพรไล่แมลง", micro: "เทคนิคจุลินทรีย์",
    deepProp: "ศาสตร์การขยายพันธุ์", timeline: "ปฏิทินการปลูก (Master Timeline)", resilience: "ความทนทาน",
    transplant: "เทคนิคการย้ายปลูก", disease: "การวินิจฉัยและรักษาโรค (ละเอียด)",
    seedPrep: "การเตรียมเมล็ด/ต้นพันธุ์", method: "เทคนิคหลัก", steps: "ขั้นตอนปฏิบัติ",
    soilAdj: "การปรับปรุงโครงสร้างดิน"
  },
  en: {
    title: "Agri Goal AI Pro (Yanapanya)", login: "Login", register: "Register",
    username: "Username", password: "Password",
    plant: "Plant Name", region: "Region", country: "Country",
    env: "Environment", system: "System",
    analyzeBtn: "Master Analysis", analyzing: "Creating Master Plan...",
    upload: "Upload Image", imgSelected: "Image Selected",
    print: "Print Report", export: "Save Text", qr: "Get QR Code",
    logout: "Logout", adminPanel: "Admin Panel", appView: "App View",
    outdoor_sun: "Outdoor (Sun)", outdoor_shade: "Outdoor (Shade)",
    greenhouse: "Greenhouse", indoor_room: "Indoor",
    soil: "Soil", pot: "Pot", hydroponics: "Hydroponics",
    feasibility: "Feasibility", vital: "Vital Stats",
    soilMix: "Soil Mix Recipe", fert: "Fertilizer Schedule",
    organic: "Organic Bible", pest: "Pest Control", micro: "Microorganisms",
    deepProp: "Deep Propagation", timeline: "Master Timeline", resilience: "Resilience",
    transplant: "Transplanting", disease: "Detailed Disease Diagnosis",
    seedPrep: "Seed Preparation", method: "Core Technique", steps: "Detailed Steps",
    soilAdj: "Soil Remediation"
  },
  zh: {
    title: "Agri Goal AI Pro (Yanapanya)", login: "登录", register: "注册",
    username: "用户名", password: "密码",
    plant: "植物名称", region: "地区", country: "国家",
    env: "环境", system: "种植系统",
    analyzeBtn: "大师级分析", analyzing: "分析中...",
    upload: "上传图片", imgSelected: "已选图片",
    print: "打印报告", export: "保存文件", qr: "生成二维码",
    logout: "登出", adminPanel: "管理面板", appView: "应用视图",
    outdoor_sun: "户外 (全日照)", outdoor_shade: "户外 (半遮阴)",
    greenhouse: "温室", indoor_room: "室内",
    soil: "土壤", pot: "盆栽", hydroponics: "水培",
    feasibility: "可行性", vital: "关键数据",
    soilMix: "土壤配方", fert: "施肥指南",
    organic: "有机圣经", pest: "驱虫", micro: "微生物",
    deepProp: "繁殖", timeline: "时间表", resilience: "抗性",
    transplant: "移栽", disease: "病害检测",
    seedPrep: "种子处理", method: "方法", steps: "步骤",
    soilAdj: "土壤改良"
  }
};

const API_URL = 'http://localhost:3000/api';

const App: React.FC = () => {
  const [lang, setLang] = useState<'th' | 'en' | 'zh'>('th');
  const t = translations[lang];

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [view, setView] = useState<'app' | 'admin'>('app');

  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  const [plant, setPlant] = useState('');
  const [country, setCountry] = useState('Thailand');
  const [region, setRegion] = useState('');
  const [env, setEnv] = useState('outdoor_sun');
  const [system, setSystem] = useState('soil');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthMsg('');
    try {
      const endpoint = isLoginView ? '/login' : '/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (isLoginView) {
        localStorage.setItem('token', data.token); localStorage.setItem('role', data.role); localStorage.setItem('username', data.username);
        setToken(data.token); setRole(data.role); setUsername(data.username);
        if(data.role === 'admin') setView('admin');
      } else {
        setAuthMsg("Success! Please login."); setIsLoginView(true);
      }
    } catch (err: any) { setAuthMsg(err.message); } finally { setAuthLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); setToken(null); setRole(null); setUsername(null); setResult(null); setView('app'); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // *** SUPER DETAILED PROMPT (Yanapanya + Master Class) ***
  const constructPrompt = () => {
    const targetLang = lang === 'th' ? 'Thai (ภาษาไทย)' : lang === 'zh' ? 'Chinese' : 'English';
    return `
      Role: Grandmaster Agricultural Scientist & Soil Expert (Yanapanya Method).
      Task: Create a "Master-Class Operational Manual" for: "${plant}" in "${region}, ${country}" (${env}, ${system}).
      Output Language: ${targetLang} ONLY.

      **INSTRUCTION FOR EXTREME DETAIL (Must mimic a textbook/manual):**
      1.  **LENGTH:** Do NOT summarize. Write full paragraphs where necessary.
      2.  **RECIPES:** Provide exact ingredients, weights (grams/kg), volumes (liters), and fermentation times (days).
      3.  **STEPS:** Use numbered lists (1., 2., 3.) for every procedure.
      4.  **DISEASE:** If an image is provided, diagnose it. If not, predict the most likely disease. **PROVIDE 5-STEP TREATMENT PLAN.**

      **MANDATORY SECTIONS:**
      - **Soil Adjustment:** How to fix pH? How much lime/sulfur per sq.m.? How to fix clay/sand?
      - **Organic Wisdom:** Recipe for FPJ, IMO, or Compost. Ratio (e.g. 1:3:10).
      - **Disease Treatment:** 1. Sanitation (How?)
          2. Environment (Airflow/Water)
          3. Biological Control (Trichoderma/Bacillus?)
          4. Organic Chemical (Copper/Neem?)
          5. Future Prevention.
      - **Deep Propagation:** Seed soaking temp/time. Cutting angle. Rooting hormone usage.
      - **Timeline:** Weekly breakdown with "Observation Points".

      JSON Schema (Strict):
      {
          "feasibility_check": { "is_possible": boolean, "status_title": "string", "reason": "string (Long detailed explanation)" },
          "vital_stats": { "ideal_temp": "string", "ideal_humidity": "string", "ideal_ph": "string", "soil_type": "string", "sun_requirement": "string" },
          
          "soil_adjustment_detailed": "string (VERY DETAILED: How to test and fix soil problems step-by-step)",
          "soil_composition": { 
              "primary_mix": "string (Exact Ratio e.g. Soil 2 : Leaf Compost 1 : Sand 1)", 
              "amendments": "string (List specific items like Dolomite, Perlite)", 
              "layering": "string" 
          },
          
          "fertilizer_guide": { 
              "veg_stage_npk": "string", 
              "flower_stage_npk": "string", 
              "organic_recipe": "string (FULL RECIPE: Ingredients, Ratios, Fermentation Time, Usage)", 
              "application_frequency": "string" 
          },
          
          "organic_wisdom": { 
              "soil_prep": "string (Traditional Double-Digging or Solarization method details)", 
              "fertilizer_recipe": "string (Alternative bio-fertilizer recipe with exact steps)", 
              "pest_control_recipe": "string (Herbal spray recipe: Ingredients like Galangal, Neem, Molasses + Ratios)", 
              "microorganism_technique": "string (How to make IMO or PSB step-by-step)" 
          },
          
          "disease_treatment": { 
              "detected": boolean, 
              "name": "string (Scientific Name if possible)", 
              "cause": "string", 
              "steps": ["string (Step 1: Sanitation...)", "string (Step 2: Environment...)", "string (Step 3: Biological...)", "string (Step 4: Chemical...)", "string (Step 5: Prevention...)"] 
          },
          
          "deep_propagation": { 
              "seed_treatment": "string (Detailed: Water temp, soaking hours, scarification)", 
              "propagation_source": "string", 
              "special_technique": "string (Detailed technique)", 
              "step_by_step": "string (1. Prepare... 2. Cut... 3. Apply... 4. Wait...)" 
          },
          
          "action_timeline": [ 
             { "period": "string", "action": "string", "formula": "string", "benefit": "string", "checkpoint": "string" } 
          ],
          
          "resilience_profile": { "drought": {"level":"","advice":""}, "flood": {"level":"","advice":""}, "sun": {"level":"","advice":""} },
          "transplant_advice": { "needed": boolean, "trigger": "string", "method": "string" },
          "env_summary": { "temp": "string", "light": "string" },
          "soil_summary": "string"
      }
    `;
  };

  const handleAnalyze = async () => {
    if (!plant) { setError("Please enter plant name"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: constructPrompt(), imageBase64: imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) { setError(err.message); if(err.message.includes('Auth')) handleLogout(); } finally { setLoading(false); }
  };

  const loadAdminData = async () => {
    if (role !== 'admin') return;
    try {
        const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) setAdminUsers(await res.json());
        else {
            setAdminUsers([
                { id: 1, username: 'admin', role: 'admin', status: 'approved', usage_daily: 5, limit_daily: 999 },
                { id: 2, username: 'user01', role: 'user', status: 'approved', usage_daily: 8, limit_daily: 10 },
            ]);
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if(view === 'admin') loadAdminData(); }, [view]);

  const handleUpdateLimit = async (userId: number, newLimit: string) => {
      const limitNum = parseInt(newLimit); if(isNaN(limitNum)) return;
      setAdminUsers(adminUsers.map(u => u.id === userId ? { ...u, limit_daily: limitNum } : u));
      await fetch(`${API_URL}/admin/update-limit`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ userId, limit: limitNum }) });
  };

  const handleResetUsage = async (userId: number) => {
      setAdminUsers(adminUsers.map(u => u.id === userId ? { ...u, usage_daily: 0 } : u));
  };

  const handleStatusUpdate = async (id: number, status: string) => {
      setAdminUsers(adminUsers.map(u => u.id === id ? { ...u, status } : u));
      await fetch(`${API_URL}/admin/update-status`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ userId: id, status }) });
  };

  const handlePrint = () => window.print();
  const handleExport = () => { if(result) { const b = new Blob([JSON.stringify(result, null, 2)],{type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`AgriPlan_${plant}.txt`; a.click(); }};

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans text-[#f8fafc]">
      <div className="bg-[#1e293b] p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">{t.title}</h2>
        <div className="flex justify-center gap-2 mb-4">
            {['th','en','zh'].map(l=><button key={l} onClick={()=>setLang(l as any)} className={`px-2 py-1 rounded text-xs uppercase font-bold transition-colors ${lang===l?'bg-blue-600 text-white':'bg-slate-700 text-slate-400'}`}>{l}</button>)}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
           <input className="w-full p-3 bg-[#334155] border border-slate-600 text-white rounded focus:border-blue-500" placeholder={t.username} value={authUsername} onChange={e=>setAuthUsername(e.target.value)} />
           <input className="w-full p-3 bg-[#334155] border border-slate-600 text-white rounded focus:border-blue-500" type="password" placeholder={t.password} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
           <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded text-white font-bold shadow-lg">{isLoginView ? t.login : t.register}</button>
        </form>
        <p className="text-center text-slate-400 mt-4 cursor-pointer text-sm hover:text-blue-400" onClick={()=>setIsLoginView(!isLoginView)}>{isLoginView ? "Create Account" : "Back to Login"}</p>
        {authMsg && <p className="text-center text-red-400 mt-2 text-sm">{authMsg}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans flex flex-col">
      <nav className="bg-[#1e293b] border-b border-slate-700 sticky top-0 z-50 p-4 no-print shadow-md">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <i className="fa-solid fa-leaf text-green-400 text-xl"></i>
                <div className="flex flex-col">
                    <h1 className="font-bold text-lg hidden md:block text-white leading-tight">{t.title}</h1>
                    <p className="text-[10px] text-slate-400">by Krison useng tell 0988455503.krisonuseng@gmail.com</p>
                </div>
            </div>
            <div className="flex gap-3 items-center">
               <div className="flex bg-[#0f172a] rounded-lg p-1 border border-slate-600">
                  {['th','en','zh'].map(l=><button key={l} onClick={()=>setLang(l as any)} className={`px-3 py-1 rounded-md text-xs uppercase font-bold transition-all ${lang===l?'bg-blue-600 text-white shadow':'text-slate-400 hover:text-white'}`}>{l}</button>)}
               </div>
               {role === 'admin' && (
                   <button onClick={() => setView(view === 'app' ? 'admin' : 'app')} className={`text-xs px-3 py-1.5 rounded border transition-colors ${view === 'admin' ? 'bg-purple-600 text-white border-purple-500' : 'bg-transparent text-purple-400 border-purple-500/50'}`}>
                       {view === 'app' ? <><i className="fa-solid fa-gauge-high mr-1"></i> {t.adminPanel}</> : <><i className="fa-solid fa-house mr-1"></i> {t.appView}</>}
                   </button>
               )}
               <button onClick={handleLogout} className="text-xs bg-red-600/20 text-red-300 px-3 py-1.5 rounded border border-red-500/30 hover:bg-red-600/40">{t.logout}</button>
            </div>
         </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
         {/* ADMIN VIEW */}
         {view === 'admin' ? (
             <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl border border-slate-700 animate-fade-in-up">
                 <h2 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2"><i className="fa-solid fa-users-gear"></i> Admin Commander</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-600"><h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Status</h3><SimplePieChart data={[{ label: 'Approved', value: adminUsers.filter(u=>u.status==='approved').length, color: '#10b981' }, { label: 'Pending', value: adminUsers.filter(u=>u.status==='pending').length, color: '#f59e0b' }, { label: 'Banned', value: adminUsers.filter(u=>u.status==='banned').length, color: '#ef4444' }]} /></div>
                     <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-600"><h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Usage</h3><SimpleBarChart users={adminUsers} /></div>
                 </div>
                 <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="text-slate-400 border-b border-slate-600 text-sm uppercase"><th className="p-3">User</th><th className="p-3">Status</th><th className="p-3 w-48">Usage / Limit (Edit)</th><th className="p-3">Tools</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="text-sm">{adminUsers.map(u => (<tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30"><td className="p-3 font-bold text-slate-200">{u.username} <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded ml-1">{u.role}</span></td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.status==='approved'?'bg-green-900 text-green-400':u.status==='banned'?'bg-red-900 text-red-400':'bg-yellow-900 text-yellow-400'}`}>{u.status}</span></td><td className="p-3"><div className="flex items-center gap-2 bg-[#0f172a] rounded p-1 border border-slate-600 w-fit"><span className={`font-mono text-xs px-2 ${u.usage_daily >= u.limit_daily ? 'text-red-400' : 'text-green-400'}`}>{u.usage_daily}</span>/<input type="number" className="w-16 bg-slate-800 text-white text-center text-xs p-1 rounded focus:bg-slate-700 outline-none" value={u.limit_daily} onChange={(e) => handleUpdateLimit(u.id, e.target.value)} /></div></td><td className="p-3"><button onClick={() => handleResetUsage(u.id)} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-600/40 border border-blue-500/30">Reset</button></td><td className="p-3 flex gap-2 justify-end">{u.status !== 'approved' && <button onClick={()=>handleStatusUpdate(u.id, 'approved')} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">Approve</button>}{u.status !== 'banned' && <button onClick={()=>handleStatusUpdate(u.id, 'banned')} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">Ban</button>}</td></tr>))}</tbody></table></div>
             </div>
         ) : (
         /* APP VIEW */
         <>
             <div className="bg-[#1e293b]/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700 mb-8 no-print">
                <div className="mb-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-6 rounded-xl border border-blue-500/30 flex flex-col md:flex-row gap-6 items-center">
                     <div className="flex-1"><h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2 text-lg"><i className="fa-solid fa-camera-retro"></i> 1. {t.upload}</h3><p className="text-xs text-slate-400">Deep Analysis Support</p></div>
                     <div className="w-full md:w-1/2 h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#334155] transition relative bg-[#334155]/50" onClick={()=>fileInputRef.current?.click()}><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />{imageBase64 ? <img src={imageBase64} alt="Preview" className="w-full h-full object-contain" /> : <div className="text-center"><i className="fa-solid fa-images text-3xl text-slate-500 mb-2"></i><p className="text-sm text-slate-400">{t.upload}</p></div>}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   <div className="md:col-span-2"><label className="text-xs text-blue-400 font-bold uppercase mb-2 block">2. {t.plant}</label><input className="w-full bg-[#334155] border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={plant} onChange={e=>setPlant(e.target.value)} placeholder="e.g. Durian" /></div>
                   <div><label className="text-xs text-blue-400 font-bold uppercase mb-2 block">3. {t.country}</label><select className="w-full bg-[#334155] border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={country} onChange={e=>setCountry(e.target.value)}><option value="Thailand">Thailand</option><option value="China">China</option><option value="USA">USA</option><option value="Japan">Japan</option><option value="Other">Other</option></select></div>
                   <div><label className="text-xs text-blue-400 font-bold uppercase mb-2 block">4. {t.region}</label><input className="w-full bg-[#334155] border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={region} onChange={e=>setRegion(e.target.value)} /></div>
                   <div><label className="text-xs text-blue-400 font-bold uppercase mb-2 block">5. {t.env}</label><select className="w-full bg-[#334155] border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={env} onChange={e=>setEnv(e.target.value)}><option value="outdoor_sun">Outdoor Sun</option><option value="outdoor_shade">Outdoor Shade</option><option value="greenhouse">Greenhouse</option><option value="indoor_room">Indoor</option></select></div>
                   <div><label className="text-xs text-blue-400 font-bold uppercase mb-2 block">6. {t.system}</label><select className="w-full bg-[#334155] border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={system} onChange={e=>setSystem(e.target.value)}><option value="soil">Soil</option><option value="pot">Pot</option><option value="hydroponics">Hydroponics</option></select></div>
                </div>
                <button onClick={handleAnalyze} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2">{loading ? <><i className="fa-solid fa-spinner fa-spin"></i> {t.analyzing}</> : <><i className="fa-solid fa-microscope text-xl"></i> {t.analyzeBtn}</>}</button>
                {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-center rounded-lg animate-pulse">{error}</div>}
             </div>

             {result && (
                <div className="space-y-6 pb-12 animate-fade-in-up">
                   <div className="flex justify-end gap-2 no-print mb-2"><button onClick={()=>setShowQR(true)} className="bg-purple-900/40 text-purple-300 px-4 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-900/60"><i className="fa-solid fa-qrcode mr-2"></i> {t.qr}</button><button onClick={handlePrint} className="bg-blue-900/40 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-900/60"><i className="fa-solid fa-print mr-2"></i> {t.print}</button><button onClick={handleExport} className="bg-green-900/40 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 hover:bg-green-900/60"><i className="fa-solid fa-download mr-2"></i> {t.export}</button></div>
                   
                   {/* 1. Feasibility */}
                   <div className={`p-6 rounded-xl border-l-8 shadow-xl ${result.feasibility_check.is_possible ? 'bg-[#1e293b] border-green-500' : 'bg-red-900/20 border-red-500'}`}><h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${result.feasibility_check.is_possible ? 'text-green-400' : 'text-red-400'}`}><i className={`fa-solid ${result.feasibility_check.is_possible ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> {t.feasibility}: {result.feasibility_check.status_title}</h3><p className="text-slate-300 leading-relaxed whitespace-pre-line">{result.feasibility_check.reason}</p></div>
                   
                   {/* 2. Vital Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{Object.entries(result.vital_stats).map(([k,v]) => (<div key={k} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 text-center shadow-lg"><div className="text-[10px] text-slate-400 uppercase mb-1">{k.replace('ideal_','').replace('_',' ')}</div><div className="font-bold text-slate-200 text-sm">{v}</div></div>))}</div>
                   
                   {/* 3. Soil Adjustment & Mix (Detailed) */}
                   <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 p-6 rounded-xl border border-amber-500/30 shadow-lg">
                      <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2"><i className="fa-solid fa-trowel"></i> {t.soilAdj}</h3>
                      <div className="space-y-4">
                         <div className="bg-black/20 p-4 rounded-lg border border-amber-500/10"><p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{result.soil_adjustment_detailed}</p></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/20 p-3 rounded-lg"><span className="text-xs text-amber-200 font-bold block mb-1">Primary Mix Ratio</span><span className="text-sm text-slate-200">{result.soil_composition.primary_mix}</span></div>
                            <div className="bg-black/20 p-3 rounded-lg"><span className="text-xs text-amber-200 font-bold block mb-1">Amendments</span><span className="text-sm text-slate-200">{result.soil_composition.amendments}</span></div>
                         </div>
                      </div>
                   </div>

                   {/* 4. Fertilizer & Organic Wisdom (Recipes) */}
                   <div className="bg-[#064e3b]/40 p-6 rounded-xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
                      <h3 className="text-xl font-bold text-emerald-300 mb-6 flex items-center gap-2"><i className="fa-solid fa-seedling"></i> {t.organic}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20"><h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><i className="fa-solid fa-flask text-green-400"></i> Chemical NPK</h4><div className="text-sm text-slate-300 mb-2">Veg: <b className="text-white">{result.fertilizer_guide.veg_stage_npk}</b> | Flower: <b className="text-white">{result.fertilizer_guide.flower_stage_npk}</b></div><div className="text-xs text-slate-400">Freq: {result.fertilizer_guide.application_frequency}</div></div>
                         <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20"><h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><i className="fa-solid fa-leaf text-green-400"></i> Organic Recipe</h4><p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{result.fertilizer_guide.organic_recipe}</p></div>
                         <div className="md:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20"><h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><i className="fa-solid fa-shield-virus text-yellow-400"></i> {t.pest} & {t.micro}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p className="text-xs text-emerald-400 font-bold mb-1">Pest Control Recipe</p><p className="text-slate-300 text-sm whitespace-pre-line">{result.organic_wisdom.pest_control_recipe}</p></div><div><p className="text-xs text-emerald-400 font-bold mb-1">Microorganisms (IMO/EM)</p><p className="text-slate-300 text-sm whitespace-pre-line">{result.organic_wisdom.microorganism_technique}</p></div></div></div>
                         <div className="md:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20"><h4 className="font-bold text-white mb-2 text-sm"><i className="fa-solid fa-mountain-sun text-orange-400"></i> Traditional Soil Prep</h4><p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{result.organic_wisdom.soil_prep}</p></div>
                      </div>
                   </div>

                   {/* 5. Deep Propagation (Detailed Steps) */}
                   {result.deep_propagation && (
                      <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 p-6 rounded-xl border border-purple-500/30 shadow-lg">
                         <h3 className="text-lg font-bold text-violet-300 mb-4 flex items-center gap-2"><i className="fa-solid fa-dna"></i> {t.deepProp}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="bg-black/20 p-3 rounded-lg"><p className="text-slate-400 text-xs uppercase font-bold mb-1">Source</p><p className="text-white font-bold">{result.deep_propagation.propagation_source}</p></div>
                            <div className="bg-black/20 p-3 rounded-lg"><p className="text-slate-400 text-xs uppercase font-bold mb-1">Technique</p><p className="text-white font-bold">{result.deep_propagation.special_technique}</p></div>
                         </div>
                         <div className="bg-black/30 p-4 rounded-lg mb-4 border border-white/5"><p className="text-purple-300 text-sm font-bold mb-2 flex items-center gap-2"><i className="fa-solid fa-vial"></i> {t.seedPrep}</p><p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">{result.deep_propagation.seed_treatment}</p></div>
                         <div className="bg-black/20 p-4 rounded-lg"><p className="text-purple-300 text-sm font-bold mb-2">{t.steps}</p><p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{result.deep_propagation.step_by_step}</p></div>
                      </div>
                   )}

                   {/* 6. Timeline */}
                   <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg">
                      <h3 className="text-lg font-bold text-blue-400 mb-6 flex items-center gap-2"><i className="fa-solid fa-calendar-days"></i> {t.timeline}</h3>
                      <div className="relative border-l-2 border-slate-600 ml-3 space-y-8">
                         {result.action_timeline.map((item,i) => (
                            <div key={i} className="pl-6 relative">
                               <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#1e293b]"></div>
                               <span className="inline-block bg-blue-900/50 text-blue-200 text-xs font-bold px-2 py-1 rounded mb-1">{item.period}</span>
                               <h4 className="font-bold text-white text-md">{item.action}</h4>
                               {item.formula && <div className="text-xs text-green-400 mt-1"><i className="fa-solid fa-flask"></i> Formula: {item.formula}</div>}
                               {item.benefit && <div className="text-xs text-blue-300 mt-1"><i className="fa-solid fa-arrow-up"></i> Benefit: {item.benefit}</div>}
                               {item.checkpoint && <div className="text-xs text-yellow-300 mt-1"><i className="fa-solid fa-eye"></i> Check: {item.checkpoint}</div>}
                               {!item.formula && <p className="text-slate-400 text-sm mt-1 whitespace-pre-line">{item.details}</p>}
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* 7. Disease & Prevention (Detailed 5 Steps) */}
                   {result.disease_treatment?.detected && (
                       <div className="bg-red-900/20 border-l-4 border-red-500 p-6 rounded-xl shadow-lg">
                          <h3 className="text-lg font-bold text-red-400 mb-2"><i className="fa-solid fa-triangle-exclamation"></i> {t.disease}: {result.disease_treatment.name}</h3>
                          <p className="text-slate-300 text-sm mb-4">Cause: {result.disease_treatment.cause}</p>
                          <ul className="space-y-3">{result.disease_treatment.steps.map((s,i)=><li key={i} className="text-sm text-slate-200 flex gap-3 items-start"><span className="bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5">{i+1}</span><span className="whitespace-pre-line leading-relaxed">{s}</span></li>)}</ul>
                       </div>
                   )}
                </div>
             )}
         </>
         )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={()=>setShowQR(false)}>
            <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full mx-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
               <h3 className="text-gray-800 font-bold text-xl mb-2">Scan Plan</h3>
               <div className="bg-gray-100 p-2 rounded-lg inline-block mb-4"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`AgriPlan: ${plant}`)}`} alt="QR Code" className="w-48 h-48" /></div>
               <button onClick={()=>setShowQR(false)} className="block w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg">Close</button>
            </div>
         </div>
      )}

      <style>{`
         @media print { .no-print { display: none !important; } body { background: white; color: black; } .bg-[#0f172a], .bg-[#1e293b] { background: white !important; color: black !important; border: 1px solid #ddd; } .text-slate-300, .text-slate-400, .text-white { color: #333 !important; } h1, h2, h3, h4 { color: black !important; } .shadow-xl, .shadow-lg { box-shadow: none !important; } }
         .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
         .whitespace-pre-line { white-space: pre-line; }
      `}</style>
    </div>
  );
};

export default App;