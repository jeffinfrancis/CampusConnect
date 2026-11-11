
export type UserRole = "student" | "organizer" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  venue: string;
  capacity: number;
  organizer: User | string;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

export interface Registration {
  _id: string;
  student: User | string;
  event: Event | string;
  registrationDate: string;
  status: "registered" | "cancelled";
  attendanceStatus: "not-marked" | "attended" | "absent";
}
