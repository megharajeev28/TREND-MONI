import React, { useState, useEffect, createContext, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, addDoc, getDocs } from 'firebase/firestore';

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Context for Auth and Firestore
const AppContext = createContext(null);

// --- Enhanced Mock Data Generation (Simulating Web Scraping) ---
const generateMockData = (companyNiche) => {
    const niches = Array.isArray(companyNiche) ? companyNiche : [companyNiche];
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-07-31');
    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        dateRange.push(new Date(d).toISOString().split('T')[0]);
    }

    const trends = niches.flatMap(niche => [
        {
            id: `trend-${niche}-1`,
            topic: niche,
            title: `Rise of Sustainable ${niche} Practices`,
            summary: `Influencers are increasingly focusing on eco-friendly and sustainable products within the ${niche} industry. This trend shows high engagement, particularly on Instagram and YouTube.`,
            insights: ['Increased demand for ethical sourcing', 'Growth in DIY content related to sustainability', 'Brands adopting greener messaging'],
            sentiment: 'Positive',
            date: '2025-07-28'
        },
        {
            id: `trend-${niche}-2`,
            topic: niche,
            title: `AI Integration in ${niche} Content Creation`,
            summary: `Discussions around AI tools for content creation, from scriptwriting to image generation, are gaining traction among ${niche} influencers.`,
            insights: ['AI-powered editing tools are popular', 'Concerns about authenticity vs. efficiency', `Tutorials on using AI for ${niche} specific tasks`],
            sentiment: 'Neutral',
            date: '2025-07-25'
        },
        {
            id: `trend-${niche}-3`,
            topic: niche,
            title: `Micro-Influencers Dominate ${niche} Niche`,
            summary: `The focus is shifting from mega-influencers to micro-influencers for deeper engagement and niche-specific audience reach in ${niche}.`,
            insights: ['Higher ROI for micro-influencer campaigns', 'Authenticity drives engagement', 'Community building is key'],
            sentiment: 'Positive',
            date: '2025-07-22'
        },
    ]);

    const influencers = niches.flatMap((niche, index) => [
        {
            id: `inf-${niche}-1`,
            name: `Eco${niche}Guru`,
            niche: niche,
            platform: 'Instagram',
            followers: Math.floor(Math.random() * 500000) + 100000,
            engagementRate: (Math.random() * 3 + 2).toFixed(2), // 2-5%
            profilePic: `https://placehold.co/100x100/A78BFA/ffffff?text=${niche[0]}I1`, // Placeholder image
            recentPosts: [
                { date: '2025-07-29', content: `Exploring sustainable ${niche} brands! #sustainable${niche}` },
                { date: '2025-07-27', content: `DIY ${niche} tips for a greener lifestyle.` }
            ]
        },
        {
            id: `inf-${niche}-2`,
            name: `Tech${niche}Innovator`,
            niche: niche,
            platform: 'YouTube',
            followers: Math.floor(Math.random() * 1000000) + 200000,
            engagementRate: (Math.random() * 1.5 + 1).toFixed(2), // 1-2.5%
            profilePic: `https://placehold.co/100x100/818CF8/ffffff?text=${niche[0]}I2`, // Placeholder image
            recentPosts: [
                { date: '2025-07-30', content: `Reviewing the latest AI tools for ${niche} content.` },
                { date: '2025-07-28', content: `My thoughts on the future of ${niche} with AI.` }
            ]
        },
        {
            id: `inf-${niche}-3`,
            name: `LinkedIn${niche}Pro`,
            niche: niche,
            platform: 'LinkedIn',
            followers: Math.floor(Math.random() * 100000) + 20000,
            engagementRate: (Math.random() * 0.5 + 0.5).toFixed(2), // 0.5-1%
            profilePic: `https://placehold.co/100x100/C084FC/ffffff?text=${niche[0]}I3`, // Placeholder image
            recentPosts: [
                { date: '2025-07-26', content: `The power of niche communities in ${niche} marketing.` },
                { date: '2025-07-24', content: `Why micro-influencers are key for B2B ${niche}.` }
            ]
        },
    ]);

    const growthData = dateRange.map(date => ({
        date,
        reach: Math.floor(Math.random() * 500000) + 100000,
        engagement: Math.floor(Math.random() * 50000) + 10000,
        profit: Math.floor(Math.random() * 10000) + 5000
    }));

    const competitors = niches.flatMap(niche => [
        {
            id: `comp-${niche}-1`,
            name: `Global ${niche} Co.`,
            niche: niche,
            recentCampaign: `Launched a major campaign on TikTok promoting their new sustainable line.`,
            estimatedReach: '5M+',
            platforms: ['TikTok', 'Instagram'],
            growthData: dateRange.map(date => ({
                date,
                reach: Math.floor(Math.random() * 400000) + 80000,
                engagement: Math.floor(Math.random() * 40000) + 8000,
                profit: Math.floor(Math.random() * 8000) + 4000
            }))
        },
        {
            id: `comp-${niche}-2`,
            name: `Innovate ${niche} Solutions`,
            niche: niche,
            recentCampaign: `Partnered with a leading AI firm to integrate AI into their product development and marketing.`,
            estimatedReach: '2M+',
            platforms: ['LinkedIn', 'YouTube'],
            growthData: dateRange.map(date => ({
                date,
                reach: Math.floor(Math.random() * 600000) + 120000,
                engagement: Math.floor(Math.random() * 60000) + 12000,
                profit: Math.floor(Math.random() * 12000) + 6000
            }))
        },
    ]);

    const notifications = [
        { id: 'notif1', message: `New trend brief available for ${niches[0]}!`, date: '2025-07-31' },
        { id: 'notif2', message: `Competitor 'Global ${niches[0]} Co.' launched a new campaign.`, date: '2025-07-30' },
        { id: 'notif3', message: `Your engagement rate in ${niches[0]} has increased by 1.2% this week!`, date: '2025-07-29' },
    ];


    return { trends, influencers, growthData, competitors, notifications };
};

