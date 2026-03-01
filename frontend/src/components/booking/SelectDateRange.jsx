// Step2DateTime.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addHours } from 'date-fns';
import './SelectDateTime.css';
import { ApiComunicator } from '@/helpers/ApiComunicator';
import moment from 'moment';
import { Form, FormGroup, Input, Row, Col } from 'reactstrap';
import { toZonedTime } from 'date-fns-tz';

const SelectDateRange = ({ range, timeRange, onDateChange, onTimeChange }) => {
  const TIMEZONE = 'America/New_York';

  function getTodayInMiami() {
    const now = new Date();
    const miamiDate = toZonedTime(now, TIMEZONE);
    const miamiPlus2Hours = addHours(miamiDate, 2);

    return new Date(
      miamiPlus2Hours.getFullYear(),
      miamiPlus2Hours.getMonth(),
      miamiPlus2Hours.getDate()
    );
  }
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialDate, setInitialDate] = useState(getTodayInMiami());

  const selectedRange = { from: range?.from, to: range?.to };
  const selectedTimeRange = { start: timeRange?.start, end: timeRange?.end };

  return (
    <div className="step2-container">
      <div className="content-range">

        {/* Calendar */}
        <div className="calendar-wrapper">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={(d) => {
              let auxDate = { from: null, to: null };
              if (d?.from) {
                auxDate.from = d.from;
              }
              if (d?.to) {
                auxDate.to = d.to
              }
              onDateChange(d ? auxDate : '');
            }}
            numberOfMonths={2}
            className="custom-calendar"
            disabled={{ before: initialDate }}
          />
        </div>

        {selectedRange?.from && selectedRange?.to && (
          <div className="time-wrapper">
            <Row style={{ justifyContent: "center", display: "flex" }}>
              <Form onSubmit={(e) => { e.preventDefault(); }} className="d-flex flex-row gap-5 justify-content-center">
                <div>
                  <Label className="fw-semibold" htmlFor="startTime">Start time</Label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={selectedTimeRange.start || ''}
                    onChange={e => {
                      onTimeChange({ ...timeRange, start: e.target.value });
                    }}
                    className="form-control"
                  />
                </div>
                <div>
                  <Label className="fw-semibold" htmlFor="endTime">End time</Label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={selectedTimeRange.end || ''}
                    onChange={e => {
                      onTimeChange({ ...timeRange, end: e.target.value });
                    }}
                    className="form-control"
                  />
                </div>
              </Form>
            </Row>
          </div>
        )}
      </div>

      {error && <p className="text-danger mt-2">{error}</p>}

      {/* Resumen de selección */}
      {range?.from && range?.to && timeRange?.start && timeRange?.end && (
        <div className="alert alert-info mt-3 text-center">
          <strong>Booking from </strong>&nbsp;
          <span>{format(range.from, 'MM/dd/yyyy')}</span> at <span>{timeRange.start}</span>
          &nbsp;<b>to</b> <span>{format(range.to, 'MM/dd/yyyy')}</span> at <span>{timeRange.end}</span>
        </div>
      )}
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


export default SelectDateRange;
