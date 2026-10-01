import axios from "axios";
import { BACKEND_URL } from "./apiConfig";

const API_URL = `${BACKEND_URL}/api/products`;

export const getProducts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};