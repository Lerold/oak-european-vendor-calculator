-- Migration 002: Vendor customization + FAQ storage

-- Add vendor customization columns
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#4a8c3f';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100) DEFAULT 'Request a Quote';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS default_country VARCHAR(3);

-- Pre-seed FAQ content in settings
INSERT INTO settings (key, value) VALUES
    ('faq_content', '## What is equipment leasing?

Equipment leasing is a financing method that allows businesses to use equipment without purchasing it outright. Instead, you make regular payments over a fixed term, and at the end of the lease, you may have options to purchase, return, or upgrade the equipment.

## Who can lease equipment in Europe?

Any registered business operating within the European Economic Area (EEA) can typically apply for equipment leasing. Requirements vary by country, but generally you need to be a registered company with a trading history.

## Which countries do you cover?

Oaklease provides leasing solutions across Europe, including Germany, France, Italy, Spain, Netherlands, Sweden, Denmark, Finland, Norway, Poland, Portugal, Greece, Hungary, Czech Republic, Romania, Croatia, Slovakia, and Slovenia.

## What amounts and terms are available?

Lease amounts typically range from €3,000 to €15,000,000, with terms from 24 to 84 months depending on the country and equipment type. Each country may have specific minimum and maximum values.

## How do deposits and advance payments work?

Most leases require an advance payment, typically equivalent to 1-3 monthly payments. This is paid upfront and reduces the amount financed. Some countries offer zero-deposit options.

## What is the difference between finance and operating leases?

A **finance lease** transfers substantially all risks and rewards of ownership to the lessee. The asset appears on your balance sheet. An **operating lease** is more like a rental — the lessor retains ownership and the payments are treated as an operating expense.

## How does IFRS 16 affect leasing?

IFRS 16 requires lessees to recognise most leases on the balance sheet as a right-of-use asset and a corresponding liability. This applies to all leases over 12 months, with exemptions for low-value assets.

## What are the end-of-lease options?

Depending on the lease type and country regulations, options may include: purchasing the equipment at fair market value, extending the lease, returning the equipment, or upgrading to newer equipment.

## What is a vendor leasing programme?

A vendor programme allows equipment manufacturers and distributors to offer leasing directly to their customers through Oaklease. The vendor gets a branded calculator and enquiries are routed to both the vendor and Oaklease.

## Can a supplier in one country lease to a customer in another?

Yes — cross-border leasing arrangements are possible. The lease is typically governed by the regulations of the lessee''s country. Oaklease can facilitate these arrangements across all supported European markets.

## Do you offer white-label calculator solutions?

Yes. Vendors can get a branded calculator at their own URL (e.g., euro.oaklease.co.uk/your-company) or embed the calculator on their own website via iframe. The calculator uses Oaklease''s rates and sends enquiries to both parties.

## How are leasing costs calculated?

We use the PMT (annuity) formula for most countries, which calculates equal monthly payments over the lease term. Some countries use a flat-rate calculation. All displayed figures are indicative estimates — a formal quote will be provided upon enquiry.')
ON CONFLICT (key) DO NOTHING;
