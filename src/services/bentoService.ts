import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc,
  query, 
  orderBy, 
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdminSettings {
  adminPassword?: string;
  isSetupComplete: boolean;
}

const MENU_COLLECTION = 'menuItems';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_DOC = 'settings/admin';

export const bentoService = {
  async getMenuItems(): Promise<MenuItem[]> {
    const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async getOrders(): Promise<Order[]> {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
  },

  async getAdminSettings(): Promise<AdminSettings | null> {
    const docSnap = await getDoc(doc(db, SETTINGS_DOC));
    if (docSnap.exists()) {
      return docSnap.data() as AdminSettings;
    }
    return null;
  },

  async setupAdmin(password: string): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC), {
      adminPassword: password, // In a real app we'd hash it, but sticking to basics for now
      isSetupComplete: true
    });
  },

  async initializeMenuIfEmpty(): Promise<void> {
    const menu = await this.getMenuItems();
    if (menu.length === 0) {
      const initialItems = [
        { name: "宮保雞丁飯", price: 100 },
        { name: "三杯雞肉飯", price: 100 },
        { name: "爌肉飯", price: 100 },
        { name: "正忠排骨飯", price: 100 },
        { name: "黑胡椒豬排飯", price: 100 },
        { name: "鮮魚飯", price: 105 },
        { name: "糖醋小排飯", price: 100 },
        { name: "雞排飯", price: 110 },
        { name: "炸雞腿飯", price: 115 },
        { name: "燒雞腿飯", price: 115 },
        { name: "大比目魚飯", price: 120 },
        { name: "精緻便當", price: 155 },
      ];
      
      for (const item of initialItems) {
        await addDoc(collection(db, MENU_COLLECTION), item);
      }
    }
  }
};
