import logo from "../../assets/logo.svg";
import { useState } from "react";

const DropDownIcon = () => (
  <svg
    className="w-6 h-6"
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
      clip-rule="evenodd"
    ></path>
  </svg>
);

const NavBarLink = ({ text }: { text: string }) => (
  <a className="block md:inline-block py-4 md:py-0 text-left text-main-black hover:underline ml-4">
    {text}
  </a>
);

const NavBar = () => {
  const [navExpanded, setNavExpanded] = useState(false);
  const menuExtraClass = navExpanded ? "" : "hidden";

  return (
    <div className="bg-main sticky top-0 z-50 shadow-md flex justify-center">
      <nav className="container flex items-center flex-wrap py-1 px-4 justify-between">
        <a href="">
          <img src={logo} alt="Runit logo" width={160} />
        </a>
        <button
          className="inline-flex items-center p-3 text-white hover:bg-gray-500 rounded-md md:hidden"
          onClick={() => setNavExpanded(!navExpanded)}
        >
          <DropDownIcon />
        </button>
        <div
          className={`md:block w-full text-white items-center justify-end font-medium no-underline md:w-auto ${menuExtraClass}`}
        >
          <NavBarLink text={"Home"} />
          <NavBarLink text={"Nosotros"} />
          <NavBarLink text={"Software"} />
          <NavBarLink text={"Contáctanos"} />
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
