import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('sen_panier_bio');
  }
  return db;
}

// Helper function to generate UUID-like IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Auth endpoints
async function handleRegister(request) {
  try {
    const body = await request.json();
    const { email, phone, password, name, role, farmInfo, bioStatus } = body;
    
    const db = await connectDB();
    const users = db.collection('users');
    
    // Check if user exists
    const existingUser = await users.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return NextResponse.json({ error: 'Utilisateur déjà existant' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: generateId(),
      email,
      phone,
      password: hashedPassword,
      name,
      role: role || 'consumer',
      farmInfo: farmInfo || null,
      bioStatus: bioStatus || null,
      certificates: [],
      addresses: [],
      createdAt: new Date().toISOString(),
      active: true
    };
    
    await users.insertOne(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}

async function handleLogin(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    const db = await connectDB();
    const users = db.collection('users');
    
    // Find user
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}

// Product endpoints
async function handleGetProducts(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const bioStatus = searchParams.get('bioStatus');
    const search = searchParams.get('search');
    
    const db = await connectDB();
    const products = db.collection('products');
    
    let query = { active: true };
    if (category) query.category = category;
    if (bioStatus) query.bioStatus = bioStatus;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const productList = await products.find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ products: productList });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 });
  }
}

async function handleCreateProduct(request) {
  try {
    const body = await request.json();
    const { name, description, price, category, bioStatus, sellerId, sellerName, location, unit, stock, image } = body;
    
    const db = await connectDB();
    const products = db.collection('products');
    
    const product = {
      id: generateId(),
      name,
      description,
      price: parseFloat(price),
      category,
      bioStatus,
      sellerId,
      sellerName,
      location,
      unit: unit || 'kg',
      stock: parseInt(stock) || 0,
      image: image || null,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      active: true
    };
    
    await products.insertOne(product);
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 });
  }
}

async function handleGetProductsBySeller(request, sellerId) {
  try {
    const db = await connectDB();
    const products = db.collection('products');
    
    const productList = await products.find({ sellerId, active: true }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ products: productList });
  } catch (error) {
    console.error('Get seller products error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 });
  }
}

// Order endpoints
async function handleCreateOrder(request) {
  try {
    const body = await request.json();
    const { userId, userName, items, deliveryAddress, deliveryMethod, paymentMethod, total, deliveryFee } = body;
    
    const db = await connectDB();
    const orders = db.collection('orders');
    
    const order = {
      id: generateId(),
      userId,
      userName,
      items,
      deliveryAddress,
      deliveryMethod,
      paymentMethod,
      subtotal: parseFloat(total) - parseFloat(deliveryFee || 0),
      deliveryFee: parseFloat(deliveryFee || 0),
      total: parseFloat(total),
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await orders.insertOne(order);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}

async function handleGetOrders(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const db = await connectDB();
    const orders = db.collection('orders');
    
    let query = {};
    if (userId) query.userId = userId;
    
    const orderList = await orders.find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ orders: orderList });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 500 });
  }
}

async function handleUpdateOrderStatus(request, orderId) {
  try {
    const body = await request.json();
    const { status, paymentStatus } = body;
    
    const db = await connectDB();
    const orders = db.collection('orders');
    
    const update = {
      updatedAt: new Date().toISOString()
    };
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    
    await orders.updateOne({ id: orderId }, { $set: update });
    const updatedOrder = await orders.findOne({ id: orderId });
    
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la commande' }, { status: 500 });
  }
}

// Review endpoints
async function handleCreateReview(request) {
  try {
    const body = await request.json();
    const { productId, userId, userName, rating, comment } = body;
    
    const db = await connectDB();
    const reviews = db.collection('reviews');
    const products = db.collection('products');
    
    const review = {
      id: generateId(),
      productId,
      userId,
      userName,
      rating: parseInt(rating),
      comment,
      createdAt: new Date().toISOString()
    };
    
    await reviews.insertOne(review);
    
    // Update product rating
    const allReviews = await reviews.find({ productId }).toArray();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await products.updateOne(
      { id: productId },
      { $set: { rating: avgRating, reviewCount: allReviews.length } }
    );
    
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 });
  }
}

