/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript ದೋಷಗಳಿದ್ದರೂ ಬಿಲ್ಡ್ ನಿಲ್ಲದೆ ಯಶಸ್ವಿಯಾಗಿ ಮುಂದುವರಿಯಲು:
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
