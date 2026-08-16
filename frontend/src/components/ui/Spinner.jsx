import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const Spinner = ({ overlay = false }) => {
  return (
    <div
      style={
        overlay
          ? {
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(248, 249, 250, 0.55)",
              zIndex: 2000,
            }
          : {
              height: "80svh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
      }
    >
      <div
        style={{
          position: "relative",
          height: "100px",
          width: "100px"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "4px dashed #93c5fd",
            borderRadius: "50%"
          }}
        ></div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center"
          }}
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
            <Plane
              size={32}
              style={{
                color: "#0284c7",
                fill: "#0284c7",
                transform: "rotate(45deg)"
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Spinner;
