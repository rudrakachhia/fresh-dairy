# Dairy Website Login System

A modern login system for a dairy products website built with Node.js, Express, MongoDB, and modern frontend technologies.

## Features

- Modern, responsive UI
- User registration and login functionality
- Session management
- MongoDB database integration
- Secure password handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dairy-website
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/dairy_website
PORT=3000
```

4. Start the server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `server.js` - Main application file with Express and MongoDB setup
- `public/` - Static files
  - `index.html` - Login page HTML
  - `styles.css` - Styling
  - `script.js` - Frontend JavaScript

## Security Notes

- In a production environment, make sure to:
  - Use HTTPS
  - Implement proper password hashing (e.g., with bcrypt)
  - Set secure session cookies
  - Add rate limiting
  - Implement proper error handling
  - Use environment variables for sensitive data

## Contributing

Feel free to submit issues and enhancement requests. 