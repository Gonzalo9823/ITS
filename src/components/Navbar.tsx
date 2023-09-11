import type { FunctionComponent } from "react";

interface NavbarProps {
  user: {
    name: string;
  };
}

const Navbar: FunctionComponent<NavbarProps> = ({ user }) => {
  return (
    <nav className="flex h-36 items-center rounded-xl bg-red-100 px-4">
      <h1 className="text-5xl font-bold">Hola, {user.name}!</h1>
    </nav>
  );
};

export default Navbar;
