import logo from "../../assets/logo.svg";
import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";

type linkRef = { text: string; href: string };

function parseParams(): linkRef[] {
  const { "*": room } = useParams();
  let navigation = [{ text: "home", href: "/chat" }];
  const rooms = room?.split("/");
  if (rooms === undefined || rooms[0] === "") {
    return navigation;
  }
  return navigation.concat(
    rooms.map((v, i) => ({
      text: v,
      href: `/chat/${rooms.slice(0, i + 1).join("/")}`,
    }))
  );
}

const NavBarLink = ({ link }: { link: linkRef }) => (
  <Link
    to={link.href}
    className="block md:inline-block py-4 md:py-0 text-center text-primary hover:underline font-semibold"
  >
    {link.text}
  </Link>
);

const NavBar = () => {
  const navigation = parseParams();

  return (
    <div className="bg-complement flex justify-center">
      <nav className="container flex items-center flex-wrap py-1 px-4">
        <a href="">
          <img src={logo} alt="Copuchat logo" width={120} />
        </a>
        <div className="mx-5">
          {navigation.map((v, i) => (
            <Fragment key={i}>
              <NavBarLink link={v} />
              {navigation.length === i + 1 ? " " : " / "}
            </Fragment>
          ))}
        </div>
        <div className="flex-1" />
        <div className="md:block w-full items-center justify-end font-medium no-underline md:w-auto">
          <a>User Name</a>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
