import Overlay from "../../assets/overlay.jpg";
import Santiago from "../../assets/santiago.webp";

const Header = () => {
  return (
    <div style={{ backgroundImage: `url(${Santiago})` }}>
      <div className="bg-opacity-75" style={{ background: "#f3e9e2e6" }}>
        <div
          className="container flex justify-center items-center m-auto w-80vh"
          style={{ minHeight: "400px", height: "calc(95vh - 68px)" }}
        >
          <div className="w-3/5 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-main">
              Success starts with hardworking consultants
            </h2>
            <p className="text-lg lg:text-2xl text-gray-700 py-14">
              Somos una firma de capitales chilenos que opera en diversos países
              de Latinoamérica.
            </p>
            <button className="bg-main hover:opacity-70 text-white text-md md:text-xl font-bold py-4 px-8 rounded">
              Contáctanos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
