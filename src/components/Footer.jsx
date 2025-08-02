import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Powered By{' '}
          <a
            href="https://www.botivate.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            Botivate
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;