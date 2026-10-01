import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/products`;

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
});

const productPayload = (product) => {
  if (!product.imageFile && !product.modelFile) return product;
  const payload = new FormData();
  Object.entries(product).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== "imageFile" && key !== "modelFile") payload.append(key, value);
  });
  if (product.imageFile) payload.append("imageFile", product.imageFile);
  (product.imageFiles || []).forEach((file) => payload.append("imageFiles", file));
  if (product.modelFile) payload.append("modelFile", product.modelFile);
  return payload;
};

export const getProducts = () => {
  return axios.get(API_URL);
};

export const getProduct = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const createProduct = (product) => {
  return axios.post(API_URL, productPayload(product), authConfig());
};

export const updateProduct = (id, product) => {
  return axios.put(`${API_URL}/${id}`, productPayload(product), authConfig());
};

export const deleteProduct = (id) => {
  return axios.delete(`${API_URL}/${id}`, authConfig());
};