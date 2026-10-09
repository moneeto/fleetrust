'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

const SelectBookingType = ({ onSelect }) => {
    return (
        <div className="d-flex flex-column gap-4 align-items-center">
            
            <div className="d-flex gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center gap-2 p-4"
                    style={{ minWidth: '160px', height: '120px' }} 
                    onClick={() => onSelect('me')}
                >
                    <User size={32} />
                    <span>Single</span>
                </motion.button>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center gap-2 p-4"
                    style={{ minWidth: '160px', height: '120px' }}
                    onClick={() => onSelect('others')}
                >
                    <Users size={32} />
                    <span>To passengers</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SelectBookingType;