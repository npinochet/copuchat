import { XIcon } from "../../assets/icons";
import { userNameAtom } from "../../data/atoms";
import { client } from "../../data/pb";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const initialUserName =
    "Anon#" + (Math.random() * 10000).toFixed(0).padStart(4, "0");
  const [username, setUsername] = useState(initialUserName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setAtomUserName = useSetAtom(userNameAtom);

  const login = async () => {
    try {
      const userData = await client
        .collection("users")
        .authWithPassword(email, password);
      navigate("/app");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="bg-complement flex flex-1 flex-col items-center p-10">
      <div className="w-full max-w-[24rem]">
        <div className="text-3xl mt-5 text-center">
          <h2>Welcome!</h2>
          <p className="text-2xl">Choose a user name</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center flex-wrap m-3 w-full">
            <label className="basis-24 mr-2">User Name</label>
            <input
              className="bg-background w-44 flex-1 outline outline-1 p-1 outline-text focus:outline-primary cursor-text"
              type="text"
              onChange={(event) => setUsername(event.currentTarget.value)}
              placeholder={initialUserName}
            />
          </div>
          <button
            className="bg-primary text-secondary font-semibold my-2 px-5 w-full min-h-[32px] text-lg hover:bg-accent cursor-pointer"
            onClick={() => {
              setAtomUserName(username || initialUserName);
            }}
          >
            Start chatting!
          </button>
          <div className="my-5" />
          <p className="text-center text-2xl">
            Or register to keep the user name
          </p>
          <div className="flex items-center flex-wrap m-3 w-full">
            <label className="basis-24 mr-2">Email</label>
            <input
              className="bg-background w-44 flex-1 outline outline-1 p-1 outline-text focus:outline-primary cursor-text"
              type="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="email"
            />
          </div>
          <div className="flex items-center flex-wrap m-3 w-full">
            <label className="basis-24 mr-2">Password</label>
            <input
              className="bg-background w-44 flex-1 outline outline-1 p-1 outline-text focus:outline-primary cursor-text"
              type="password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="password"
              required
            />
          </div>
          <button
            className="bg-primary text-secondary font-semibold my-2 px-5 w-full min-h-[32px] text-lg hover:bg-accent cursor-pointer"
            onClick={login}
          >
            Register
          </button>
        </div>
        {error && (
          <div>
            <XIcon />
            {error}
          </div>
        )}
      </div>
    </section>
  );
};

export default Auth;
