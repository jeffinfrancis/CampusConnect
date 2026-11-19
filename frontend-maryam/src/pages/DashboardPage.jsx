import { useState } from "react";
import { Link } from "react-router-dom";
import events from "../data/events";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function DashboardPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  function goPrevious() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={goPrevious}>← Previous</button>
        <h1>{monthNames[month]} {year}</h1>
        <button onClick={goNext}>Next →</button>
      </div>

      <div className="calendar">
        {dayNames.map((name) => (
          <div className="day-name" key={name}>
            {name}
          </div>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <div key={"empty" + index}></div>;
          }

          const date = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
          const dayEvents = events.filter((event) => event.date === date);

          return (
            <div className="day" key={date}>
              <strong>{day}</strong>

              {dayEvents.map((event) => (
                <p className="day-event" key={event.id}>
                  <Link to={"/event/" + event.id} style={{ color: "inherit" }}>
                    {event.title}
                  </Link>
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardPage;