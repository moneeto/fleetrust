// Step2DateTime.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import './SelectDateTime.css';
import { ApiComunicator } from '@/helpers/ApiComunicator';

const SelectDateTime = ({ date, time, onDateChange, onTimeChange }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 👇 Date LOCAL seguro (no UTC)
  const selectedDate = parseLocalDate(date);

  const fetchAvailableHours = async (dateObj) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = formatLocalDate(dateObj);

      const data = await ApiComunicator(
        `/reservations/availableHours?date=${formattedDate}`,
        'GET'
      );

      setTimeSlots(data.availableHours || []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableHours(selectedDate);
    }
  }, [date]);

  return (
    <div className="step2-container">
      <div className="content">

        {/* Calendar */}
        <div className="calendar-wrapper">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(d) =>
              onDateChange(d ? formatLocalDate(d) : '')
            }
            className="custom-calendar"
          />
        </div>

        <div className="time-wrapper">
          <div className="time-grid">
            {timeSlots && timeSlots?.length > 0 ? timeSlots?.map((slot) => (
              <motion.button
                key={slot}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTimeChange(slot)}
                disabled={!selectedDate}
                className={`time-slot ${time === slot
                  ? 'time-slot-selected'
                  : selectedDate
                    ? 'time-slot-enabled'
                    : 'time-slot-disabled'
                  }`}
              >
                {slot}
              </motion.button>
            ))
              :
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="no-slots-container d-flex flex-column align-items-center justify-content-center p-5 text-center"
              >
                <div className="icon-container mb-3">
                  <AlertCircle size={48} className="text-muted opacity-50" />
                </div>
                <h5 className="text-muted fw-normal">No timeslots available</h5>
                <p className="text-secondary small">
                  All timeslots has been already taken for this day. Please select another day.
                </p>
              </motion.div>
            }
          </div>
        </div>
      </div>

      {date && time && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="summary mt-6"
        >
          <Calendar className="summary-icon" />
          <span>
            {format(parseLocalDate(date), 'MMMM d, yyyy')}
          </span>
          <span className="mx-2">•</span>
          <Clock className="summary-icon" />
          <span>{time}</span>
        </motion.div>
      )}

      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatLocalDate = (dateObj) => {
  return format(
    new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    ),
    'yyyy-MM-dd'
  );
};


export default SelectDateTime;
