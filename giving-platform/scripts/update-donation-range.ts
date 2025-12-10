#!/usr/bin/env npx tsx
/**
 * Donation Range Update Script
 *
 * Run this script when you need to update the donation amount limits.
 * It will update all relevant configuration and provide guidance on
 * additional steps that may be needed.
 *
 * Usage:
 *   npx tsx scripts/update-donation-range.ts --min 1000 --max 50000 --cc-max 10000
 *
 * Options:
 *   --min      Minimum donation amount in dollars (default: 1000)
 *   --max      Maximum donation amount in dollars (default: 20000)
 *   --cc-max   Maximum credit card payment in dollars (default: 10000)
 *   --dry-run  Show what would be changed without making changes
 *
 * How the slider works:
 *   - The slider has 5 tick positions (0-4)
 *   - Each position shows 4 quick select buttons at $1K increments
 *   - Total range is divided into 5 equal segments
 *   - No overlapping amounts between positions
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: number): number => {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) {
    return parseInt(args[index + 1], 10);
  }
  return defaultValue;
};

const isDryRun = args.includes('--dry-run');
const minDonation = getArg('min', 1000);
const maxDonation = getArg('max', 20000);
const ccMax = getArg('cc-max', 10000);

// Convert to cents for config
const minCents = minDonation * 100;
const maxCents = maxDonation * 100;
const ccMaxCents = ccMax * 100;

console.log('\n===========================================');
console.log('  DONATION RANGE UPDATE SCRIPT');
console.log('===========================================\n');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

console.log('New Settings:');
console.log(`  Min Donation:     $${minDonation.toLocaleString()} (${minCents} cents)`);
console.log(`  Max Donation:     $${maxDonation.toLocaleString()} (${maxCents} cents)`);
console.log(`  Credit Card Max:  $${ccMax.toLocaleString()} (${ccMaxCents} cents)`);
console.log('');

// Validation
if (minDonation >= maxDonation) {
  console.error('❌ Error: Min donation must be less than max donation');
  process.exit(1);
}

if (ccMax > maxDonation) {
  console.error('❌ Error: Credit card max cannot exceed max donation');
  process.exit(1);
}

if (minDonation < 1) {
  console.error('❌ Error: Min donation must be at least $1');
  process.exit(1);
}

// Generate TICK_RANGES for the new range
// Divides total range into 5 positions, each with 4 buttons at $1K increments
// Ensures no overlapping amounts between positions
function generateTickRanges(min: number, max: number): { start: number; buttons: number[] }[] {
  const numPositions = 5;
  const buttonsPerPosition = 4;
  const buttonIncrement = 1000; // Always $1K increments

  // Total buttons needed = 5 positions * 4 buttons = 20 unique amounts
  // From min to max, we need 20 unique values at $1K increments
  // This works perfectly for $1K-$20K range (20 values: 1,2,3,...,20)

  const totalButtons = numPositions * buttonsPerPosition;
  const totalRange = max - min;
  const actualIncrement = Math.floor(totalRange / (totalButtons - 1));

  // Round to nearest $1000 for clean numbers
  const roundedIncrement = Math.max(1000, Math.round(actualIncrement / 1000) * 1000);

  const ranges: { start: number; buttons: number[] }[] = [];
  let currentAmount = min;

  for (let pos = 0; pos < numPositions; pos++) {
    const buttons: number[] = [];

    for (let btn = 0; btn < buttonsPerPosition; btn++) {
      // Round to nearest $1000
      const amount = Math.round(currentAmount / 1000) * 1000;
      buttons.push(Math.min(amount, max));
      currentAmount += roundedIncrement;
    }

    ranges.push({ start: buttons[0], buttons });
  }

  // Ensure last button of last range equals max
  const lastRange = ranges[ranges.length - 1];
  if (lastRange.buttons[3] !== max) {
    // Adjust last range to end at max
    lastRange.buttons[3] = max;
    // Work backwards to ensure $1K spacing
    for (let i = 2; i >= 0; i--) {
      lastRange.buttons[i] = lastRange.buttons[i + 1] - roundedIncrement;
    }
    lastRange.start = lastRange.buttons[0];
  }

  return ranges;
}

const tickRanges = generateTickRanges(minDonation, maxDonation);

console.log('Generated TICK_RANGES:');
tickRanges.forEach((range, i) => {
  console.log(`  Position ${i}: $${range.buttons.map(b => b.toLocaleString()).join(', ')}`);
});
console.log('');

// Files to update
const projectRoot = path.resolve(__dirname, '..');

// 1. Update config.ts
console.log('📝 Updating lib/config.ts...');
const configPath = path.join(projectRoot, 'lib/config.ts');
let configContent = fs.readFileSync(configPath, 'utf-8');

const configUpdates = [
  {
    pattern: /minDonationCents:\s*\d+/,
    replacement: `minDonationCents: ${minCents}`,
    description: 'minDonationCents'
  },
  {
    pattern: /maxDonationCents:\s*\d+/,
    replacement: `maxDonationCents: ${maxCents}`,
    description: 'maxDonationCents'
  },
  {
    pattern: /creditCardMaxCents:\s*\d+/,
    replacement: `creditCardMaxCents: ${ccMaxCents}`,
    description: 'creditCardMaxCents'
  }
];

for (const update of configUpdates) {
  if (update.pattern.test(configContent)) {
    configContent = configContent.replace(update.pattern, update.replacement);
    console.log(`   ✓ Updated ${update.description}`);
  } else {
    console.log(`   ⚠ Could not find ${update.description}`);
  }
}

if (!isDryRun) {
  fs.writeFileSync(configPath, configContent);
}

// 2. Update amount-input.tsx
console.log('\n📝 Updating components/donation/amount-input.tsx...');
const amountInputPath = path.join(projectRoot, 'components/donation/amount-input.tsx');
let amountInputContent = fs.readFileSync(amountInputPath, 'utf-8');

// Generate the new TICK_RANGES array
const tickRangesCode = `const TICK_RANGES = [
${tickRanges.map(range => `  { start: ${range.start}, buttons: [${range.buttons.join(', ')}] },`).join('\n')}
];`;

// Update TICK_RANGES
const tickRangesPattern = /const TICK_RANGES = \[[\s\S]*?\];/;
if (tickRangesPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(tickRangesPattern, tickRangesCode);
  console.log('   ✓ Updated TICK_RANGES array');
} else {
  console.log('   ⚠ Could not find TICK_RANGES array');
}

// Update default values in props
const defaultMinPattern = /minAmount\s*=\s*\d+/;
const defaultMaxPattern = /maxAmount\s*=\s*\d+/;
const defaultCcPattern = /creditCardMax\s*=\s*\d+/;

if (defaultMinPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(defaultMinPattern, `minAmount = ${minDonation}`);
  console.log('   ✓ Updated default minAmount');
}

if (defaultMaxPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(defaultMaxPattern, `maxAmount = ${maxDonation}`);
  console.log('   ✓ Updated default maxAmount');
}

if (defaultCcPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(defaultCcPattern, `creditCardMax = ${ccMax}`);
  console.log('   ✓ Updated default creditCardMax');
}

// Update slider max position (should be numPositions - 1)
const sliderMaxPattern = /max="4"/;
const newSliderMax = tickRanges.length - 1;
if (sliderMaxPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(/max="\d+"/g, `max="${newSliderMax}"`);
  console.log(`   ✓ Updated slider max to ${newSliderMax}`);
}

// Update tick marks array
const tickMarksPattern = /\[0, 1, 2, 3, 4\]\.map/;
const newTickMarks = Array.from({ length: tickRanges.length }, (_, i) => i);
amountInputContent = amountInputContent.replace(tickMarksPattern, `[${newTickMarks.join(', ')}].map`);
console.log(`   ✓ Updated tick marks array`);

// Update slider position calculations
const sliderPositionCalcPattern = /sliderPosition \/ 4/g;
amountInputContent = amountInputContent.replace(sliderPositionCalcPattern, `sliderPosition / ${newSliderMax}`);
console.log(`   ✓ Updated slider position calculations`);

// Update position bounds check
const positionBoundsPattern = /if \(value >= 17000\) return 4;/;
const lastRangeStart = tickRanges[tickRanges.length - 1].buttons[0];
amountInputContent = amountInputContent.replace(positionBoundsPattern, `if (value >= ${lastRangeStart}) return ${newSliderMax};`);
console.log(`   ✓ Updated position bounds check`);

if (!isDryRun) {
  fs.writeFileSync(amountInputPath, amountInputContent);
}

// 3. Update donate-client.tsx default amount
console.log('\n📝 Updating app/donate/donate-client.tsx...');
const donateClientPath = path.join(projectRoot, 'app/donate/donate-client.tsx');
let donateClientContent = fs.readFileSync(donateClientPath, 'utf-8');

// Set default to first button of middle range
const middleRangeIndex = Math.floor(tickRanges.length / 2);
const defaultAmount = tickRanges[middleRangeIndex].buttons[0];
console.log(`   Default amount will be: $${defaultAmount.toLocaleString()} (middle range start)`);

const defaultAmountPattern = /const \[amount, setAmount\] = React\.useState\(\d+\)/;
const defaultAmountReplacement = `const [amount, setAmount] = React.useState(${defaultAmount})`;

if (defaultAmountPattern.test(donateClientContent)) {
  donateClientContent = donateClientContent.replace(defaultAmountPattern, defaultAmountReplacement);
  console.log('   ✓ Updated default amount state');
} else {
  console.log('   ⚠ Could not find default amount state');
}

// Update ACH/check message in Summary section
const summaryAchPattern = /Donations over \$[\d,]+ require ACH or check payment/g;
donateClientContent = donateClientContent.replace(summaryAchPattern, `Donations over $${ccMax.toLocaleString()} require ACH or check payment`);

if (!isDryRun) {
  fs.writeFileSync(donateClientPath, donateClientContent);
}

// Summary and manual steps
console.log('\n===========================================');
console.log('  SUMMARY');
console.log('===========================================\n');

if (isDryRun) {
  console.log('🔍 DRY RUN COMPLETE - No files were modified\n');
  console.log('Run without --dry-run to apply changes.\n');
} else {
  console.log('✅ Configuration files updated!\n');
}

console.log('📋 MANUAL STEPS REQUIRED:\n');

console.log('1. Clear existing donation drafts (optional but recommended):');
console.log('   - Users may have old drafts with amounts outside new range');
console.log('   - These will be auto-clamped when loaded, but you may want to notify users\n');

console.log('2. Update FAQ if fee structure changed:');
console.log('   - File: app/faq/page.tsx');
console.log('   - Update example calculations if amounts changed significantly\n');

console.log('3. Test the changes:');
console.log('   - Visit /donate and verify slider range');
console.log('   - Test quick select buttons for each slider position');
console.log('   - Verify no duplicate amounts across positions');
console.log('   - Test custom amount input (min/max enforcement)');
console.log('   - Test credit card limit message appears at correct threshold');
console.log('   - Load an old draft to verify clamping works\n');

console.log('4. Update any marketing/documentation with new limits\n');

console.log('5. Consider database migration if tracking limits historically\n');

console.log('===========================================\n');

// Show files that were/would be modified
console.log('Files modified:');
console.log(`  - lib/config.ts`);
console.log(`  - components/donation/amount-input.tsx`);
console.log(`  - app/donate/donate-client.tsx`);
console.log('');
