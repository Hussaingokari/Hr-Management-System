export function generateStaticParams() {
    return [{ id: '1' }]; // Return at least one route to satisfy Next.js static export constraint
}

export default function Layout({ children }) {
    return children;
}
