/**
 * BID MODULE
 * 
 * STEP 3: Bid Placement & Update Logic
 * 
 * Core bidding engine with:
 * ✓ Transaction-safe logic
 * ✓ Complete audit trail (bid_history)
 * ✓ Business rules enforcement
 * ✓ Admin & user views
 */

const bidRoutes = require('./routes/bidRoutes');

module.exports = {
    bidRoutes,
};
