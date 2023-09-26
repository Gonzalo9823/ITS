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
    <nav className="flex h-36 items-center justify-between rounded-xl bg-red-100 px-4">
      <h1 className="text-5xl font-bold">Hola, {user.name}!</h1>
      <div className="flex space-x-4">
        {user.role !== "teacher" && (
          <Link className="rounded-xl border border-black px-10 py-4 font-bold text-black hover:bg-black/50 hover:text-white" href="/dashboard">
            Dashboard
          </Link>
        )}

        {user.role === "teacher" && (
          <Link className="rounded-xl border border-black px-10 py-4 font-bold text-black hover:bg-black/50 hover:text-white" href="/teacher">
            Dashboard
          </Link>
        )}

        <button
          className="rounded-xl border border-black px-10 py-4 font-bold text-black hover:bg-black/50 hover:text-white"
          onClick={() => signOut()}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
