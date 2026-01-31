'use client';

import { signOut } from "next-auth/react";
import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full p-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
            <HiOutlineArrowRightOnRectangle size={18} />
            <span>Sign Out</span>
        </button>
    );
}