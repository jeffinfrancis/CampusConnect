
import api from "./api";
import type { Registration } from "../types";

interface RegistrationListResponse {
  count: number;
  registrations: Registration[];
}

interface RegistrationResponse {
  message: string;
  registration: Registration;
}

interface ParticipantsResponse {
  count: number;
  participants: Registration[];
}

export interface EventAvailability {
  eventId: string;
  capacity: number;
  registeredCount: number;
  availableSeats: number;
  waitlistedCount: number;
  isFull: boolean;
}

// Register for an event
export const registerForEvent = async (
  eventId: string
): Promise<RegistrationResponse> => {
  const response = await api.post<RegistrationResponse>(
    "/registrations",
    { eventId }
  );

  return response.data;
};

// Get registrations for the logged-in student
export const getMyRegistrations = async (): Promise<RegistrationListResponse> => {
  const response = await api.get<RegistrationListResponse>(
    "/registrations/my-registrations"
  );

  return response.data;
};

// Cancel a registration
export const cancelRegistration = async (
  registrationId: string
): Promise<RegistrationResponse> => {
  const response = await api.patch<RegistrationResponse>(
    `/registrations/${registrationId}/cancel`
  );

  return response.data;
};


// Get participants for an event (for organizers)
export const getEventParticipants = async (
  eventId: string
): Promise<ParticipantsResponse> => {
  const response = await api.get<ParticipantsResponse>(
    `/registrations/event/${eventId}/participants`
  );

  return response.data;
};
// Mark attendance for a participant
export const markAttendance = async (
  registrationId: string,
  attendanceStatus: "attended" | "absent"
): Promise<{ message: string; registration: Registration }> => {
  const response = await api.patch<{
    message: string;
    registration: Registration;
  }>(`/registrations/${registrationId}/attendance`, {
    attendanceStatus,
  });

  return response.data;
};




export const getEventAvailability = async (
  eventId: string
): Promise<{
  event: {
    _id: string;
    title: string;
    eventDate: string;
  };
  availability: EventAvailability;
}> => {
  const response = await api.get(
    `/registrations/event/${eventId}/availability`
  );

  return response.data;
};
