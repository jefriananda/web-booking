import { io } from "socket.io-client";
import { apiBaseUrl } from "./api";

export const SOCKET_EVENTS = {
  CONNECTED: "socket:connected",
  ERROR: "socket:error",
  BOOKING_JOIN: "booking:join",
  BOOKING_LEAVE: "booking:leave",
  BOOKING_CREATED: "booking:created",
  BOOKING_UPDATED: "booking:updated",
  FIELD_JOIN: "field:join",
  FIELD_LEAVE: "field:leave",
  FIELD_AVAILABILITY: "field:availability",
  NOTIFICATION_NEW: "notification:new",
  PAYMENT_CREATED: "payment:created",
  PAYMENT_UPDATED: "payment:updated",
};

export const socket = io(apiBaseUrl, {
  autoConnect: false,
  withCredentials: true,
});
