# LinkedIn Scraper Backend

This is the backend server for the LinkedIn Scraper application. It provides API endpoints to scrape LinkedIn profiles, companies, and job listings using the Apify platform.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   APIFY_API_TOKEN=your_apify_api_token_here
   ```
   
   You can get an Apify API token by signing up at [Apify](https://apify.com/) and generating a token in your account settings.

## Apify Actor Information

This application uses the following Apify actors:
- LinkedIn Profile Scraper: Actor ID `2SyF0bVxmgGr8IVCZ`
- For company and job scraping, you may need to find and use specific actor IDs

## Running the Server

### Development mode
```
npm run dev
```

### Production mode
```
npm start
```

## API Endpoints

### Check Server Status
```
GET /
```

### Scrape LinkedIn Profiles
```
POST /api/scrape/profile
```
Request body:
```json
{
  "profileUrls": [
    "https://www.linkedin.com/in/profile1",
    "https://www.linkedin.com/in/profile2"
  ]
}
```

### Scrape LinkedIn Companies
```
POST /api/scrape/company
```
Request body:
```json
{
  "companyUrls": [
    "https://www.linkedin.com/company/company1",
    "https://www.linkedin.com/company/company2"
  ]
}
```

### Scrape LinkedIn Jobs
```
POST /api/scrape/jobs
```
Request body:
```json
{
  "searchTerms": ["software engineer", "web developer"],
  "location": "New York",
  "limit": 50
}
``` #   H i g h _ I n t e l l i g e n c e _ B a c k e n d  
 