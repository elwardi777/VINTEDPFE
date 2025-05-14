import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Eye, Trash2, Search, LogOut, Users, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number | string;
  category: string;
  image: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  items: Array<{id: string, name: string, price: number, quantity: number}>;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Initialize with empty arrays to prevent undefined errors
  const initializeData = () => {
    setProducts([]);
    setUsers([]);
    setOrders([]);
    setFilteredProducts([]);
    setFilteredUsers([]);
    setFilteredOrders([]);
  };

  // Mock data for products and users fallback
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Levi\'s Jeans',
      brand: 'Levi\'s',
      price: 69.99,
      category: 'Clothing',
      image: 'https://example.com/jeans.jpg'
    },
    {
      id: '2',
      name: 'Kids Winter Boots',
      brand: 'Adidas',
      price: 59.99,
      category: 'Footwear',
      image: 'https://example.com/boots.jpg'
    }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      createdAt: '2023-01-01'
    }
  ];

  const safeParseJSON = (data: string | null): any => {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  // Helper function to ensure price is a number
  const ensureNumericPrice = (product: Product): Product => {
    return {
      ...product,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
    };
  };

  // Format price safely
  const formatPrice = (price: number | string): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };
  useEffect(() => {
    fetch('http://localhost:5000/current-user', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.user?.role !== 'admin') {
          window.location.href = '/auth/login'; // رجع المستخدم للصفحة ديال تسجيل الدخول
        }
      })
      .catch(() => {
        window.location.href = '/auth/login';
      });
  }, []);
  
  useEffect(() => {
    initializeData();
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load products
        try {
          const productsResponse = await fetch('http://localhost:5000/api/products');
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            let productArray: Product[] = [];
            
            if (Array.isArray(productsData.products)) {
              productArray = productsData.products;
            } else if (Array.isArray(productsData)) {
              productArray = productsData;
            } else {
              throw new Error('Invalid products data format');
            }

            const validProducts = productArray.map(ensureNumericPrice);
            setProducts(validProducts);
            setFilteredProducts(validProducts);
          } else {
            throw new Error('Products API failed');
          }
        } catch (productsError) {
          console.error('Products fetch error:', productsError);
          const storedProducts = safeParseJSON(localStorage.getItem('products'));
          if (Array.isArray(storedProducts)) {
            const validProducts = storedProducts.map(ensureNumericPrice);
            setProducts(validProducts);
            setFilteredProducts(validProducts);
          } else {
            setProducts(mockProducts);
            setFilteredProducts(mockProducts);
          }
        }

        // Load users
        try {
          const usersResponse = await fetch('http://localhost:5000/api/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            if (Array.isArray(usersData)) {
              setUsers(usersData);
              setFilteredUsers(usersData);
            } else {
              throw new Error('Invalid users data format');
            }
          } else {
            throw new Error('Users API failed');
          }
        } catch (usersError) {
          console.error('Users fetch error:', usersError);
          const storedUsers = safeParseJSON(localStorage.getItem('users'));
          if (Array.isArray(storedUsers)) {
            setUsers(storedUsers);
            setFilteredUsers(storedUsers);
          } else {
            setUsers(mockUsers);
            setFilteredUsers(mockUsers);
          }
        }

        // Load orders
        try {
          const ordersResponse = await fetch('http://localhost:5000/api/orders');
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            if (Array.isArray(ordersData)) {
              setOrders(ordersData);
              setFilteredOrders(ordersData);
            } else {
              throw new Error('Invalid orders data format');
            }
          } else {
            throw new Error('Orders API failed');
          }
        } catch (ordersError) {
          console.error('Orders fetch error:', ordersError);
          const storedOrders = safeParseJSON(localStorage.getItem('orders'));
          if (Array.isArray(storedOrders)) {
            setOrders(storedOrders);
            setFilteredOrders(storedOrders);
          } else {
            setOrders([]);
            setFilteredOrders([]);
          }
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Using fallback data.",
          variant: "destructive",
        });
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const filterData = () => {
      const query = searchQuery.toLowerCase().trim();
      
      if (!query) {
        setFilteredProducts(products);
        setFilteredUsers(users);
        setFilteredOrders(orders);
        return;
      }

      setFilteredProducts(
        Array.isArray(products) ? products.filter(product => 
          product.name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        ) : []
      );
      
      setFilteredUsers(
        Array.isArray(users) ? users.filter(user => 
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        ) : []
      );
      
      setFilteredOrders(
        Array.isArray(orders) ? orders.filter(order => 
          order.username?.toLowerCase().includes(query) ||
          order.id?.toLowerCase().includes(query) ||
          order.status?.toLowerCase().includes(query)
        ) : []
      );
    };

    filterData();
  }, [searchQuery, products, users, orders]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      setIsDeleting(prev => ({ ...prev, [productId]: true }));
      
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('API delete failed');
        }
      } catch (apiError) {
        console.error('API delete error:', apiError);
      }

      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsDeleting(prev => ({ ...prev, [userId]: true }));
      
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('API delete failed');
        }
      } catch (apiError) {
        console.error('API delete error:', apiError);
      }

      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | VintedMaghreb</title>
        <meta name="description" content="Admin dashboard for VintedMaghreb" />
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <div className="w- BREAK64 bg-secondary/10 border-r p-4 hidden md:block">
          <div className="mb-8">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              VintedMaghreb
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab("products")} 
              className={`flex items-center px-3 py-2 rounded-md text-primary font-medium w-full text-left ${activeTab === "products" ? "bg-secondary/30" : "hover:bg-secondary/10"}`}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Products
            </button>
            <button 
              onClick={() => setActiveTab("users")} 
              className={`flex items-center px-3 py-2 rounded-md text-primary font-medium w-full text-left ${activeTab === "users" ? "bg-secondary/30" : "hover:bg-secondary/10"}`}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </button>
         
          </nav>
          
          <div className="absolute bottom-4 left-4">
            <Button variant="outline" className="w-56 justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Back to Site
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white border-b sticky top-0 z-10">
            <div className="flex justify-between items-center px-4 py-4 sm:px-6">
              <h1 className="text-lg sm:text-xl font-semibold">
                {activeTab === "products" && "Product Management"}
                {activeTab === "users" && "User Management"}
                {activeTab === "orders" && "Order Management"}
              </h1>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile tab selector */}
                <div className="md:hidden">
                  <select 
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="p-2 rounded border text-sm"
                  >
                    <option value="products">Products</option>
                    <option value="users">Users</option>
                  </select>
                </div>
                
                <Link 
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors md:hidden"
                >
                  Back
                </Link>
              </div>
            </div>
          </header>
          
          {/* Content */}
          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  type="search" 
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden">
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="products">
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden space-y-4">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {searchQuery ? "No products match your search" : "No products found"}
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded overflow-hidden bg-secondary/20 flex-shrink-0">
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "https://via.placeholder.com/150";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category} • {product.brand}</p>
                              <p className="text-sm font-medium mt-1">{formatPrice(product.price)} Dh</p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                to={`/product/${product.id}`}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="View product"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                aria-label="Delete product"
                                disabled={isDeleting[product.id]}
                              >
                                {isDeleting[product.id] ? (
                                  <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary/20">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                          <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Brand</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Price</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.length === 0 ? (
                          <tr key="no-products">
                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                              {searchQuery ? "No products match your search" : "No products found"}
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-secondary/5">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded overflow-hidden bg-secondary/20 flex-shrink-0">
                                    <img 
                                      src={product.image} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = "https://via.placeholder.com/150";
                                      }}
                                    />
                                  </div>
                                  <div className="truncate max-w-[200px]">
                                    <p className="text-sm font-medium truncate">{product.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{product.category}</td>
                              <td className="px-4 py-3 text-sm hidden lg:table-cell">{product.brand}</td>
                              <td className="px-4 py-3 text-sm text-right">{formatPrice(product.price)} Dh</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end space-x-2">
                                  <Link
                                    to={`/product/${product.id}`}
                                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="View product"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                    aria-label="Delete product"
                                    disabled={isDeleting[product.id]}
                                  >
                                    {isDeleting[product.id] ? (
                                      <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="users">
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden space-y-4">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                              <img 
                                src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                                alt={user.username} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `https://i.pravatar.cc/150?u=${user.id}`;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">{user.createdAt || "N/A"}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                aria-label="Delete user"
                                disabled={isDeleting[user.id]}
                              >
                                {isDeleting[user.id] ? (
                                  <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary/20">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Joined</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                          <tr key="no-users">
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              {searchQuery ? "No users match your search" : "No users found"}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-secondary/5">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                                    <img 
                                      src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                                      alt={user.username} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = `https://i.pravatar.cc/150?u=${user.id}`;
                                      }}
                                    />
                                  </div>
                                  <div className="truncate max-w-[200px]">
                                    <p className="text-sm font-medium truncate">{user.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{user.email}</td>
                              <td className="px-4 py-3 text-sm hidden lg:table-cell">{user.createdAt || "N/A"}</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                    aria-label="Delete user"
                                    disabled={isDeleting[user.id]}
                                  >
                                    {isDeleting[user.id] ? (
                                      <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="orders">
                  {/* Mobile Card Layout */}
                  <div className="block sm:hidden space-y-4">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        {searchQuery ? "No orders match your search" : "No orders found"}
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">Order #{order.id}</p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm">{order.username}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm font-medium">{order.total.toFixed(2)} Dh</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-secondary/20">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Status</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredOrders.length === 0 ? (
                          <tr key="no-orders">
                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                              {searchQuery ? "No orders match your search" : "No orders found"}
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-secondary/5">
                              <td className="px-4 py-3 text-sm font-medium">{order.id}</td>
                              <td className="px-4 py-3 text-sm">{order.username}</td>
                              <td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">{order.total.toFixed(2)} Dh</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminPage;