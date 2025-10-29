const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            GitInsights
          </div>
          <nav className="flex gap-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition">
              Examples
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition">
              Docs
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
