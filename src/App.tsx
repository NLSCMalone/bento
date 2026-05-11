import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBasket, 
  Settings, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Package, 
  Check, 
  X,
  Plus,
  Minus,
  Trash2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bentoService, MenuItem, Order, OrderItem, AdminSettings } from './services/bentoService';
import { cn } from './lib/utils';
import { format } from 'date-fns';

// --- Components ---

const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
    <Link to="/" className="flex items-center gap-2">
      <div className="bg-red-600 p-2 rounded-lg text-white">
        <ChefHat size={20} />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900 font-sans">正忠便當</span>
    </Link>
    <Link to="/admin" className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
      <Settings size={20} />
    </Link>
  </nav>
);

// --- Pages ---

const HomePage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await bentoService.initializeMenuIfEmpty();
      const items = await bentoService.getMenuItems();
      setMenuItems(items);
      setLoading(false);
    };
    loadData();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!customerName || cart.length === 0) return;
    setIsOrdering(true);
    try {
      const orderId = await bentoService.createOrder({
        customerName,
        items: cart,
        totalAmount,
        status: 'pending'
      });
      setOrderSuccess(orderId);
      setCart([]);
      setIsOrderModalOpen(false);
      setCustomerName('');
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-32">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-sans tracking-tight">在地人的口味，出外人的便當</h1>
        <p className="text-gray-500">選擇您喜愛的便當，立即點餐</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
          >
            <div className="aspect-[4/3] bg-gray-50 rounded-xl mb-4 overflow-hidden relative">
              {/* Fake image placeholder with initials since we don't have actual images yet */}
              <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-3xl font-bold italic">
                {item.name.substring(0, 2)}
              </div>
            </div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
              <span className="text-red-600 font-bold font-mono">${item.price}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">正忠精選，在地美味配菜豐富</p>
            <button 
              onClick={() => addToCart(item)}
              className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-100"
            >
              <Plus size={18} /> 加入購物籃
            </button>
          </motion.div>
        ))}
      </div>

      {/* Floating Cart Overlay */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-40 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-600 text-white p-2 rounded-xl relative">
                <ShoppingBasket size={24} />
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">總計</p>
                <p className="text-xl font-bold text-gray-900">${totalAmount}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              結帳 <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">確認訂單</h2>
                  <button onClick={() => setIsOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                          <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.menuItemId)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">點餐人姓名 / 綽號</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="請輸入姓名..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between mb-8 px-2">
                  <span className="text-gray-500 font-medium">應付金額</span>
                  <span className="text-3xl font-black text-red-600 font-mono">${totalAmount}</span>
                </div>

                <button 
                  disabled={!customerName || isOrdering}
                  onClick={handlePlaceOrder}
                  className="w-full bg-red-600 disabled:bg-gray-300 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isOrdering ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>確認送出 <CheckCircle2 size={22} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full text-center relative shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">訂單已送出！</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">您的編號：<span className="font-mono text-gray-900 font-bold">{orderSuccess.slice(-6)}</span><br/>工作人員將盡快為您準備。</p>
              <button 
                onClick={() => setOrderSuccess(null)}
                className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold hover:bg-gray-800 transition-colors"
              >
                關閉
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminSetup, setIsAdminSetup] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminState();
  }, []);

  const checkAdminState = async () => {
    const settings = await bentoService.getAdminSettings();
    setIsAdminSetup(!!settings?.isSetupComplete);
    setLoading(false);
  };

  const handleLogin = async () => {
    const settings = await bentoService.getAdminSettings();
    if (settings?.adminPassword === password) {
      setIsLoggedIn(true);
      loadOrders();
    } else {
      setError('密碼錯誤');
    }
  };

  const handleSetup = async () => {
    if (password.length < 4) {
      setError('密碼至少需 4 位數');
      return;
    }
    await bentoService.setupAdmin(password);
    setIsAdminSetup(true);
    setIsLoggedIn(true);
    loadOrders();
  };

  const loadOrders = async () => {
    const data = await bentoService.getOrders();
    setOrders(data);
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await bentoService.updateOrderStatus(orderId, status);
    loadOrders(); // Refresh
  };

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { label: '待處理', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'preparing': return { label: '製作中', color: 'bg-blue-100 text-blue-700', icon: ChefHat };
      case 'ready': return { label: '可取餐', color: 'bg-green-100 text-green-700', icon: Package };
      case 'completed': return { label: '已完成', color: 'bg-gray-100 text-gray-500', icon: Check };
      case 'cancelled': return { label: '已取消', color: 'bg-red-100 text-red-600', icon: X };
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
        >
          <div className="bg-red-50 text-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdminSetup ? '後台登入' : '初始設定'}
          </h1>
          <p className="text-gray-500 mb-8">
            {isAdminSetup ? '請輸入管理者密碼進以後管理訂單。' : '這是您第一次使用系統，請設定管理者密碼。'}
          </p>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">管理者密碼</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && (isAdminSetup ? handleLogin() : handleSetup())}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all tracking-[0.2em] font-bold"
            />
            {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1 font-medium"><X size={14} /> {error}</p>}
          </div>

          <button 
            onClick={isAdminSetup ? handleLogin : handleSetup}
            className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
          >
            {isAdminSetup ? '登入控制台' : '設定並進入'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">訂單管理中心</h1>
          <p className="text-gray-500">及時監控與更新所有訂單狀態</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={loadOrders} className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
            <Clock size={20} />
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="bg-white border border-gray-200 p-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
            登出
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
            <ShoppingBasket size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium text-lg">目前尚無任何訂單</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = getStatusInfo(order.status);
            const StatusIcon = status.icon;
            return (
              <motion.div 
                layout
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-900 text-white font-mono text-sm px-3 py-1 rounded-lg">
                        #{order.id.slice(-6)}
                      </div>
                      <span className="font-bold text-lg text-gray-900">{order.customerName}</span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">
                        {format(order.createdAt.toDate(), 'HH:mm')}
                      </span>
                    </div>
                    <div className={cn("text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors", status.color)}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6 items-end">
                    <div className="space-y-2">
                       {order.items.map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between text-sm">
                           <span className="text-gray-700 font-medium">
                             {item.name} <span className="text-gray-400">x{item.quantity}</span>
                           </span>
                           <span className="text-gray-400 font-mono">${item.price * item.quantity}</span>
                         </div>
                       ))}
                       <div className="pt-2 border-t border-gray-50 mt-4 flex justify-between">
                         <span className="text-gray-400 font-semibold">總計金額</span>
                         <span className="text-xl font-black text-gray-900 font-mono">${order.totalAmount}</span>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <ChefHat size={16} /> 開始製作
                        </button>
                      )}
                      {(order.status === 'preparing' || order.status === 'pending') && (
                        <button 
                          onClick={() => updateStatus(order.id, 'ready')}
                          className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <Package size={16} /> 標記可取餐
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
                        >
                          <Check size={16} /> 完成訂單
                        </button>
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        
        {/* Simple Footer */}
        <footer className="py-12 border-t border-gray-100 mt-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-400 text-sm">© 2026 正忠便當點單系統. 不需 OAuth，密碼保護管理介面。</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
