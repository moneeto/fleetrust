import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const Spinner = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50/50">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-dashed border-sky-100 rounded-full"></div>
        
        <motion.div
          className="absolute inset-0 flex items-start justify-center"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear"
          }}
        >
          <motion.div 
            animate={{ y: [0, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Plane className="text-sky-600 fill-sky-600 rotate-45" size={32} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Spinner;