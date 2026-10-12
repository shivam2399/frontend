"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  getCollection,
  getErrorMessage,
  formatPrice,
  getToken,
} from "@/lib/api";

function getServiceName(appointment) {
  return appointment.service?.name || "Salon service";
}

function getStaffName(appointment) {
  const staff = appointment.staff;
  if (!staff) return "Assigned stylist";

  if (staff.name) return staff.name;

  const user = staff.user;
  if (user) {
    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ");

    return fullName || user.name || "Assigned stylist";
  }

  return "Assigned stylist";
}

function formatDateTime(value) {
  if (!value) return "Date not available";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function statusClass(status) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
      return "bg-stone-100 text-stone-600";
    case "completed":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

export default function AppointmentsPage() {
  

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
    const [cancellingId, setCancellingId] = useState(null);
    const [booked, setBooked] = useState(false);

    useEffect(() => {
    const isBooked =
        new URLSearchParams(window.location.search).get("booked") === "1";

    setBooked(isBooked);

    if (isBooked) {
        setMessage("Your appointment was booked successfully.");
    }
    }, []);

  const loadAppointments = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await apiFetch("/appointments/my");
      setAppointments(getCollection(payload, "appointments"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function cancelAppointment(id) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    setCancellingId(id);
    setError("");
    setMessage("");

    try {
      await apiFetch(`/appointments/${id}/cancel`, {
        method: "PATCH",
      });

      setMessage("Appointment cancelled successfully.");
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  if (!getToken() && !loading) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-semibold">Sign in to see your bookings</h1>
        <p className="mt-3 text-stone-500">
          Your appointments will appear here once you sign in.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
            Your SalonFlow account
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            My appointments
          </h1>
          <p className="mt-3 text-stone-500">
            Review your bookings and manage upcoming visits.
          </p>
        </div>

        <Link
          href="/#booking"
          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Book another appointment
        </Link>
      </div>

      {message && (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-stone-500">
          Loading your appointments...
        </p>
      ) : appointments.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl">✦</div>
          <h2 className="mt-4 text-xl font-semibold">No appointments yet</h2>
          <p className="mt-2 text-stone-500">
            Your next salon visit is waiting to be booked.
          </p>
          <Link
            href="/#booking"
            className="mt-6 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
          >
            Find a time
          </Link>
        </div>
      ) : (
        <div className="mt-9 space-y-4">
          {appointments.map((appointment) => {
            const status = appointment.status;
            const canCancel =
              ["pending", "confirmed"].includes(status) &&
              new Date(appointment.startTime).getTime() > Date.now();

            return (
              <article
                key={appointment.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {getServiceName(appointment)}
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(status)}`}>
                        {status?.replaceAll("_", " ") || "Unknown"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-stone-600">
                      <p>
                        <span className="font-medium text-stone-900">Date:</span>{" "}
                        {formatDateTime(appointment.startTime)}
                      </p>
                      <p>
                        <span className="font-medium text-stone-900">Stylist:</span>{" "}
                        {getStaffName(appointment)}
                      </p>
                      <p>
                        <span className="font-medium text-stone-900">Duration:</span>{" "}
                        {appointment.durationMinutes} minutes
                      </p>
                      {appointment.notes && (
                        <p>
                          <span className="font-medium text-stone-900">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <p className="text-xl font-semibold">
                      {formatPrice(appointment.pricePaise)}
                    </p>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment.id)}
                        disabled={cancellingId === appointment.id}
                        className="rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        {cancellingId === appointment.id
                          ? "Cancelling..."
                          : "Cancel appointment"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}