async function handleGetReviews(request, productId) {
  try {
    const db = await connectDB();
    const reviews = db.collection('reviews');
    
    const reviewList = await reviews.find({ productId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ reviews: reviewList });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des avis' }, { status: 500 });
  }
}

// Update product
async function handleUpdateProduct(request, productId) {
  try {
    const body = await request.json();
    const { name, description, price, category, bioStatus, location, stock, unit, image, active } = body;
    
    const db = await connectDB();
    const products = db.collection('products');
    
    const update = {
      updatedAt: new Date().toISOString()
    };
    
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (price !== undefined) update.price = parseFloat(price);
    if (category !== undefined) update.category = category;
    if (bioStatus !== undefined) update.bioStatus = bioStatus;
    if (location !== undefined) update.location = location;
    if (stock !== undefined) update.stock = parseInt(stock);
    if (unit !== undefined) update.unit = unit;
    if (image !== undefined) update.image = image;
    if (active !== undefined) update.active = active;
    
    await products.updateOne({ id: productId }, { $set: update });
    const updatedProduct = await products.findOne({ id: productId });
    
    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du produit' }, { status: 500 });
  }
}

// Delete product
async function handleDeleteProduct(request, productId) {
  try {
    const db = await connectDB();
    const products = db.collection('products');
    
    await products.updateOne({ id: productId }, { $set: { active: false } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du produit' }, { status: 500 });
  }
}

// Get seller stats
async function handleGetSellerStats(request, sellerId) {
  try {
    const db = await connectDB();
    
    const products = await db.collection('products').countDocuments({ sellerId, active: true });
    
    // Get orders containing seller's products
    const allOrders = await db.collection('orders').find().toArray();
    const sellerOrders = allOrders.filter(order => 
      order.items.some(item => item.sellerId === sellerId)
    );
    
    const totalSales = sellerOrders.reduce((sum, order) => {
      const sellerItems = order.items.filter(item => item.sellerId === sellerId);
      const sellerTotal = sellerItems.reduce((s, item) => s + (item.price * item.quantity), 0);
      return sum + sellerTotal;
    }, 0);
    
    return NextResponse.json({
      stats: {
        products,
        orders: sellerOrders.length,
        revenue: totalSales
      },
      recentOrders: sellerOrders.slice(0, 5)
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
  }
}

// Admin stats
async function handleGetStats(request) {
  try {
    const db = await connectDB();
    
    const users = await db.collection('users').countDocuments();
    const products = await db.collection('products').countDocuments({ active: true });
    const orders = await db.collection('orders').countDocuments();
    const totalRevenue = await db.collection('orders').aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]).toArray();
    
    const recentOrders = await db.collection('orders').find().sort({ createdAt: -1 }).limit(10).toArray();
    
    return NextResponse.json({
      stats: {
        users,
        products,
        orders,
        revenue: totalRevenue[0]?.total || 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
  }
}

// Main handler
export async function GET(request, { params }) {
  const path = params.path ? params.path.join('/') : '';
  
  if (path === 'products') return handleGetProducts(request);
  if (path.startsWith('products/seller/')) {
    const sellerId = path.split('/')[2];
    return handleGetProductsBySeller(request, sellerId);
  }
  if (path === 'orders') return handleGetOrders(request);
  if (path.startsWith('reviews/')) {
    const productId = path.split('/')[1];
    return handleGetReviews(request, productId);
  }
  if (path === 'admin/stats') return handleGetStats(request);
  
  return NextResponse.json({ message: 'Sen Panier Bio API' });
}

export async function POST(request, { params }) {
  const path = params.path ? params.path.join('/') : '';
  
  if (path === 'auth/register') return handleRegister(request);
  if (path === 'auth/login') return handleLogin(request);
  if (path === 'products') return handleCreateProduct(request);
  if (path === 'orders') return handleCreateOrder(request);
  if (path === 'reviews') return handleCreateReview(request);
  
  return NextResponse.json({ error: 'Route non trouvée' }, { status: 404 });
}

export async function PUT(request, { params }) {
  const path = params.path ? params.path.join('/') : '';
  
  if (path.startsWith('orders/')) {
    const orderId = path.split('/')[1];
    return handleUpdateOrderStatus(request, orderId);
  }
  
  return NextResponse.json({ error: 'Route non trouvée' }, { status: 404 });
}