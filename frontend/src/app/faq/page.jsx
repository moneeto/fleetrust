import Link from "next/link";
import Faq from "@/components/faq/Faq";
import styles from "./page.module.css";

export default function PublicFaq() {
    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <h1 className={`brand ${styles.brand}`}>Fleetrust</h1>
                <h2 className={styles.title}>Frequently asked questions</h2>
                <p className={styles.subtitle}>Everything you need to get started.</p>
            </div>
            <div className={styles.body}>
                <Faq />
                <Link href="/login" className={styles.back}>Back to login</Link>
            </div>
        </div>
    );
}
