import React from 'react';
import { motion } from 'framer-motion';
import { Users, Check } from 'lucide-react';
import './SelectPassengersNumber.css';

const SelectPassengersCount = ({ count, onCountChange, prices }) => {
  const options = (prices || []).length
    ? [...prices]
        .sort((a, b) => Number(a.passengers) - Number(b.passengers))
        .map((row) => ({
          id: Number(row.passengers),
          label: `${row.passengers} passenger${Number(row.passengers) === 1 ? '' : 's'}`,
        }))
    : [
        { id: 2, label: '2 passengers' },
        { id: 3, label: '3 passengers' },
      ];

  return (
    <div className="passenger-container">
      <div className="options-stack">
        {options.map((option) => {
          const isSelected = count === option.id;
          return (
            <motion.div
              key={option.id}
              onClick={() => onCountChange(option.id)}
              className={`passenger-card ${isSelected ? 'selected' : ''}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`icon-box ${isSelected ? 'active' : ''}`}>
                <Users size={28} />
              </div>

              <div className="card-content">
                <div className="card-info">
                  <span className="label-sub"></span>
                  <h4 className="label-title">{option.label}</h4>
                </div>

                <div className="selection-indicator">
                    <div className={`radio-circle ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <motion.div layoutId="check" className="inner-check"><Check size={14} strokeWidth={4}/></motion.div>}
                    </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectPassengersCount;
