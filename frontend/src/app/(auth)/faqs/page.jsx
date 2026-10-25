import Faq from "@/components/faq/Faq";

export default function Faqs() {
    return (
        <div style={{ maxWidth: 720 }}>
            <h1 className="h4 mb-1">FAQ's</h1>
            <p className="text-muted mb-4">Everything you need to get started.</p>
            <Faq />
        </div>
    );
}
