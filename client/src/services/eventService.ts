
import api from "./api";
import type { Event } from "../types";

// Event data for creating a new event
export interface CreateEventData {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  venue: string;
  capacity: number;
}

// Event data for updating an existing event
export type UpdateEventData = Partial<CreateEventData>;

// API response interfaces
interface EventsResponse {
  count: number;
  events: Event[];
}

interface EventResponse {
  message?: string;
  event: Event;
}

interface MessageResponse {
  message: string;
}

// Get all approved events
export const getAllEvents = async (): Promise<EventsResponse> => {
  const response = await api.get<EventsResponse>("/events");
  return response.data;
};

// Get events created by the logged-in organizer
export const getMyEvents = async (): Promise<EventsResponse> => {
  const response = await api.get<EventsResponse>(
    "/events/my-events"
  );
  return response.data;
};

// Get event details by ID
export const getEventById = async (
  id: string
): Promise<EventResponse> => {
  const response = await api.get<EventResponse>(
    `/events/${id}`
  );
  return response.data;
};

// Create a new event
export const createEvent = async (
  eventData: CreateEventData
): Promise<EventResponse> => {
  const response = await api.post<EventResponse>(
    "/events",
    eventData
  );
  return response.data;
};

// Update an existing event
export const updateEvent = async (
  id: string,
  eventData: UpdateEventData
): Promise<EventResponse> => {
  const response = await api.put<EventResponse>(
    `/events/${id}`,
    eventData
  );
  return response.data;
};

// Delete an event
export const deleteEvent = async (
  id: string
): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(
    `/events/${id}`
  );
  return response.data;
};

// Get events awaiting admin approval
export const getPendingEvents = async (): Promise<EventsResponse> => {
  const response = await api.get<EventsResponse>(
    "/events/admin/pending"
  );
  return response.data;
};

// Update event approval status (admin)
export const updateEventStatus = async (
  id: string,
  status: "approved" | "rejected"
): Promise<EventResponse> => {
  const response = await api.patch<EventResponse>(
    `/events/${id}/status`,
    { status }
  );
  return response.data;
};
// Get all events for admin view
export const getAllEventsAdmin = async (): Promise<EventsResponse> => {
  const response = await api.get<EventsResponse>("/events/admin/all");
  return response.data;
};