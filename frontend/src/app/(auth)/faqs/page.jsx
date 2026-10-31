import Faq from "@/components/faq/Faq";
import styles from "./page.module.css";

export default function Faqs() {
    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Frequently asked questions</h1>
            <p className={styles.subtitle}>Everything you need to get started.</p>
            <Faq />
        </div>
    );
}
