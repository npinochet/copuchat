import Header from "./header";
import NavBar from "./navbar";

const Landing = () => {
  return (
    <>
      <NavBar />
      <Header />
      <div
        className="absolute h-12 mt-[-3rem] w-screen"
        style={{
          background:
            "linear-gradient(180deg, rgba(229,231,235,0) 0%, rgb(229,231,235) 100%)",
        }}
      />
      <div
        className="flex p-10 bg-gray-200" /*style={{ backgroundColor: "#698a90" }}*/
      >
        <div className="w-1/2">
          <img src="https://professional.dce.harvard.edu/wp-content/uploads/sites/9/2021/11/building-consulting-business.gif" />
        </div>
        <div className="m-auto text-main">
          <h5>Titulo</h5>
          <p>Holas y chaos</p>
        </div>
      </div>
    </>
  );
};

export default Landing;
