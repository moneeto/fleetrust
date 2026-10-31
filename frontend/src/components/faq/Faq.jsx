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
                <details key={f.question} className={styles.item} name="faq" open={i === 0}>
                    <summary className={styles.question}>
                        <span className={styles.text}>{f.question}</span>
                        <span className={styles.chevron} aria-hidden>
                            <ChevronDown size={16} strokeWidth={2.25} />
                        </span>
                    </summary>
                    <p className={styles.answer}>{f.answer}</p>
                </details>
            ))}
        </div>
    );
}
