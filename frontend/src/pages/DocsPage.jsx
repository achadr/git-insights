const DocsPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Learn how to use GitInsights to analyze your repositories
        </p>
      </div>

      <div className="space-y-8">
        {/* Getting Started */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              1
            </span>
            Getting Started
          </h2>
          <div className="ml-11 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              GitInsights analyzes GitHub repositories to provide insights about code quality, structure, and best practices.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Start:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Enter a GitHub repository URL</li>
                <li>Choose analysis method: Quick Analyze or Select Files</li>
                <li>Wait for the analysis to complete</li>
                <li>Review the detailed insights and recommendations</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Analysis Methods */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              2
            </span>
            Analysis Methods
          </h2>
          <div className="ml-11 space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Quick Analyze
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Automatically selects the most important files in your repository based on:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Entry point files (index.js, main.py, etc.)</li>
                <li>Configuration files</li>
                <li>Core application files</li>
                <li>File size and complexity</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-3">
                <strong>Best for:</strong> Quick overview of repository quality
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Select Files
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Manually choose specific files to analyze. Features include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                <li>Tree view of all repository files</li>
                <li>Search functionality to find files quickly</li>
                <li>Select up to 50 files at once</li>
                <li>Bulk select/deselect options</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-3">
                <strong>Best for:</strong> Targeted analysis of specific components
              </p>
            </div>
          </div>
        </section>

        {/* Understanding Results */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              3
            </span>
            Understanding Results
          </h2>
          <div className="ml-11 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              The analysis provides detailed metrics across multiple categories:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Overall Quality Score</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  A comprehensive score (0-100) reflecting the overall code quality based on all categories.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Structure & Organization</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Evaluates code structure, modularity, and architectural patterns.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Naming & Readability</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Assesses variable naming conventions, code clarity, and maintainability.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Error Handling</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Reviews error handling strategies and exception management.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Documentation</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Checks for comments, documentation, and code explanations.
                </p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Testing</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Identifies test coverage and testing best practices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              4
            </span>
            Best Practices
          </h2>
          <div className="ml-11">
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Start with Quick Analyze to get an overall assessment</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Use Select Files for targeted analysis of specific modules</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Review recommendations carefully for actionable improvements</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Export results for team discussions and documentation</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Re-analyze after implementing improvements to track progress</span>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
              5
            </span>
            Frequently Asked Questions
          </h2>
          <div className="ml-11 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                How long does analysis take?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Typically 10-30 seconds depending on the number of files selected. You'll see real-time progress updates.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I analyze private repositories?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Currently, GitInsights only supports public GitHub repositories.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is my code stored or shared?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                No. The analysis is performed in real-time and results are not permanently stored.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What languages are supported?
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                GitInsights works with most programming languages including JavaScript, TypeScript, Python, Java, Go, and more.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center border border-blue-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to analyze your repository?
        </h2>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 px-8 rounded-md transition-colors duration-200 font-medium transform hover:scale-105"
        >
          Get Started
        </a>
      </div>
    </div>
  );
};

export default DocsPage;
