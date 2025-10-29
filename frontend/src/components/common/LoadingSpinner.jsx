const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-center text-gray-600">
          Analyzing repository...
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
