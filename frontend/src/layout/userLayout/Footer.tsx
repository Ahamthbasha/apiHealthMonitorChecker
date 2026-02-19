// components/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-gray-500">
            API Health Monitor crafted by{" "}
            <span className="font-semibold text-green-400">Ahamathbasha</span>
          </p>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;