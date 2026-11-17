const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const body=fs.readFileSync(path.resolve(__dirname,'../src/components/ServicesClient.tsx'),'utf8');
test('services and database booking use the same configured owned number',()=>{
 assert.ok(body.includes('parseBookingNumber(process.env.NEXT_PUBLIC_BOOKING_WHATSAPP)'));
 assert.ok(!body.includes('+966551112233'));
 assert.ok(!body.includes('+971508889900'));
 assert.ok(body.includes('disabled={!bookingNumber}'));
 assert.ok(body.includes('noopener,noreferrer'));
});
test('services refuse to represent missing currency rates as AED 3.67',()=>{
 assert.ok(body.includes('supportedCountries = countries.filter'));
 assert.ok(body.includes('getUsdRate(defaultCountry.currency, rates) ?? 1'));
 assert.ok(!body.includes('rates[defaultCountry.currency] || 3.67'));
 assert.ok(body.includes('code: "US", symbol: "$", currency: "USD"'));
});
