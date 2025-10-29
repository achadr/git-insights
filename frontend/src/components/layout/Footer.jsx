const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-gray-600 dark:text-gray-400">
            GitInsights © 2025 - AI-Powered Code Analysis
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Documentation
            </a>
            <span>•</span>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
