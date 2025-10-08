const express = require('express');
const router = express.Router();

router.get('/health', (req,res) => {
    res.json({
        status: 'OK',
        message: 'API is working fine',
        database: 'connected',
        timestamp: new Date().toISOString()
    });
})

 module.exports = router;