import React from "react";

const Register: React.FC = () => {
  return (
    <div className="h-screen bg-cover bg-center flex justify-center items-center bg-gradient-to-r from-red-500 to-pink-50">
      <div className="h-[80%] w-[70%] bg-white flex justify-center items-center text-black shadow-[0_6px_15px_rgba(100,100,100,0.3)] rounded-2xl">
        <div className="h-full w-1/2 bg-white rounded-2xl flex flex-col justify-evenly items-center px-8 py-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Welcome to <span className="text-red-600">ShareVault</span>
            </h1>
            <p className="text-gray-600 text-base">
              Where your data stays safe and goes wherever you want.
            </p>
          </div>
          <div className="text-center mt-4 space-y-2">
            <p className="text-gray-700 text-lg">
              Upload, store, and share your files with confidence.
            </p>
            <p className="text-gray-700 text-lg">
              Secure access. Easy sharing. All in one place.
            </p>
          </div>
          <div className="mt-6">
            <button className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition duration-300">
              Get Started
            </button>
          </div>
        </div>

        <div className="h-[100%] w-[50%] bg-red-500 rounded-2xl shadow-[0_6px_15px_rgba(100,100,100,0.5)] flex justify-center flex-col items-center">
          <h1 className="text-4xl font-bold text-white m-2">
            Register Account
          </h1>
          <input
            type="text"
            placeholder="Name"
            className="w-[60%] border-2 border-white bg-transparent mt-5 text-white placeholder-white rounded-2xl p-2 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none "
          />
          <input
            type="password"
            placeholder="Password"
            className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none"
          />
          <p className="text-white m-3">
            Already have an account?{" "}
            <a className=" hover:font-bold" href="/">
              Login
            </a>
          </p>
          <button className="w-[30%] border-2 border-white bg-transparent mt-8 text-white rounded-full px-6 py-2 hover:bg-white hover:text-red-500 transition-all cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
