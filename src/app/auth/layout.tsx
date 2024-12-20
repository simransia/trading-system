import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-screen w-full bg-cover bg-no-repeat bg-blue-950 bg-center">
      <div className="bg-gradient-to-r flex flex-col items-center justify-center from-black/75 to-blue-950/75 w-full h-full">
        <h1 className="text-xl absolute top-5 left-5 font-cursive font-bold mb-6 text-gray-300">
          Trading Hub
          <span className="absolute rounded-full bottom-0 left-0 h-[1.5px] bg-gray-100 animate-underline" />
        </h1>

        <main className="bg-white/5 border border-gray-800 shadow-md w-2/3 md:w-[40%] xl:w-[30%] px-10 py-14 h-max rounded-xl">
          {children}
        </main>
        <p className="absolute bottom-5 text-xs text-gray-500">
          © 2024 trading.com © 2024 trading systppinsem
        </p>
      </div>
    </div>
  );
};

export default Layout;
