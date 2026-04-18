/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	trailingSlash: false,
	assetPrefix: '',
	serverExternalPackages: ['mongoose'],
	webpack: (config) => {
		// Crypto polyfill for browser bundles
		config.resolve.fallback = {
			...config.resolve.fallback,
			crypto: false,
		};
		return config;
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
			},
		],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	env: {
		CUSTOM_KEY: process.env.CUSTOM_KEY,
	},
};

module.exports = nextConfig;
