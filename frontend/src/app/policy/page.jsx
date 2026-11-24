import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/legal";
import styles from "./page.module.css";

export const metadata = {
    title: "Privacy Policy | Fleetrust",
    description: "How Fleetrust collects, uses, shares and protects your data.",
};

const LAST_UPDATED = "November 24, 2026";

const sections = [
    {
        title: "1. Who we are",
        body: [
            "Fleetrust (the \"App\") is a back-office tool to manage aircraft operations, tours, bookings, pilots, maintenance and related information. The App is operated by Loderole (together with Fleetrust, \"we\", \"us\" or \"our\").",
            "This Privacy Policy applies to the Fleetrust web app and the Fleetrust Android/iOS app, and explains what data we collect, how we use and share it, and the choices and responsibilities you have.",
        ],
    },
    {
        title: "2. Data we collect",
        list: [
            "Account data: email address and password (stored only as a one-way hash), or your Google account identifier and email if you sign in with Google.",
            "Authentication data: one-time verification codes, password-recovery codes, and passkey/biometric public credentials. Your fingerprint or face data never leaves your device and is never received by us.",
            "Business data you enter: services, aircraft, pilots, bookings, passengers, customers, prices, reviews, maintenance and work orders, photos, documents and any other content you upload.",
            "Third-party personal data: names, contact details and similar information about your own customers, passengers and staff that you choose to store in the App.",
            "Device and technical data: push notification token, platform, IP address, browser/device information, and activity logs used for security and troubleshooting.",
            "Camera access: only if you use the QR scanner feature. Images are processed on your device to read the code and are not stored by us.",
        ],
    },
    {
        title: "3. How we use your data",
        list: [
            "To create and secure your account, verify your email and authenticate you.",
            "To provide the App's features, such as bookings, calendars, boarding passes and notifications.",
            "To send transactional emails and push notifications related to your account and operations.",
            "To detect and prevent fraud, abuse, spam and security incidents (for example with reCAPTCHA).",
            "To maintain, debug and improve the App, and to comply with legal obligations.",
        ],
        after: "We do not sell your personal data and we do not use it for third-party advertising.",
    },
    {
        title: "4. Who we share data with",
        body: ["We share data only as needed to run the App, with these types of parties:"],
        list: [
            "Google: sign-in with Google and reCAPTCHA (spam and abuse protection).",
            "Firebase / Google Cloud Messaging: delivery of push notifications.",
            "Email delivery provider: sending verification codes, recovery links and booking emails.",
            "Hosting and infrastructure providers: servers and databases where data is stored and processed.",
            "Authorities or legal advisers: when required by law, court order, or to protect rights, safety and security.",
            "Other users of your account: people you invite to your organization can see the data shared within it, according to the permissions you grant.",
        ],
    },
    {
        id: "delete-account",
        title: "5. Data retention and how to delete your account and data",
        body: [
            "We keep your data while your account is active and as long as needed to provide the App or meet legal obligations. You can request the deletion of your account and associated data at any time (Fleetrust, by Loderole, package com.fleetrust.app).",
            "How to request deletion:",
        ],
        steps: [
            { text: `Send an email to ${CONTACT_EMAIL} from the email address registered in your Fleetrust account (or include it in the message if you signed in with Google).` },
            { text: "Use the subject \"Fleetrust - Account deletion request\" and state that you want your account and data deleted." },
            { text: "We may reply to confirm your identity, to protect you from someone else deleting your data." },
            { text: "Once confirmed, we delete your data within 30 days and notify you by email when it is done." },
        ],
        list: [
            "Deleted: login credentials (email, password hash, Google identifier), passkey/biometric credentials, recovery and verification codes, push notification tokens and your profile.",
            "Deleted if you are the owner of an organization account: all business data in it (services, aircraft, pilots, bookings, passengers, customers, reviews, maintenance records, photos and documents). Tell us in your request if you only want part of it removed.",
            "Deleted if you were invited to someone else's organization: only your own profile and credentials. The organization's business data belongs to its owner and is kept.",
            "Kept for a limited time: encrypted backups (up to 90 days, until overwritten) and security/audit logs or records we must keep to comply with the law or resolve disputes, only as long as strictly needed.",
        ],
    },
    {
        title: "6. Security",
        body: [
            "We use reasonable technical and organizational measures such as encrypted connections (HTTPS), hashed passwords, access controls and request rate limiting. However, no system is completely secure, and we cannot guarantee absolute security of your information.",
        ],
    },
    {
        title: "7. Your responsibilities",
        list: [
            "Keep your credentials, devices, passkeys and recovery codes secret and secure, and use a strong, unique password.",
            "You are solely responsible for all activity carried out with your account, including activity by people you invite or to whom you give access.",
            "Notify us immediately if you suspect unauthorized access to your account.",
            "You are responsible for having a legal basis (such as consent) to store your customers', passengers' and staff's personal data in the App, and for complying with the privacy and aviation laws that apply to your business.",
            "Do not use the App for unlawful purposes, to attack or interfere with it, or to access data that is not yours.",
        ],
    },
    {
        title: "8. Disclaimer and limitation of liability",
        body: [
            "To the maximum extent permitted by applicable law, the App is provided \"as is\" and \"as available\", without warranties of any kind.",
            "Fleetrust and Loderole, and their owners, directors, employees and collaborators, are not liable for any loss or damage arising from: (a) misuse of the App or of your account by third parties, including people you authorize or who obtain access because of lost, shared or poorly protected credentials or devices; (b) unauthorized access, hacking, malware, phishing or other cyberattacks, including attacks on third-party services we rely on, when we have applied the reasonable security measures described in this policy; (c) disclosure, loss or alteration of information that you or your users enter, share or publish; (d) interruptions, errors or data loss caused by third-party providers, networks or force majeure events; and (e) decisions, operations, flights or maintenance actions taken based on information stored in the App, which remain the sole responsibility of the operator.",
            "Nothing in this policy excludes or limits liability that cannot be excluded or limited under applicable law, such as liability for fraud, willful misconduct, or rights that consumer and data protection laws grant to you.",
        ],
    },
    {
        title: "9. Acceptance",
        body: [
            "By creating an account, signing in with Google or otherwise using the App, you confirm that you have read, understood and accepted this Privacy Policy, including your responsibilities in section 7 and the disclaimer in section 8. If you do not agree, do not register or use the App.",
        ],
    },
    {
        title: "10. Children",
        body: [
            "The App is a professional tool and is not directed to children. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us data, contact us and we will delete it.",
        ],
    },
    {
        title: "11. International transfers",
        body: [
            "Our providers may process data in countries other than your own. When we do, we rely on the safeguards offered by those providers to protect your data.",
        ],
    },
    {
        title: "12. Changes to this policy",
        body: [
            "We may update this policy from time to time. The latest version is always available at this page with its \"last updated\" date. Continued use of the App after a change means you accept the updated policy.",
        ],
    },
    {
        title: "13. Contact",
        body: [`For questions or requests about privacy, contact us at ${CONTACT_EMAIL}.`],
    },
];

export default function PrivacyPolicy() {
    return (
        <main className={styles.page}>
            <article className={styles.stage}>
                <p className={`brand ${styles.brand}`}>Fleetrust</p>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

                {sections.map((s) => (
                    <section key={s.title} id={s.id} className={styles.section}>
                        <h2>{s.title}</h2>
                        {s.body?.map((p) => <p key={p}>{p}</p>)}
                        {s.steps && (
                            <ol>
                                {s.steps.map((step) => <li key={step.text}>{step.text}</li>)}
                            </ol>
                        )}
                        {s.list && (
                            <ul>
                                {s.list.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        )}
                        {s.after && <p>{s.after}</p>}
                    </section>
                ))}

                <Link href="/login" className={styles.back}>Back to login</Link>
            </article>
        </main>
    );
}
