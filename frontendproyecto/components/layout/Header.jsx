export default function Header() {
    return (
      <header className="bg-[#002D62] text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="MindFlow" className="h-10" />
          <span className="font-bold">MINDFLOW</span>
        </div>
        <div>
          <button className="bg-white text-black px-4 py-1 rounded mr-2">Sign in</button>
          <button className="bg-white text-black px-4 py-1 rounded">Register</button>
        </div>
      </header>
    );
  }
  