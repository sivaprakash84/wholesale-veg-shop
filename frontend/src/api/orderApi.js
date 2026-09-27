import axios from "axios";

const API_URL = "http://localhost:5000/api/orders";

// Create new order
export const createOrder = async (orderData, token) => {
  const response = await axios.post(
    API_URL,
    orderData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get all orders - Admin
export const getOrders = async (token) => {
  const response = await axios.get(
    API_URL,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get one order - Admin
export const getOrderById = async (orderId, token) => {
  const response = await axios.get(
    `${API_URL}/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get logged-in customer's orders
export const getCustomerOrders = async (token) => {
  const response = await axios.get(
    `${API_URL}/customer`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};