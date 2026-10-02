import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/admin`;

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
});

export const ADMIN_ACTIVITY_CHANGED_EVENT = "admin-activity-updated";
export const notifyAdminActivityChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_ACTIVITY_CHANGED_EVENT));
  }
};

export const getAdminUsers = () => axios.get(`${API_URL}/users`, authConfig());
export const updateUserBlocked = (id, blocked) =>
  axios.patch(`${API_URL}/users/${id}/block`, { blocked }, authConfig());
export const getAdminOrders = () => axios.get(`${API_URL}/orders`, authConfig());
export const updateOrderStatus = (id, status) =>
  axios.patch(`${API_URL}/orders/${id}/status`, { status }, authConfig());
export const getCategories = () => axios.get(`${API_URL}/categories`, authConfig());
export const getStoreSettings = () => axios.get(`${API_URL}/settings`, authConfig());
export const updateStoreSettings = (settings) => axios.put(`${API_URL}/settings`, settings, authConfig());
export const createCategory = (name) =>
  axios.post(`${API_URL}/categories`, { name }, authConfig());
export const deleteCategory = (id) =>
  axios.delete(`${API_URL}/categories/${id}`, authConfig());

// Activity Log API
export const getAdminLogs = (params = {}) =>
  axios.get(`${API_URL}/logs`, { ...authConfig(), params });
export const clearAdminLogs = () =>
  axios.delete(`${API_URL}/logs`, authConfig());
export const createAdminLog = (logData) =>
  axios.post(`${API_URL}/logs`, logData, authConfig()).then((response) => {
    notifyAdminActivityChanged();
    return response;
  });
