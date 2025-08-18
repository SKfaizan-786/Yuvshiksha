import React, { useEffect, useState } from "react";
import { getFromLocalStorage } from "../utils/storage";

export default function TeacherSchedule() {
  const [availability, setAvailability] = useState([]);
  useEffect(() => {
    // Try to get from currentUser in localStorage
    const user = getFromLocalStorage("currentUser");
    const teacherData = user?.teacherProfileData || user?.teacherProfile || {};
    setAvailability(Array.isArray(teacherData.availability) ? teacherData.availability : []);
  }, []);

  // Group by day
  const grouped = availability.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});
  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center gap-2 justify-center">
          <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Weekly Availability
        </h2>
        {availability.length === 0 ? (
          <div className="text-center text-gray-500">No availability slots added yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {daysOrder.map(day => (
              grouped[day] ? (
                <div key={day} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-lg mb-2 text-blue-800">{day}</h4>
                  <ul className="space-y-2">
                    {grouped[day].map((slot, idx) => (
                      <li key={idx} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex items-center justify-between">
                        <span className="text-blue-700 font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
