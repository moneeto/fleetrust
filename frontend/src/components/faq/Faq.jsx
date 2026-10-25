import { ChevronDown } from "lucide-react";
import styles from "./Faq.module.css";

const faqs = [
    {
        question: "What is Fleetrust?",
        answer: "A tool to manage your aircraft operations, organize your hangar and make decisions with valuable information.",
    },
    {
        question: "How to use Fleetrust?",
        answer: "Register your account with Google or email. Once inside, register your services, your aircrafts, your pilots and, optionally, your addons, to start operating and viewing your flights.",
    },
];

export default function Faq() {
    return (
        <div className={styles.list}>
            {faqs.map((f, i) => (
                <details key={f.question} className={styles.item} open={i === 0}>
                    <summary className={styles.question}>
                        <span className={styles.number}>{i + 1}</span>
                        <span className={styles.text}>{f.question}</span>
                        <ChevronDown size={18} className={styles.chevron} />
                    </summary>
                    <p className={styles.answer}>{f.answer}</p>
                </details>
            ))}
        </div>
    );
}
