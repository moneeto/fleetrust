import React from 'react';
import { Users } from 'lucide-react';

const SelectPassengersCount = ({ count, onCountChange, prices }) => {
  const options = (prices || []).length
    ? [...prices].map((row) => Number(row.passengers)).sort((a, b) => a - b)
    : [2, 3];

  return (
    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
      <span className="fw-bold d-flex align-items-center gap-2">
        <Users size={20} className="text-primary" /> Number of passengers
      </span>
      <div className="btn-group" role="group">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn px-4 fw-bold ${count === n ? 'btn-primary' : 'btn-outline-primary'}`}
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
