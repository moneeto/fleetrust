import React from 'react';

const SelectPassengersCount = ({ count, onCountChange, prices }) => {
  const options = (prices || []).length
    ? [...prices].map((row) => Number(row.passengers)).sort((a, b) => a - b)
    : [2, 3];

  return (
    <div className="d-flex flex-column align-items-center gap-3 text-center">
      <h5 className="fw-bold mb-0">How many passengers?</h5>
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