// --- Auth and Firestore Provider ---
const AppProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [companyData, setCompanyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing. Please ensure __firebase_config is provided.");
            setIsLoading(false);
            return;
        }

        const firebaseApp = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(firebaseApp);
        const firebaseAuth = getAuth(firebaseApp);

        setApp(firebaseApp);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
                const companyDocRef = doc(firestoreDb, `artifacts/${appId}/users/${user.uid}/companyData/profile`);
                const companyDocSnap = await getDoc(companyDocRef);
                if (companyDocSnap.exists()) {
                    setCompanyData(companyDocSnap.data());
                } else {
                    // This case handles when a user is authenticated but has no profile data yet.
                    // It's important for the demo login simulation.
                    // If email is the demo email, we'll create a mock profile.
                    if (user.email === 'demo@trendmoni.io') {
                        const demoCompanyData = {
                            companyName: "Demo Company",
                            email: "demo@trendmoni.io",
                            selectedNiches: ["Tech", "Fashion"],
                            userId: user.uid,
                            createdAt: new Date().toISOString(),
                            emailNotifications: true
                        };
                        await setDoc(companyDocRef, demoCompanyData);
                        setCompanyData(demoCompanyData);
                    } else {
                        setCompanyData(null);
                    }
                }
            } else {
                setUserId(null);
                setCompanyData(null);
            }
            setIsAuthReady(true);
            setIsLoading(false);
        });

        const signIn = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            } catch (error) {
                console.error("Error signing in:", error);
                await signInAnonymously(firebaseAuth);
            }
        };
        signIn();

        return () => unsubscribe();
    }, []);

    const value = { app, db, auth, userId, isAuthReady, companyData, setCompanyData, isLoading };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- SVG Icons ---
const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.052 10.052 0 013.498-5.36M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.582 17.582A10.052 10.052 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.052 10.052 0 013.498-5.36m1.88-1.88A10.01 10.01 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7a10.01 10.01 0 01-2.04-.25" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
);

