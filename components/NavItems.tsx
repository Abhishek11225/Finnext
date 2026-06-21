'use client'

import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import SearchCommand from "@/components/SearchCommand";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mentorHubItems = [
    { href: "/professional/dashboard", label: "Pro Dashboard" },
    { href: "/professional/requests", label: "Requests" },
    { href: "/professional/students", label: "Beginners" },
];

const NavItems = ({initialStocks, role = 'user'}: { initialStocks: StockWithWatchlistStatus[], role?: 'user' | 'professional'}) => {
    const pathname = usePathname()
    const visibleItems = NAV_ITEMS.filter((item) => {
        if (role === 'professional') {
            return !['/mentor-marketplace'].includes(item.href) && !item.href.startsWith('/professional');
        }

        return !item.href.startsWith('/professional');
    });

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-5 lg:gap-8 font-medium">
            {role === 'professional' && (
                <li>
                    <DropdownMenu>
                        <DropdownMenuTrigger className={`hover:text-yellow-500 transition-colors outline-none ${
                            pathname.startsWith('/professional') ? 'text-gray-100' : ''
                        }`}>
                            Mentor Hub
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0B0D10] border-[#212328] text-gray-300">
                            {mentorHubItems.map((item) => (
                                <DropdownMenuItem key={item.href} asChild className="focus:bg-[#141414] focus:text-yellow-500">
                                    <Link href={item.href}>{item.label}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </li>
            )}
            {visibleItems.map(({ href, label }) => {
                if(href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                )

                return <li key={href}>
                    <Link href={href} className={`hover:text-yellow-500 transition-colors ${
                        isActive(href) ? 'text-gray-100' : ''
                    }`}>
                        {label}
                    </Link>
                </li>
            })}
        </ul>
    )
}
export default NavItems
