// SelectDateRange.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Row, Col } from 'reactstrap';
import useIsMobile from '@/hooks/useIsMobile';
import './SelectDateTime.css';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatLocalDate = (dateObj) => {
  if (!dateObj) return '';
  const d = dateObj instanceof Date ? dateObj : parseLocalDate(dateObj);
  if (!d) return '';
  return format(d, 'yyyy-MM-dd');
};

const SelectDateRange = ({ range, timeRange, onDateChange, onTimeChange }) => {
  const TIMEZONE = 'America/New_York';
  const isMobile = useIsMobile();

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
  const minDateStr = formatLocalDate(initialDate);

  const selectedRange = { from: range?.from, to: range?.to };
  const selectedTimeRange = { start: timeRange?.start, end: timeRange?.end };

  const fromStr = formatLocalDate(selectedRange.from);
  const toStr = formatLocalDate(selectedRange.to);

  const handleNativeDateChange = (field, value) => {
    const next = {
      from: field === 'from' ? (value ? parseLocalDate(value) : null) : selectedRange.from,
      to: field === 'to' ? (value ? parseLocalDate(value) : null) : selectedRange.to,
    };
    onDateChange(next.from || next.to ? next : { from: null, to: null });
  };

  const timeSection = selectedRange?.from && selectedRange?.to && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white border rounded-4 shadow-sm p-4"
    >
      <div className="d-flex align-items-center gap-2 mb-4">
        <span className="fw-bold text-dark">Flight Schedule</span>
      </div>

      <Row className="g-4 align-items-end">
      <p>You can change the hour by clicking in the clock</p>
        <Col md={6} xs={12}>
          <div className="p-3 bg-light rounded-3">
            <Label className="small fw-bold text-uppercase text-muted d-block mb-2">Departure</Label>
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

        <Col md={6} xs={12}>
          <div className="p-3 bg-light rounded-3">
            <Label className="small fw-bold text-uppercase text-muted d-block mb-2">Return</Label>
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
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className="d-flex flex-column gap-3">
        <div className="mobile-native-fields">
          {/* <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fw-bold text-dark">Select Date Range</span>
          </div> */}
          <Label className="small fw-bold text-uppercase text-muted" htmlFor="range-from">From</Label>
          <input
            id="range-from"
            type="date"
            className="form-control form-control-lg mb-3"
            min={minDateStr}
            value={fromStr}
            onChange={(e) => handleNativeDateChange('from', e.target.value)}
          />
          <Label className="small fw-bold text-uppercase text-muted" htmlFor="range-to">To</Label>
          <input
            id="range-to"
            type="date"
            className="form-control form-control-lg"
            min={fromStr || minDateStr}
            value={toStr}
            onChange={(e) => handleNativeDateChange('to', e.target.value)}
          />
        </div>

        <AnimatePresence>
          {timeSection}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">

      {/* CONTENEDOR 1: El Calendario (Tarjeta Superior) */}
      <div className="bg-white border rounded-4 shadow-sm p-3 overflow-hidden">
        {/* <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <span className="fw-bold text-dark">Select Date Range</span>
        </div> */}

        <div className="d-flex justify-content-between overflow-auto">
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
        {timeSection}
      </AnimatePresence>
    </div>
  );
};

export default SelectDateRange;
