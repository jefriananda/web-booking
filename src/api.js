const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
  /\/+$/,
  ""
);

console.log(BASE_URL)

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const describePayload = (payload, fallback) => {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors.map((error) => error.message).join(" • ");
  }
  return payload?.message || fallback;
};

async function request(path, options = {}) {
  const { method = "GET", body, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    ...rest,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new ApiError(describePayload(payload, `Permintaan gagal (${response.status})`), {
      status: response.status,
      payload,
    });
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler(path);
    throw error;
  }

  return payload;
}

const withQuery = (path, params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const api = {
  get: (path, params) => request(withQuery(path, params)),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),

  health: () => request("/"),

  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  logout: () => request("/auth/logout", { method: "DELETE" }),
  profile: () => request("/auth/profile"),

  getFields: () => request("/fields"),
  getField: (id) => request(`/fields/${id}`),
  createField: (payload) => request("/fields", { method: "POST", body: payload }),
  updateField: (id, payload) => request(`/fields/${id}`, { method: "PATCH", body: payload }),
  deleteField: (id) => request(`/fields/${id}`, { method: "DELETE" }),

  getUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: payload }),
  updateUser: (uuid, payload) => request(`/users/${uuid}`, { method: "PATCH", body: payload }),
  deleteUser: (uuid) => request(`/users/${uuid}`, { method: "DELETE" }),

  getBookings: (params) => request(withQuery("/bookings", params)),
  getBooking: (id) => request(`/bookings/${id}`),
  getAvailability: (params) => request(withQuery("/bookings/availability", params)),
  createBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: "PATCH", body: { status } }),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: "DELETE" }),

  getPayments: (params) => request(withQuery("/payments", params)),
  getPayment: (id) => request(`/payments/${id}`),
  getPaymentConfig: () => request("/payments/config"),
  createPayment: (bookingId) =>
    request("/payments", { method: "POST", body: { booking_id: bookingId } }),
  syncPayment: (id) => request(`/payments/${id}/sync`, { method: "POST" }),
  cancelPayment: (id) => request(`/payments/${id}/cancel`, { method: "POST" }),
};

export const assetUrl = (path) => {
  if (!path) return "";
  const value = String(path);
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return `${"https://plausible-hasty-scone.ngrok-free.dev"}/${value.replace(/^\/+/, "")}`;
};

export const apiBaseUrl = BASE_URL;