// --- Components ---
const AuthPage = () => {
    const { auth, db, setCompanyData, isAuthReady } = useContext(AppContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [selectedNiches, setSelectedNiches] = useState([]);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', isError: false });

    const availableNiches = ['Fashion', 'Tech', 'Education', 'Food'];

    const handleNicheChange = (e) => {
        const { value, checked } = e.target;
        setSelectedNiches(prev => checked ? [...prev, value] : prev.filter(n => n !== value));
    };

    const showMessageModal = (title, msg, isError = false) => {
        setModalContent({ title, message: msg, isError });
        setShowModal(true);
    };

    const validatePassword = (pass) => {
        const errors = [];
        if (pass.length < 8) errors.push("at least 8 characters");
        if (!/[A-Z]/.test(pass)) errors.push("an uppercase letter");
        if (!/[a-z]/.test(pass)) errors.push("a lowercase letter");
        if (!/\d/.test(pass)) errors.push("a number");
        if (!/[@$!%*?&]/.test(pass)) errors.push("a special character (@$!%*?&)");
        return errors;
    };

    const handleAuth = async () => {
        if (!isAuthReady || !auth || !db) {
            showMessageModal("Error", "Authentication not ready. Please try again.", true);
            return;
        }

        try {
            if (isLogin) {
                // --- Demo Login Logic ---
                if (email === 'demo@trendmoni.io' && password === 'Password123!') {
                    // In a real app: await signInWithEmailAndPassword(auth, email, password);
                    // For demo, we simulate a successful login which will be handled by onAuthStateChanged
                    // To trigger the listener, we can re-create a mock user profile if it doesn't exist
                    const mockUserId = 'demo-user-id'; // A consistent mock ID
                    const companyDocRef = doc(db, `artifacts/${appId}/users/${mockUserId}/companyData/profile`);
                    const companyDocSnap = await getDoc(companyDocRef);
                    if (!companyDocSnap.exists()) {
                         const demoCompanyData = {
                            companyName: "Demo Company",
                            email: "demo@trendmoni.io",
                            selectedNiches: ["Tech", "Fashion"],
                            userId: mockUserId,
                            createdAt: new Date().toISOString(),
                            emailNotifications: true
                        };
                        await setDoc(companyDocRef, demoCompanyData);
                        setCompanyData(demoCompanyData);
                    }
                    showMessageModal("Login Successful", "Welcome back!");
                } else {
                    showMessageModal("Login Failed", "User does not exist. Please check your credentials or sign up.", true);
                }
            } else {
                // --- Sign Up Logic ---
                const passwordErrors = validatePassword(password);
                if (passwordErrors.length > 0) {
                    showMessageModal("Weak Password", `Password must contain ${passwordErrors.join(', ')}.`, true);
                    return;
                }
                if (!companyName || selectedNiches.length === 0) {
                    showMessageModal("Input Error", "Please fill in company name and select at least one niche.", true);
                    return;
                }

                // In a real app: const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // const currentUserId = userCredential.user.uid;
                const currentUserId = auth.currentUser?.uid || crypto.randomUUID();
                const companyDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/companyData/profile`);
                const newCompanyData = {
                    companyName,
                    email,
                    selectedNiches,
                    userId: currentUserId,
                    createdAt: new Date().toISOString(),
                    emailNotifications
                };
                await setDoc(companyDocRef, newCompanyData);
                setCompanyData(newCompanyData);
                showMessageModal("Signup Successful", "Your company profile has been created!");
            }
        } catch (error) {
            console.error("Auth error:", error);
            showMessageModal("Authentication Error", error.message, true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-purple-900 p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-purple-700 backdrop-blur-sm bg-opacity-80">
                <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
                    {isLogin ? 'Welcome Back' : 'Join Trend-Moni'}
                </h2>
                {!isLogin && (
                    <div className="mb-5">
                        <label className="block text-gray-300 text-sm font-semibold mb-2" htmlFor="companyName">Company Name</label>
                        <input type="text" id="companyName" className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 bg-opacity-60 placeholder-gray-400 transition duration-300" placeholder="Your Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required={!isLogin} />
                    </div>
                )}
                <div className="mb-5">
                    <label className="block text-gray-300 text-sm font-semibold mb-2" htmlFor="email">Email</label>
                    <input type="email" id="email" className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 bg-opacity-60 placeholder-gray-400 transition duration-300" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-6 relative">
                    <label className="block text-gray-300 text-sm font-semibold mb-2" htmlFor="password">Password</label>
                    <input type={passwordVisible ? "text" : "password"} id="password" className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 bg-opacity-60 placeholder-gray-400 transition duration-300" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-400 hover:text-blue-300" aria-label="Toggle password visibility">
                        {passwordVisible ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                    </button>
                    {!isLogin && (
                        <p className="text-xs text-gray-400 mt-2">Must contain 8+ characters, uppercase, lowercase, number, and special character.</p>
                    )}
                </div>
                {!isLogin && (
                    <>
                        <div className="mb-6">
                            <label className="block text-gray-300 text-sm font-semibold mb-3">Select Your Niche(s)</label>
                            <div className="flex flex-wrap gap-3">
                                {availableNiches.map(niche => (
                                    <label key={niche} className="inline-flex items-center text-gray-200 cursor-pointer">
                                        <input type="checkbox" value={niche} checked={selectedNiches.includes(niche)} onChange={handleNicheChange} className="form-checkbox h-5 w-5 text-blue-500 rounded-md focus:ring-blue-400 bg-gray-700 border-gray-600 transition duration-200" />
                                        <span className="ml-2 text-base">{niche}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="inline-flex items-center text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-500 rounded-md focus:ring-blue-400 bg-gray-700 border-gray-600 transition duration-200" />
                                <span className="ml-3 text-base">Receive trend updates via email every 48 hours</span>
                            </label>
                        </div>
                    </>
                )}
                <div className="flex flex-col space-y-4">
                    <button onClick={handleAuth} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                    <button onClick={() => setIsLogin(!isLogin)} className="inline-block align-baseline font-semibold text-sm text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out">
                        {isLogin ? 'New here? Create an account!' : 'Already a member? Login'}
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className={`bg-gray-800 p-8 rounded-xl shadow-2xl border ${modalContent.isError ? 'border-red-500' : 'border-purple-600'} max-w-sm w-full backdrop-blur-sm bg-opacity-90`}>
                        <h3 className={`text-2xl font-bold mb-4 text-center ${modalContent.isError ? 'text-red-400' : 'text-blue-300'}`}>{modalContent.title}</h3>
                        <p className="text-gray-200 mb-6 text-center">{modalContent.message}</p>
                        <button onClick={() => setShowModal(false)} className={`font-bold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out transform hover:scale-105 ${modalContent.isError ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'}`}>
                            Got It!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const HomePage = ({ companyName, selectedNiches }) => {
    return (
        <div className="p-8 bg-gray-800 bg-opacity-70 rounded-2xl shadow-xl border border-purple-700 text-center">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-6">
                Welcome, {companyName}!
            </h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Your personalized Trend-Moni dashboard is ready. We're tracking the latest trends in{' '}
                <span className="font-semibold text-blue-200">{selectedNiches.join(', ')}</span> for you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-gray-700 bg-opacity-60 p-5 rounded-lg border border-gray-600">
                    <h3 className="text-xl font-bold text-blue-300 mb-3">Recent Trends</h3>
                    <p className="text-gray-400">Get a concise brief on emerging trends in your niche, updated every 48 hours.</p>
                </div>
                <div className="bg-gray-700 bg-opacity-60 p-5 rounded-lg border border-gray-600">
                    <h3 className="text-xl font-bold text-purple-300 mb-3">Influencer Insights</h3>
                    <p className="text-gray-400">Discover key influencers and their content across YouTube, Instagram, and LinkedIn.</p>
                </div>
                <div className="bg-gray-700 bg-opacity-60 p-5 rounded-lg border border-gray-600">
                    <h3 className="text-xl font-bold text-blue-300 mb-3">Company Growth</h3>
                    <p className="text-gray-400">Track your promotional growth and profit with insightful graphs.</p>
                </div>
                <div className="bg-gray-700 bg-opacity-60 p-5 rounded-lg border border-gray-600">
                    <h3 className="text-xl font-bold text-purple-300 mb-3">Competitor Analysis</h3>
                    <p className="text-gray-400">Stay ahead by monitoring your competitors' marketing strategies and growth.</p>
                </div>
            </div>
            <p className="text-gray-400 text-sm mt-8">
                **Trend-Moni's AI Agent:** Our multi-agent system (Scout, Analyst, Reporter) works tirelessly to provide you with curated insights, summarized content, and trend briefs delivered directly to your web app and via email every 48 hours.
            </p>
        </div>
    );
};


const Dashboard = () => {
    const { companyData, userId, auth } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('home');
    const [mockAgentData, setMockAgentData] = useState(null);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);

    useEffect(() => {
        if (companyData && companyData.selectedNiches) {
            setMockAgentData(generateMockData(companyData.selectedNiches));
        }
    }, [companyData]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const renderContent = () => {
        if (!mockAgentData && activeTab !== 'home' && activeTab !== 'profile') {
            return <div className="text-gray-300 text-center p-8 text-xl">Loading agent data...</div>;
        }
        switch (activeTab) {
            case 'home':
                return <HomePage companyName={companyData.companyName} selectedNiches={companyData.selectedNiches} />;
            case 'recentTrends':
                return <RecentTrends trends={mockAgentData.trends} />;
            case 'influencersInfo':
                return <InfluencersInfo influencers={mockAgentData.influencers} />;
            case 'companyGrowth':
                return <CompanyGrowth growthData={mockAgentData.growthData} />;
            case 'competitors':
                return <CompetitorsInfo companyGrowthData={mockAgentData.growthData} competitors={mockAgentData.competitors} />;
            case 'recommendations':
                return <RecommendationsPage companyGrowthData={mockAgentData.growthData} competitors={mockAgentData.competitors} />;
            case 'profile':
                return <ProfilePage />;
            default:
                return <HomePage companyName={companyData.companyName} selectedNiches={companyData.selectedNiches} />;
        }
    };

    if (!companyData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-purple-900 text-blue-300 text-2xl font-semibold">
                Please complete your company profile to access the dashboard.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-gray-100 flex flex-col lg:flex-row">
            <nav className="bg-gray-800 bg-opacity-80 lg:w-72 p-6 flex flex-col shadow-xl border-r border-purple-800 rounded-tr-3xl rounded-br-3xl m-4 lg:m-0 lg:rounded-none">
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-10 text-center">
                    Trend-Moni
                </div>
                <ul className="space-y-3 flex-grow">
                    {['home', 'recentTrends', 'influencersInfo', 'companyGrowth', 'competitors', 'recommendations', 'profile'].map(tab => (
                        <li key={tab}>
                            <button
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left py-3 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105
                                    ${activeTab === tab
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-blue-300'
                                    }`}
                            >
                                {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </button>
                        </li>
                    ))}
                    <li className="pt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left py-3 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 bg-red-700 hover:bg-red-800 text-white shadow-lg"
                        >
                            Logout
                        </button>
                    </li>
                </ul>
                <div className="mt-10 p-4 bg-gray-700 bg-opacity-60 rounded-lg text-sm text-gray-400 text-center border border-gray-600">
                    <p className="font-semibold text-gray-300 mb-1">Company: {companyData.companyName}</p>
                    <p className="mb-1">Niche(s): {companyData.selectedNiches.join(', ')}</p>
                    <p className="break-all text-xs">User ID: {userId}</p>
                </div>
            </nav>

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                <header className="mb-8 pb-4 border-b border-gray-700 flex justify-between items-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                        {activeTab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h1>
                    <div className="relative">
                        <button onClick={() => setShowNotificationsModal(true)} className="text-gray-300 hover:text-blue-300 transition duration-300 relative" aria-label="Notifications">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                            {mockAgentData && mockAgentData.notifications.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                    {mockAgentData.notifications.length}
                                </span>
                            )}
                        </button>
                    </div>
                </header>
                {renderContent()}

                {showNotificationsModal && mockAgentData && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-purple-600 max-w-lg w-full backdrop-blur-sm bg-opacity-90">
                            <h3 className="text-2xl font-bold text-blue-300 mb-6 text-center">Notifications</h3>
                            {mockAgentData.notifications.length > 0 ? (
                                <ul className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                    {mockAgentData.notifications.map(notif => (
                                        <li key={notif.id} className="bg-gray-700 bg-opacity-60 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-200 text-base">{notif.message}</p>
                                            <p className="text-gray-400 text-xs mt-1 text-right">{notif.date}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-center">No new notifications.</p>
                            )}
                            <button onClick={() => setShowNotificationsModal(false)} className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out transform hover:scale-105">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- Other Components (RecentTrends, InfluencersInfo, etc.) remain largely the same ---

const RecentTrends = ({ trends }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trends.map(trend => (
            <div key={trend.id} className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-purple-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">{trend.title}</h3>
                <p className="text-gray-300 mb-5 leading-relaxed">{trend.summary}</p>
                <div className="mb-4">
                    <span className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full shadow-md
                        ${trend.sentiment === 'Positive' ? 'bg-green-600 text-white' :
                          trend.sentiment === 'Neutral' ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'}`}>
                        Sentiment: {trend.sentiment}
                    </span>
                </div>
                <h4 className="text-xl font-semibold text-blue-200 mb-3">Key Insights:</h4>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-base">
                    {trend.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                    ))}
                </ul>
                <p className="text-xs text-gray-500 mt-5 text-right opacity-80">Report Date: {trend.date}</p>
            </div>
        ))}
    </div>
);

const InfluencersInfo = ({ influencers }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {influencers.map(influencer => (
            <div key={influencer.id} className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-blue-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
                <img src={influencer.profilePic} alt={influencer.name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-purple-500 shadow-md" />
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-3">{influencer.name}</h3>
                <p className="text-gray-300 mb-2"><span className="font-semibold text-blue-200">Niche:</span> {influencer.niche}</p>
                <p className="text-gray-300 mb-2"><span className="font-semibold text-blue-200">Platform:</span> {influencer.platform}</p>
                <p className="text-gray-300 mb-2"><span className="font-semibold text-blue-200">Followers:</span> {influencer.followers.toLocaleString()}</p>
                <p className="text-gray-300 mb-5"><span className="font-semibold text-blue-200">Engagement Rate:</span> {influencer.engagementRate}%</p>
                <h4 className="text-xl font-semibold text-purple-200 mb-3">Recent Posts:</h4>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm text-left w-full">
                    {influencer.recentPosts.map((post, i) => (
                        <li key={i}>
                            <span className="font-medium text-gray-300">[{post.date}]</span> {post.content}
                        </li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);

const CompanyGrowth = ({ growthData }) => (
    <div className="space-y-8">
        <div className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-purple-700">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-5">Company Reach & Engagement</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={growthData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#8884d8" label={{ value: 'Reach', angle: -90, position: 'insideLeft', fill: '#8884d8' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Engagement', angle: 90, position: 'insideRight', fill: '#82ca9d' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #6b21a8', borderRadius: '12px', padding: '10px' }} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#a78bfa' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="reach" stroke="#a78bfa" strokeWidth={2} activeDot={{ r: 8 }} name="Total Reach" />
                    <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} name="Engagement" />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-blue-700">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-5">Profit Earned</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={growthData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#ffc658" label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft', fill: '#ffc658' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #6b21a8', borderRadius: '12px', padding: '10px' }} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#a78bfa' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="profit" stroke="#ffc658" strokeWidth={2} activeDot={{ r: 8 }} name="Profit ($)" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const CompetitorsInfo = ({ companyGrowthData, competitors }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {competitors.map(competitor => (
                <div key={competitor.id} className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-purple-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3">{competitor.name}</h3>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-blue-200">Niche:</span> {competitor.niche}</p>
                    <p className="text-gray-300 mb-5"><span className="font-semibold text-blue-200">Recent Campaign:</span> {competitor.recentCampaign}</p>
                    <p className="text-gray-300 mb-2"><span className="font-semibold text-blue-200">Estimated Reach:</span> {competitor.estimatedReach}</p>
                    <p className="text-gray-300"><span className="font-semibold text-blue-200">Platforms:</span> {competitor.platforms.join(', ')}</p>
                </div>
            ))}
        </div>
        <div className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-blue-700 mt-8">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-5">Our Company vs. Competitor Growth (Reach)</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={companyGrowthData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'Reach', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #6b21a8', borderRadius: '12px', padding: '10px' }} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#a78bfa' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="reach" stroke="#a78bfa" strokeWidth={2} name="Our Company Reach" activeDot={{ r: 8 }} />
                    {competitors.map((competitor, idx) => (
                        <Line key={competitor.id} type="monotone" dataKey="reach" stroke={idx % 2 === 0 ? "#ffc658" : "#82ca9d"} strokeWidth={2} name={`${competitor.name} Reach`} data={competitor.growthData} activeDot={{ r: 8 }} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const RecommendationsPage = ({ companyGrowthData, competitors }) => {
    const getRecommendations = () => {
        const ourAvgReach = companyGrowthData.reduce((sum, d) => sum + d.reach, 0) / companyGrowthData.length;
        const competitorAvgReaches = competitors.map(comp => comp.growthData.reduce((sum, d) => sum + d.reach, 0) / comp.growthData.length);
        const maxCompetitorReach = Math.max(...competitorAvgReaches);
        let recommendations = [];
        if (ourAvgReach < maxCompetitorReach * 0.8) {
            recommendations.push({ id: 'rec1', title: 'Boost Organic Reach', description: 'Your average reach is currently lower than key competitors. Focus on creating highly shareable content, optimizing for SEO on YouTube, and engaging directly with your audience on Instagram and LinkedIn to improve organic visibility.', action: 'Implement a content calendar focusing on trending topics and interactive formats (polls, Q&A).' });
        }
        const ourAvgProfit = companyGrowthData.reduce((sum, d) => sum + d.profit, 0) / companyGrowthData.length;
        const competitorAvgProfits = competitors.map(comp => comp.growthData.reduce((sum, d) => sum + d.profit, 0) / comp.growthData.length);
        const maxCompetitorProfit = Math.max(...competitorAvgProfits);
        if (ourAvgProfit < maxCompetitorProfit * 0.9) {
            recommendations.push({ id: 'rec2', title: 'Optimize Influencer ROI', description: 'Review your current influencer partnerships. Consider shifting focus to micro-influencers who often offer higher engagement rates for a lower cost, or negotiate better terms with existing partners.', action: 'Analyze past campaign data to identify top-performing influencers and content types.' });
        }
        recommendations.push({ id: 'rec3', title: 'Leverage AI for Content Ideation', description: 'Competitors are integrating AI into their marketing. Utilize AI tools for generating content ideas, analyzing market trends, and personalizing outreach to your audience.', action: 'Explore AI-powered content creation tools and experiment with AI-driven ad targeting.' });
        if (recommendations.length === 0) {
            return [{ id: 'rec-none', title: 'Great Performance!', description: 'Your company is performing strongly against competitors. Continue to monitor trends and innovate!', action: 'Maintain current strategies and explore new growth avenues.' }];
        }
        return recommendations;
    };
    const recommendations = getRecommendations();
    return (
        <div className="space-y-8">
            <p className="text-gray-300 text-lg leading-relaxed bg-gray-800 bg-opacity-70 p-6 rounded-xl shadow-lg border border-blue-700">Based on your company's performance and competitor activities, here are some actionable recommendations:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recommendations.map(rec => (
                    <div key={rec.id} className="bg-gray-800 bg-opacity-70 p-7 rounded-2xl shadow-xl border border-purple-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">{rec.title}</h3>
                        <p className="text-gray-300 mb-4 leading-relaxed">{rec.description}</p>
                        <p className="text-blue-200 font-semibold text-lg">Action: <span className="text-gray-300">{rec.action}</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { companyData, userId, setCompanyData, db, isAuthReady } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editedCompanyName, setEditedCompanyName] = useState(companyData?.companyName || '');
    const [editedNiches, setEditedNiches] = useState(companyData?.selectedNiches || []);
    const [emailNotifications, setEmailNotifications] = useState(companyData?.emailNotifications ?? true);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });
    const availableNiches = ['Fashion', 'Tech', 'Education', 'Food'];

    useEffect(() => {
        if (companyData) {
            setEditedCompanyName(companyData.companyName);
            setEditedNiches(companyData.selectedNiches);
            setEmailNotifications(companyData.emailNotifications ?? true);
        }
    }, [companyData]);

    const handleNicheChange = (e) => {
        const { value, checked } = e.target;
        setEditedNiches(prev => checked ? [...prev, value] : prev.filter(n => n !== value));
    };

    const showMessageModal = (title, msg) => {
        setModalContent({ title, message: msg });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!isAuthReady || !db || !userId) {
            showMessageModal("Error", "Authentication not ready. Cannot save profile.");
            return;
        }
        if (!editedCompanyName || editedNiches.length === 0) {
            showMessageModal("Input Error", "Company name and at least one niche are required.");
            return;
        }
        try {
            const companyDocRef = doc(db, `artifacts/${appId}/users/${userId}/companyData/profile`);
            const updatedData = { ...companyData, companyName: editedCompanyName, selectedNiches: editedNiches, emailNotifications, updatedAt: new Date().toISOString() };
            await setDoc(companyDocRef, updatedData, { merge: true });
            setCompanyData(updatedData);
            setIsEditing(false);
            showMessageModal("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            showMessageModal("Error", "Failed to update profile: " + error.message);
        }
    };

    if (!companyData) {
        return <div className="text-gray-300">No company profile found. Please complete signup.</div>;
    }

    return (
        <div className="bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-xl border border-purple-700">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-6">Your Company Profile</h3>
            <div className="mb-5">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Company Name:</label>
                {isEditing ? <input type="text" value={editedCompanyName} onChange={(e) => setEditedCompanyName(e.target.value)} className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 bg-opacity-60 placeholder-gray-400 transition duration-300" /> : <p className="text-gray-200 text-xl">{companyData.companyName}</p>}
            </div>
            <div className="mb-5">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Email:</label>
                <p className="text-gray-200 text-xl">{companyData.email}</p>
            </div>
            <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-3">Selected Niche(s):</label>
                {isEditing ? (
                    <div className="flex flex-wrap gap-3">{availableNiches.map(niche => (<label key={niche} className="inline-flex items-center text-gray-200 cursor-pointer"><input type="checkbox" value={niche} checked={editedNiches.includes(niche)} onChange={handleNicheChange} className="form-checkbox h-5 w-5 text-blue-500 rounded-md focus:ring-blue-400 bg-gray-700 border-gray-600 transition duration-200" /><span className="ml-2 text-base">{niche}</span></label>))}</div>
                ) : <p className="text-gray-200 text-xl">{companyData.selectedNiches.join(', ')}</p>}
            </div>
            <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Email Notifications:</label>
                {isEditing ? <label className="inline-flex items-center text-gray-200 cursor-pointer"><input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-500 rounded-md focus:ring-blue-400 bg-gray-700 border-gray-600 transition duration-200" /><span className="ml-2 text-base">Receive trend updates via email</span></label> : <p className="text-gray-200 text-xl">{emailNotifications ? 'Enabled' : 'Disabled'}</p>}
            </div>
            <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Your User ID:</label>
                <p className="text-gray-200 text-sm break-all bg-gray-700 bg-opacity-60 p-3 rounded-lg border border-gray-600">{userId}</p>
            </div>
            <div className="flex justify-end space-x-4">
                {isEditing ? (
                    <><button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">Save Changes</button><button onClick={() => { setIsEditing(false); setEditedCompanyName(companyData.companyName); setEditedNiches(companyData.selectedNiches); setEmailNotifications(companyData.emailNotifications ?? true); }} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">Cancel</button></>
                ) : <button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">Edit Profile</button>}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-purple-600 max-w-sm w-full backdrop-blur-sm bg-opacity-90">
                        <h3 className="text-2xl font-bold text-blue-300 mb-4 text-center">{modalContent.title}</h3>
                        <p className="text-gray-200 mb-6 text-center">{modalContent.message}</p>
                        <button onClick={() => setShowModal(false)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out transform hover:scale-105">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const { companyData, isLoading, isAuthReady } = useContext(AppContext);

    if (isLoading || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-purple-900 text-blue-300 text-3xl font-extrabold animate-pulse">
                Loading Trend-Moni...
            </div>
        );
    }

    return (
        <div className="font-sans antialiased">
            {companyData ? <Dashboard /> : <AuthPage />}
        </div>
    );
};

// Root component for the React app
export default function Root() {
    return (
        <>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <style>
                {`
                body { font-family: 'Inter', sans-serif; }
                ::-webkit-scrollbar { width: 10px; }
                ::-webkit-scrollbar-track { background: #1f2937; }
                ::-webkit-scrollbar-thumb { background: #6b21a8; border-radius: 5px; }
                ::-webkit-scrollbar-thumb:hover { background: #8b5cf6; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #8b5cf6; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a78bfa; }
                `}
            </style>
            <AppProvider>
                <App />
            </AppProvider>
        </>
    );
}
