
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getAllEvents, getPendingEvents } from "../../services/eventService";
import type { Event } from "../../types";

import "./AdminDashboard.css";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Unable to load dashboard data."
    );
  }

  return "Unable to load dashboard data.";
};

const AdminDashboard = () => {
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [approvedResponse, pendingResponse] = await Promise.all([
        getAllEvents(),
        getPendingEvents(),
      ]);

      setApprovedEvents(approvedResponse.events);
      setPendingEvents(pendingResponse.events);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const totalEvents = approvedEvents.length + pendingEvents.length;

  const rejectedCount = 0;
  // Rejected events are not included in the public events API.
  // We will retrieve this count after implementing the admin all-events API.

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="admin-loading">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage CampusEvents and monitor event activity.</p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={() => void fetchDashboardData()}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => void fetchDashboardData()}>
            Try again
          </button>
        </div>
      )}

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <div className="admin-summary-icon purple">
            <CalendarDays size={24} />
          </div>
          <div>
            <span>Total Loaded Events</span>
            <h2>{totalEvents}</h2>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon orange">
            <Clock size={24} />
          </div>
          <div>
            <span>Pending Approval</span>
            <h2>{pendingEvents.length}</h2>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon green">
            <CheckCircle size={24} />
          </div>
          <div>
            <span>Approved Events</span>
            <h2>{approvedEvents.length}</h2>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon red">
            <XCircle size={24} />
          </div>
          <div>
            <span>Rejected Events</span>
            <h2>{rejectedCount}</h2>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-content">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Pending Event Approvals</h2>
              <p>Review events submitted by organizers.</p>
            </div>

            <Link to="/admin/events/pending" className="admin-view-all">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="admin-empty">
              <CheckCircle size={35} />
              <h3>All caught up!</h3>
              <p>There are no events waiting for approval.</p>
            </div>
          ) : (
            <div className="admin-pending-list">
              {pendingEvents.slice(0, 5).map((event) => {
                const organizer =
                  typeof event.organizer === "string"
                    ? "Unknown organizer"
                    : event.organizer.name;

                return (
                  <div className="admin-pending-item" key={event._id}>
                    <div className="admin-event-info">
                      <h3>{event.title}</h3>
                      <p>
                        {event.category} · {organizer}
                      </p>
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(event.eventDate)}
                      </span>
                    </div>

                    <span className="admin-pending-badge">
                      Pending
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-quick-actions">
          <h2>Quick Actions</h2>
          <p>Common administration tasks.</p>

          <Link to="/admin/events/pending" className="admin-action-link">
            <ClipboardCheck size={20} />
            <span>
              <strong>Review Pending Events</strong>
              <small>Approve or reject submissions</small>
            </span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/admin/events" className="admin-action-link">
            <CalendarDays size={20} />
            <span>
              <strong>Manage All Events</strong>
              <small>View and manage event records</small>
            </span>
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
