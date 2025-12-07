# Freelancer Service Pricing Feature

## Overview
The freelancer system now supports blue-collar jobs, gig workers, and service-based pricing. Freelancers can list specific services they offer with individual prices.

## New Categories

### Professional Services
- Web Development, Mobile Development, Graphic Design
- Digital Marketing, Content Writing
- Photography, Video Editing
- Tutoring, Consulting
- Legal Services, Accounting

### Healthcare & Wellness
- Healthcare & Medical
- Beauty & Wellness
- Fitness Training

### Blue Collar & Gig Workers ⭐ NEW
- Plumbing
- Electrical Work
- Carpentry
- Painting & Decoration
- Cleaning Services
- Pest Control
- AC & Appliance Repair
- Vehicle Repair & Maintenance
- Construction & Masonry
- Gardening & Landscaping

### Home & Personal Services
- Home Services
- Delivery & Logistics
- Driver & Transportation
- Security Services
- Catering & Cooking
- Tailoring & Alterations
- Laundry & Dry Cleaning

### Arts & Entertainment
- Music & Arts
- Event Planning

## Service Types Schema

Freelancers can now add multiple services with individual pricing:

```javascript
serviceTypes: [
  {
    name: "Teeth Cleaning",           // Service name (required)
    description: "Professional dental cleaning",
    price: 1000,                       // Price in INR (required)
    duration: "30 minutes",            // How long it takes
    unit: "per service"                // Pricing unit
  },
  {
    name: "Root Canal",
    description: "Complete root canal treatment",
    price: 5000,
    duration: "2 hours",
    unit: "per service"
  }
]
```

### Pricing Units
- `per service` - One-time service (e.g., Teeth Cleaning: ₹1000)
- `per hour` - Hourly rate (e.g., Plumbing: ₹500/hour)
- `per day` - Daily rate (e.g., Driver: ₹2000/day)
- `per project` - Project-based (e.g., Website Design: ₹50000/project)
- `per visit` - Per visit charge (e.g., Home Cleaning: ₹800/visit)

## Example Use Cases

### 1. Dentist
```javascript
{
  category: "Healthcare & Medical",
  title: "Experienced Dentist",
  hourlyRate: 1500,  // Base consultation rate
  serviceTypes: [
    { name: "Teeth Cleaning", price: 1000, unit: "per service" },
    { name: "Tooth Filling", price: 2000, unit: "per service" },
    { name: "Root Canal", price: 5000, unit: "per service" },
    { name: "Teeth Whitening", price: 8000, unit: "per service" }
  ]
}
```

### 2. Plumber
```javascript
{
  category: "Plumbing",
  title: "Professional Plumber",
  hourlyRate: 500,
  serviceTypes: [
    { name: "Pipe Repair", price: 800, unit: "per service" },
    { name: "Tap Installation", price: 500, unit: "per service" },
    { name: "Bathroom Fitting", price: 5000, unit: "per project" },
    { name: "Emergency Service", price: 1000, unit: "per hour" }
  ]
}
```

### 3. Electrician
```javascript
{
  category: "Electrical Work",
  title: "Licensed Electrician",
  hourlyRate: 600,
  serviceTypes: [
    { name: "Wiring Repair", price: 1000, unit: "per service" },
    { name: "Fan Installation", price: 400, unit: "per service" },
    { name: "Complete House Wiring", price: 25000, unit: "per project" },
    { name: "MCB Replacement", price: 300, unit: "per service" }
  ]
}
```

### 4. Cleaning Service
```javascript
{
  category: "Cleaning Services",
  title: "Professional Cleaner",
  hourlyRate: 300,
  serviceTypes: [
    { name: "House Cleaning", price: 800, unit: "per visit" },
    { name: "Deep Cleaning", price: 2500, unit: "per visit" },
    { name: "Office Cleaning", price: 1500, unit: "per visit" },
    { name: "Sofa Cleaning", price: 1200, unit: "per service" }
  ]
}
```

## API Response

### GET /api/freelancers/categories
```json
{
  "categories": {
    "Professional Services": [...],
    "Healthcare & Wellness": [...],
    "Blue Collar & Gig Workers": [...],
    "Home & Personal Services": [...],
    "Arts & Entertainment": [...],
    "Other": [...]
  },
  "flatCategories": [...]  // All categories in a flat array
}
```

### GET /api/freelancers/search
Now includes `serviceTypes` in the response:
```json
{
  "freelancers": [
    {
      "_id": "...",
      "profileName": "Dr. Sharma Dental Clinic",
      "title": "Experienced Dentist",
      "category": "Healthcare & Medical",
      "hourlyRate": 1500,
      "serviceTypes": [
        {
          "name": "Teeth Cleaning",
          "price": 1000,
          "unit": "per service"
        },
        {
          "name": "Root Canal",
          "price": 5000,
          "unit": "per service"
        }
      ],
      "rating": 4.8,
      "totalReviews": 45
    }
  ]
}
```

## Benefits

1. **Transparent Pricing**: Customers know exactly what each service costs
2. **Multiple Services**: Freelancers can offer various services at different price points
3. **Flexible Units**: Support for hourly, per-service, per-project pricing
4. **Blue Collar Support**: Includes plumbers, electricians, cleaners, etc.
5. **Better Discovery**: Customers can search by specific services and compare prices
