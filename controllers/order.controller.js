const Order = require('../models/order.js');
const Restaurant = require('../models/restaurant.js');
const Food = require('../models/food.js');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Calculate total amount and verify items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const food = await Food.findById(item.food);
      if (!food) {
        return res.status(404).json({ message: `Food not found: ${item.food}` });
      }

      if (!food.isAvailable) {
        return res.status(400).json({ message: `Food not available: ${food.name}` });
      }

      const itemTotal = food.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        food: food._id,
        quantity: item.quantity,
        price: food.price,
      });
    }

    // Get restaurant from first food item
    const firstFood = await Food.findById(items[0].food);
    const restaurant = await Restaurant.findById(firstFood.restaurant);

    const order = new Order({
      user: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('restaurant', 'name location')
      .populate('items.food', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the order owner, restaurant owner, or admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      (req.user.role !== 'restaurant' ||
        order.restaurant.owner.toString() !== req.user._id.toString())
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name location')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant
// @access  Private/Restaurant Owner
const getRestaurantOrders = async (req, res) => {
  try {
    // Find restaurant owned by the user
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Restaurant Owner or Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is restaurant owner or admin
    const restaurant = await Restaurant.findById(order.restaurant);
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    order.status = 'delivered';
    order.paymentStatus = 'completed';
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Restaurant Owner or Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is restaurant owner or admin
    const restaurant = await Restaurant.findById(order.restaurant);
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private/Order Owner
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the order owner
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getRestaurantOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  cancelOrder,
};