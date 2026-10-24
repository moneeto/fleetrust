import React from 'react';
import { Users } from 'lucide-react';

const SelectPassengersCount = ({ count, onCountChange, prices }) => {
  const options = (prices || []).length
    ? [...prices].map((row) => Number(row.passengers)).sort((a, b) => a - b)
    : [2, 3];

  return (
    <div className="d-flex flex-column align-items-center gap-3 text-center">
      <span className="fw-bold d-flex align-items-center gap-2 text-secondary text-uppercase small">
        <Users size={18} className="text-primary" /> Number of passengers
      </span>
      <div className="d-flex justify-content-center flex-wrap gap-3">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn rounded-circle fw-bold fs-5 ${count === n ? 'btn-primary shadow' : 'btn-light border'}`}
            style={{ width: '56px', height: '56px' }}
            onClick={() => onCountChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectPassengersCount;
