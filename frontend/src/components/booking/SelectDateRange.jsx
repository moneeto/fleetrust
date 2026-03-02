// SelectDateRange.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Row, Col, Form } from 'reactstrap';
import './SelectDateTime.css';

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

  const [initialDate] = useState(getTodayInMiami());

  const selectedRange = { from: range?.from, to: range?.to };
  const selectedTimeRange = { start: timeRange?.start, end: timeRange?.end };

  return (
    <div className="d-flex flex-column gap-4">
      
      {/* CONTENEDOR 1: El Calendario (Tarjeta Superior) */}
      <div className="bg-white border rounded-4 shadow-sm p-3 overflow-hidden">
        <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <CalendarIcon size={18} className="text-primary" />
          <span className="fw-bold text-dark">Select Date Range</span>
        </div>
        
        <div className="d-flex justify-content-center overflow-auto">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={(d) => {
              let auxDate = { from: null, to: null };
              if (d?.from) auxDate.from = d.from;
              if (d?.to) auxDate.to = d.to;
              onDateChange(d ? auxDate : '');
            }}
            numberOfMonths={2}
            className="custom-calendar border-0 m-0"
            disabled={{ before: initialDate }}
          />
        </div>
      </div>

      {/* CONTENEDOR 2: Horarios y Resumen (Tarjeta Inferior) */}
      <AnimatePresence>
        {selectedRange?.from && selectedRange?.to && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border rounded-4 shadow-sm p-4"
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <span className="fw-bold text-dark">Flight Schedule</span>
            </div>

            <Row className="g-4 align-items-end">
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <Label className="small fw-bold text-uppercase text-muted d-block mb-2">Departure Time</Label>
                  <input
                    type="time"
                    value={selectedTimeRange.start || ''}
                    onChange={e => onTimeChange({ ...timeRange, start: e.target.value })}
                    className="form-control form-control-lg border-0 bg-transparent p-0 fw-bold"
                    style={{ fontSize: '1.5rem' }}
                  />
                  <div className="small text-muted mt-1">{format(selectedRange.from, 'PPP')}</div>
                </div>
              </Col>
              
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <Label className="small fw-bold text-uppercase text-muted d-block mb-2">Return Time</Label>
                  <input
                    type="time"
                    value={selectedTimeRange.end || ''}
                    onChange={e => onTimeChange({ ...timeRange, end: e.target.value })}
                    className="form-control form-control-lg border-0 bg-transparent p-0 fw-bold"
                    style={{ fontSize: '1.5rem' }}
                  />
                  <div className="small text-muted mt-1">{format(selectedRange.to, 'PPP')}</div>
                </div>
              </Col>
            </Row>

            {/* Resumen Final Estilizado dentro del segundo contenedor */}
            <div className="mt-4 p-3 rounded-3 text-center" style={{ backgroundColor: '#e0f2fe', border: '1px dashed #0ea5e9' }}>
              <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap text-primary">
                <span className="fw-bold">Booking from:</span>
                <span className="bg-white px-2 py-1 rounded shadow-sm text-dark small">
                  {format(range.from, 'MM/dd/yyyy')} - {timeRange.start}
                </span>
                <ArrowRight size={16} />
                <span className="bg-white px-2 py-1 rounded shadow-sm text-dark small">
                  {format(range.to, 'MM/dd/yyyy')} - {timeRange.end}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectDateRange;