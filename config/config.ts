const config = {
    rateLimiter: {
        maxAttemptsByIpUsername: 10,
        maxAttemptsPerEmail: 5,
        maxAttemptsPerDay: 100,
    },
    companyInfo: {
        email: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        service: process.env.EMAIL_SERVICE, // or your SMTP email service provider
    },
      cloudImage: {
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET
    },
};



export default config;
