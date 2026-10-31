import Link from "next/link";
import Faq from "@/components/faq/Faq";
import styles from "./page.module.css";

export default function PublicFaq() {
    return (
        <main className={styles.page}>
            <div className={styles.stage}>
                <p className={`brand ${styles.brand}`}>Fleetrust</p>
                <h1 className={styles.title}>FAQ's</h1>
                <p className={styles.subtitle}></p>
                <Faq />
                <Link href="/login" className={styles.back}>Back to login</Link>
            </div>
        </main>
    );
}
