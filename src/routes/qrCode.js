const express = require('express');
const passport = require('../config/passport');
const Restaurant = require('../models/Restaurant');
const { checkSubscription } = require('../middleware/subscription');
const router = express.Router();

// Generate QR code for restaurant menu
router.get('/restaurant/:restaurantId',
  passport.authenticate('jwt', { session: false }),
  checkSubscription,
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify restaurant ownership
      const restaurant = await Restaurant.findOne({ 
        _id: restaurantId, 
        ownerId: req.user._id 
      });
      
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found or access denied' });
      }

      const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu/${restaurant.qrMenu.menuSlug}`;
      
      // Generate QR code using Google Charts API (free)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;
      
      res.json({ 
        qrCodeUrl,
        menuUrl,
        menuSlug: restaurant.qrMenu.menuSlug
      });
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  }
);

// Get printable QR code page
router.get('/print/:restaurantId', async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      const restaurant = await Restaurant.findById(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu/${restaurant.qrMenu.menuSlug}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`;
      
      // Return HTML for printing
      const printableHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Menu - ${restaurant.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background: white;
            }
            .qr-container { 
              border: 2px solid #333; 
              padding: 30px; 
              margin: 20px auto; 
              max-width: 500px;
              border-radius: 10px;
            }
            .restaurant-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: ${restaurant.primaryColor || '#F97316'};
            }
            .instruction { 
              font-size: 16px; 
              margin: 15px 0;
              color: #666;
            }
            .qr-code { 
              margin: 20px 0; 
            }
            .url { 
              font-size: 12px; 
              color: #888; 
              word-break: break-all;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="instruction">📱 Scan QR Code to View Our Menu</div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            <div class="instruction">
              ${restaurant.cuisineType.join(' • ')}
            </div>
            <div class="url">${menuUrl}</div>
          </div>
          <div class="no-print" style="margin-top: 30px;">
            <button onclick="window.print()" style="
              background: ${restaurant.primaryColor || '#F97316'}; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 5px; 
              cursor: pointer;
              font-size: 16px;
            ">🖨️ Print QR Code</button>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(printableHtml);
    } catch (error) {
      console.error('❌ Error generating printable QR:', error);
      res.status(500).json({ error: 'Failed to generate printable QR code' });
    }
  }
);

module.exports = router;