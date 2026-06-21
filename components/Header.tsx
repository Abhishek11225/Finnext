import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import { connectToDatabase } from "@/database/mongoose";
import { User as UserModel } from "@/database/models/User";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();
    await connectToDatabase();
    const dbUser = await UserModel.findById(user.id).select("role");
    const role = dbUser?.role || "user";
    const userWithRole = { ...user, role };

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <Image src="/assets/icons/logo.png" alt="Finnext logo" width={140} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} role={role} />
                </nav>

                <UserDropdown user={userWithRole} initialStocks={initialStocks} />
            </div>
        </header>
    )
}
export default Header
