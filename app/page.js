'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Leaf, ShoppingCart, User, Plus, Package, TrendingUp, Users, DollarSign, Star, MapPin, Phone, Mail, Search, Filter, LogOut, Home, Store, Truck } from 'lucide-react';

export default function SenPanierBio() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Auth states
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'consumer'
  });

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'fruits-legumes',
    bioStatus: 'certified',
    location: '',
    stock: '',
    unit: 'kg'
  });

  // Order form
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: '',
    deliveryMethod: 'home',
    paymentMethod: 'wave'
  });

  const categories = [
    { value: 'intrants-bio', label: 'Intrants Bio' },
    { value: 'fruits-legumes', label: 'Fruits & Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'produits-transformes', label: 'Produits Transformés' }
  ];

  const bioStatusOptions = [
    { value: 'certified', label: 'Certifié Bio', color: 'bg-green-500' },
    { value: 'transition', label: 'En Transition', color: 'bg-yellow-500' },
    { value: 'verified', label: 'Vérifié Plateforme', color: 'bg-blue-500' }
  ];

  useEffect(() => {
    if (view === 'marketplace') {
      fetchProducts();
    }
    if (view === 'orders' && user) {
      fetchOrders();
    }
    if (view === 'myproducts' && user) {
      fetchMyProducts();
      fetchSellerStats();
    }
    if (view === 'admin' && user?.role === 'admin') {
      fetchStats();
    }
  }, [view, user]);

  const fetchSellerStats = async () => {
    try {
      const res = await fetch(`/api/seller/stats/${user.id}`);
      const data = await res.json();
      setSellerStats(data);
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const res = await fetch(`/api/products/seller/${user.id}`);
      const data = await res.json();
      setMyProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching my products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?userId=${user.id}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setView('marketplace');
      } else {
        alert(data.error || 'Erreur d\'authentification');
      }
    } catch (error) {
      alert('Erreur lors de la connexion');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          sellerId: user.id,
          sellerName: user.name
        })
      });
      
      const data = await res.json();
      if (data.product) {
        alert('Produit ajouté avec succès!');
        setProductForm({
          name: '',
          description: '',
          price: '',
          category: 'fruits-legumes',
          bioStatus: 'certified',
          location: '',
          stock: '',
          unit: 'kg'
        });
        fetchMyProducts();
      }
    } catch (error) {
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert('Produit ajouté au panier!');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = orderForm.deliveryMethod === 'home' ? 2000 : 0;
      const total = subtotal + deliveryFee;
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          items: cart,
          deliveryAddress: orderForm.deliveryAddress,
          deliveryMethod: orderForm.deliveryMethod,
          paymentMethod: orderForm.paymentMethod,
          total,
          deliveryFee
        })
      });
      
      const data = await res.json();
      if (data.order) {
        alert('Commande passée avec succès! Paiement en attente.');
        setCart([]);
        setView('orders');
      }
    } catch (error) {
      alert('Erreur lors de la commande');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Home/Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-green-100">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Sen Panier Bio" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-green-700">Sen Panier Bio</h1>
                <p className="text-sm text-green-600">Marché Bio du Sénégal</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-8">
              <Leaf className="h-20 w-20 text-green-600 mx-auto mb-4" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Bienvenue sur la Plateforme Bio du Sénégal
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Connectez producteurs bio et consommateurs. Des produits certifiés, locaux et durables.
            </p>
          </div>
        </section>

        {/* Auth Section */}
        <section className="container mx-auto px-4 pb-16">
          <Card className="max-w-md mx-auto border-green-200">
            <CardHeader>
              <CardTitle className="text-center">
                {authMode === 'login' ? 'Connexion' : 'Inscription'}
              </CardTitle>
              <CardDescription className="text-center">
                {authMode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        required
                        value={authForm.phone}
                        onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                        placeholder="77 123 45 67"
                      />
                    </div>
                    <div>
                      <Label>Type de compte</Label>
                      <Select
                        value={authForm.role}
                        onValueChange={(value) => setAuthForm({...authForm, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumer">Consommateur</SelectItem>
                          <SelectItem value="farmer">Agriculteur</SelectItem>
                          <SelectItem value="supplier">Fournisseur d'intrants</SelectItem>
                          <SelectItem value="processor">Transformateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  {authMode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                variant="link"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Créer un compte' : 'Déjà inscrit? Se connecter'}
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* Features */}
        <section className="bg-green-50 py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Pourquoi Sen Panier Bio?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-green-200">
                <CardHeader>
                  <Leaf className="h-12 w-12 text-green-600 mb-2" />
                  <CardTitle>100% Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Produits certifiés biologiques ou en transition vérifiée</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader>
                  <Users className="h-12 w-12 text-green-600 mb-2" />
                  <CardTitle>Direct Producteur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Achetez directement auprès des agriculteurs sénégalais</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader>
                  <Truck className="h-12 w-12 text-green-600 mb-2" />
                  <CardTitle>Livraison Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Livraison à domicile ou retrait en point relais</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Main App (Authenticated)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('marketplace')}>
              <img src="/logo.jpg" alt="Sen Panier Bio" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-green-700">Sen Panier Bio</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('marketplace')}
                className={view === 'marketplace' ? 'bg-green-50' : ''}
              >
                <Store className="h-4 w-4 mr-2" />
                Marché
              </Button>
              
              {(user.role === 'farmer' || user.role === 'supplier' || user.role === 'processor') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('myproducts')}
                  className={view === 'myproducts' ? 'bg-green-50' : ''}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Mes Produits
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('orders')}
                className={view === 'orders' ? 'bg-green-50' : ''}
              >
                <Package className="h-4 w-4 mr-2" />
                Commandes
              </Button>
              
              {user.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('admin')}
                  className={view === 'admin' ? 'bg-green-50' : ''}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('cart')}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-green-600">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUser(null);
                  setView('home');
                  setCart([]);
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Marketplace View */}
      {view === 'marketplace' && (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Marché Bio</h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher des produits..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchProducts} className="bg-green-600 hover:bg-green-700">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-square bg-green-50 rounded-lg mb-3 flex items-center justify-center">
                    <Leaf className="h-16 w-16 text-green-300" />
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {product.price.toLocaleString()} FCFA
                      </span>
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={bioStatusOptions.find(b => b.value === product.bioStatus)?.color}>
                        {bioStatusOptions.find(b => b.value === product.bioStatus)?.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {product.location}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      {product.sellerName}
                    </div>
                    
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({product.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-16">
              <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun produit disponible</p>
            </div>
          )}
        </div>
      )}

      {/* My Products View (Seller) */}
      {view === 'myproducts' && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Mes Produits</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un produit</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <Label>Nom du produit</Label>
                    <Input
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      placeholder="Tomates biologiques"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      required
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Décrivez votre produit..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prix (FCFA)</Label>
                      <Input
                        type="number"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label>Unité</Label>
                      <Select
                        value={productForm.unit}
                        onValueChange={(value) => setProductForm({...productForm, unit: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="piece">pièce</SelectItem>
                          <SelectItem value="litre">litre</SelectItem>
                          <SelectItem value="sac">sac</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm({...productForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Statut Bio</Label>
                    <Select
                      value={productForm.bioStatus}
                      onValueChange={(value) => setProductForm({...productForm, bioStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bioStatusOptions.map(status => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Localisation</Label>
                    <Input
                      required
                      value={productForm.location}
                      onChange={(e) => setProductForm({...productForm, location: e.target.value})}
                      placeholder="Dakar, Thiès..."
                    />
                  </div>
                  
                  <div>
                    <Label>Stock disponible</Label>
                    <Input
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      placeholder="100"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le produit
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Product List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Vos produits ({myProducts.length})</h3>
              {myProducts.map(product => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">{product.price.toLocaleString()} FCFA/{product.unit}</span>
                        <Badge className={bioStatusOptions.find(b => b.value === product.bioStatus)?.color}>
                          {bioStatusOptions.find(b => b.value === product.bioStatus)?.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Stock: {product.stock} {product.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {myProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun produit ajouté</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart View */}
      {view === 'cart' && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Mon Panier</h2>
          
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Votre panier est vide</p>
              <Button onClick={() => setView('marketplace')} className="bg-green-600 hover:bg-green-700">
                Continuer mes achats
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="md:col-span-2 space-y-4">
                {cart.map(item => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Leaf className="h-12 w-12 text-green-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.sellerName}</p>
                          <p className="text-green-600 font-semibold mt-2">
                            {item.price.toLocaleString()} FCFA/{item.unit}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto"
                            >
                              Retirer
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {(item.price * item.quantity).toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Checkout */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé de la commande</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCheckout} className="space-y-4">
                      <div>
                        <Label>Méthode de livraison</Label>
                        <Select
                          value={orderForm.deliveryMethod}
                          onValueChange={(value) => setOrderForm({...orderForm, deliveryMethod: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Livraison à domicile (2000 FCFA)</SelectItem>
                            <SelectItem value="pickup">Retrait en point relais (Gratuit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {orderForm.deliveryMethod === 'home' && (
                        <div>
                          <Label>Adresse de livraison</Label>
                          <Textarea
                            required
                            value={orderForm.deliveryAddress}
                            onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                            placeholder="Votre adresse complète..."
                            rows={3}
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label>Méthode de paiement</Label>
                        <Select
                          value={orderForm.paymentMethod}
                          onValueChange={(value) => setOrderForm({...orderForm, paymentMethod: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wave">Wave</SelectItem>
                            <SelectItem value="orange-money">Orange Money</SelectItem>
                            <SelectItem value="free-money">Free Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Sous-total</span>
                          <span>{cartTotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Livraison</span>
                          <span>{orderForm.deliveryMethod === 'home' ? '2 000' : '0'} FCFA</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total</span>
                          <span className="text-green-600">
                            {(cartTotal + (orderForm.deliveryMethod === 'home' ? 2000 : 0)).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        Passer la commande
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders View */}
      {view === 'orders' && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Mes Commandes</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Commande #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={order.status === 'pending' ? 'bg-yellow-500' : order.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'}>
                          {order.status === 'pending' ? 'En attente' : order.status === 'completed' ? 'Livrée' : order.status}
                        </Badge>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          {order.total.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.quantity} x {item.price.toLocaleString()} FCFA</p>
                          </div>
                          <p className="font-semibold">{(item.quantity * item.price).toLocaleString()} FCFA</p>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="text-sm space-y-1">
                          <p><strong>Livraison:</strong> {order.deliveryMethod === 'home' ? 'À domicile' : 'Point relais'}</p>
                          {order.deliveryAddress && <p><strong>Adresse:</strong> {order.deliveryAddress}</p>}
                          <p><strong>Paiement:</strong> {order.paymentMethod.toUpperCase()}</p>
                          <p>
                            <strong>Statut paiement:</strong>{' '}
                            <Badge variant="outline" className={order.paymentStatus === 'pending' ? 'border-yellow-500' : 'border-green-500'}>
                              {order.paymentStatus === 'pending' ? 'En attente' : 'Payé'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin View */}
      {view === 'admin' && user.role === 'admin' && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Admin</h2>
          
          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold">{stats.stats.users}</p>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Produits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold">{stats.stats.products}</p>
                      <Package className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold">{stats.stats.orders}</p>
                      <ShoppingCart className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold">{stats.stats.revenue.toLocaleString()}</p>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">FCFA</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <p className="font-medium">{order.userName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{order.total.toLocaleString()} FCFA</p>
                          <Badge className={order.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}