import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {LiveAlertTracker} from "@/components/alerts/LiveAlertTracker";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const requestHeaders = await headers();
    const hasSessionCookie = Boolean(requestHeaders.get('cookie'));

    if(!hasSessionCookie) redirect('/sign-in');

    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if(!session?.user) redirect('/sign-in');

    const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    }

    return (
        <div className="min-h-screen text-gray-400">
            <LiveAlertTracker />
            <Header user={user} />

            <main className="container py-10">
                {children}
            </main>
        </div>
    )
}
export default Layout
