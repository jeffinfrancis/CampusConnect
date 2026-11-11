
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
} from "lucide-react";

import { getMyEvents } from "../../services/eventService";
import {
  getEventParticipants,
  markAttendance,
} from "../../services/registrationService";

import type { Event, Registration, User } from "../../types";
import "./OrganizerParticipants.css";

type AttendanceStatus = "not-marked" | "attended" | "absent";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong."
    );
  }

  return "Something went wrong. Please try again.";
};

const getStudent = (registration: Registration): User | null => {
  return typeof registration.student === "string"
    ? null
    : registration.student;
};

const OrganizerParticipants = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [participants, setParticipants] = useState<Registration[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the organizer's events.
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setError("");

      const response = await getMyEvents();
      setEvents(response.events);

      setSelectedEventId((currentId) => {
        if (currentId && response.events.some((event) => event._id === currentId)) {
          return currentId;
        }

        return response.events[0]?._id || "";
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Load participants whenever the selected event changes.
  const fetchParticipants = useCallback(async () => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }

    try {
      setLoadingParticipants(true);
      setError("");
      setSuccess("");

      const response = await getEventParticipants(selectedEventId);
      setParticipants(response.participants);
    } catch (err) {
      setParticipants([]);
      setError(getErrorMessage(err));
    } finally {
      setLoadingParticipants(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  const selectedEvent = events.find(
    (event) => event._id === selectedEventId
  );

  // Filter participants by student name or email.
  const filteredParticipants = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return participants;
    }

    return participants.filter((registration) => {
      const student = getStudent(registration);

      return (
        student?.name?.toLowerCase().includes(search) ||
        student?.email?.toLowerCase().includes(search)
      );
    });
  }, [participants, searchTerm]);

  // Attendance summary.
  const attendanceSummary = useMemo(() => {
    return {
      total: participants.length,
      attended: participants.filter(
        (item) => item.attendanceStatus === "attended"
      ).length,
      absent: participants.filter(
        (item) => item.attendanceStatus === "absent"
      ).length,
      notMarked: participants.filter(
        (item) => item.attendanceStatus === "not-marked"
      ).length,
    };
  }, [participants]);

  const handleAttendance = async (
    registrationId: string,
    attendanceStatus: "attended" | "absent"
  ) => {
    try {
      setUpdatingId(registrationId);
      setError("");
      setSuccess("");

      await markAttendance(registrationId, attendanceStatus);

      // Update the participant locally without reloading the whole page.
      setParticipants((current) =>
        current.map((registration) =>
          registration._id === registrationId
            ? { ...registration, attendanceStatus }
            : registration
        )
      );

      setSuccess(
        attendanceStatus === "attended"
          ? "Participant marked as attended."
          : "Participant marked as absent."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAttendanceLabel = (status: AttendanceStatus) => {
    switch (status) {
      case "attended":
        return "Attended";
      case "absent":
        return "Absent";
      default:
        return "Not marked";
    }
  };

  if (loadingEvents) {
    return (
      <div className="participants-loading">
        Loading your events...
      </div>
    );
  }

  return (
    <div className="organizer-participants">
      <div className="participants-header">
        <div>
          <h1>Event Participants</h1>
          <p>View registered students and manage event attendance.</p>
        </div>

        <button
          className="participants-refresh-btn"
          onClick={() => void fetchParticipants()}
          disabled={!selectedEventId || loadingParticipants}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <div className="participants-alert error">{error}</div>}
      {success && (
        <div className="participants-alert success">{success}</div>
      )}

      {events.length === 0 ? (
        <div className="participants-empty">
          <CalendarDays size={42} />
          <h3>No events found</h3>
          <p>Create an event before managing its participants.</p>
        </div>
      ) : (
        <>
          <div className="event-selector">
            <label htmlFor="participant-event">Select Event</label>
            <select
              id="participant-event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="selected-event-info">
              <div>
                <h2>{selectedEvent.title}</h2>
                <p>
                  <CalendarDays size={15} />
                  {formatDate(selectedEvent.eventDate)}
                  <span className="event-info-separator">|</span>
                  {selectedEvent.venue}
                </p>
              </div>
              <span className={`event-status ${selectedEvent.status}`}>
                {selectedEvent.status}
              </span>
            </div>
          )}

          <div className="attendance-summary">
            <div className="attendance-card total">
              <Users size={23} />
              <div>
                <span>Total Registered</span>
                <strong>{attendanceSummary.total}</strong>
              </div>
            </div>

            <div className="attendance-card attended">
              <CheckCircle size={23} />
              <div>
                <span>Attended</span>
                <strong>{attendanceSummary.attended}</strong>
              </div>
            </div>

            <div className="attendance-card absent">
              <XCircle size={23} />
              <div>
                <span>Absent</span>
                <strong>{attendanceSummary.absent}</strong>
              </div>
            </div>

            <div className="attendance-card not-marked">
              <Clock size={23} />
              <div>
                <span>Not Marked</span>
                <strong>{attendanceSummary.notMarked}</strong>
              </div>
            </div>
          </div>

          <div className="participants-toolbar">
            <div className="participants-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <span className="participant-count">
              {filteredParticipants.length} participant(s)
            </span>
          </div>

          {loadingParticipants ? (
            <div className="participants-loading">
              Loading participants...
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="participants-empty">
              <Users size={42} />
              <h3>
                {participants.length === 0
                  ? "No registrations yet"
                  : "No matching participants"}
              </h3>
              <p>
                {participants.length === 0
                  ? "Students who register for this event will appear here."
                  : "Try a different name or email address."}
              </p>
            </div>
          ) : (
            <div className="participants-table-wrapper">
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Registration Date</th>
                    <th>Attendance</th>
                    <th>Manage Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParticipants.map((registration) => {
                    const student = getStudent(registration);
                    const status =
                      registration.attendanceStatus as AttendanceStatus;
                    const isUpdating = updatingId === registration._id;

                    return (
                      <tr key={registration._id}>
                        <td>
                          <div className="participant-student">
                            <div className="student-avatar">
                              {student?.name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <div>
                              <strong>{student?.name || "Unknown student"}</strong>
                              <span>{student?.email || "No email available"}</span>
                            </div>
                          </div>
                        </td>

                        <td>{formatDate(registration.registrationDate)}</td>

                        <td>
                          <span className={`attendance-badge ${status}`}>
                            {getAttendanceLabel(status)}
                          </span>
                        </td>

                        <td>
                          <div className="attendance-actions">
                            <button
                              className="mark-attended-btn"
                              onClick={() =>
                                void handleAttendance(
                                  registration._id,
                                  "attended"
                                )
                              }
                              disabled={isUpdating || status === "attended"}
                            >
                              <CheckCircle size={15} />
                              Attended
                            </button>

                            <button
                              className="mark-absent-btn"
                              onClick={() =>
                                void handleAttendance(
                                  registration._id,
                                  "absent"
                                )
                              }
                              disabled={isUpdating || status === "absent"}
                            >
                              <XCircle size={15} />
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrganizerParticipants;
