const db = require('./src/models');

async function verify() {
    console.log('\n🔍 Verifying Paranoid Mode Configuration:\n');
    
    console.log('Diamond Model:');
    console.log('  - paranoid:', db.Diamond.options.paranoid);
    console.log('  - deletedAt:', db.Diamond.options.deletedAt);
    console.log('  - timestamps:', db.Diamond.options.timestamps);
    
    console.log('\nBid Model:');
    console.log('  - paranoid:', db.Bid.options.paranoid);
    console.log('  - deletedAt:', db.Bid.options.deletedAt);
    
    console.log('\nBidHistory Model:');
    console.log('  - paranoid:', db.BidHistory.options.paranoid);
    console.log('  - deletedAt:', db.BidHistory.options.deletedAt);
    
    console.log('\nResult Model:');
    console.log('  - paranoid:', db.Result.options.paranoid);
    console.log('  - deletedAt:', db.Result.options.deletedAt);
    
    console.log('\n✅ Verification complete!\n');
    process.exit(0);
}

verify();
