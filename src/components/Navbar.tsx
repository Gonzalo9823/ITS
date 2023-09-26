import { signOut } from "next-auth/react";
import Link from "next/link";
import type { FunctionComponent } from "react";

interface NavbarProps {
  user: {
    name: string;
    role: "student" | "teacher";
  };
}

const Navbar: FunctionComponent<NavbarProps> = ({ user }) => {
  return (
    <nav className="flex h-20 items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-4">
      <h1 className="text-3xl font-bold capitalize">Hola, {user.name.toLowerCase()}!</h1>
      <div className="flex space-x-4">
        {user.role !== "teacher" && (
          <Link
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            href="/dashboard"
          >
            Dashboard
          </Link>
        )}

        {user.role === "teacher" && (
          <Link
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            href="/teacher"
          >
            Dashboard
          </Link>
        )}

        <button
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={() => signOut()}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
