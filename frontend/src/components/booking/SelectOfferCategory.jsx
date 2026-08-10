'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, PlaneTakeoff, Palmtree, Sun  } from 'lucide-react';

const SelectOfferCategory = ({ onSelect }) => {
    return (
        <div className="d-flex flex-column gap-4 align-items-center">
            <p className="text-muted text-center mb-2">
                What would you like to book?
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center gap-2 p-4"
                    style={{ minWidth: '160px', height: '120px' }}
                    onClick={() => onSelect('tour')}
                >
                    <Plane size={32} />
                    <span>Tour</span>
                </motion.button>

                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center gap-2 p-4"
                    style={{ minWidth: '160px', height: '120px' }}
                    onClick={() => onSelect('experience')}
                >
                    <Sun size={32} />
                    <span>Experience</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SelectOfferCategory;
