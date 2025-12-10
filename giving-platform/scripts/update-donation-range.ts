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

// 2. Update amount-input.tsx preset amounts
console.log('\n📝 Updating components/donation/amount-input.tsx...');
const amountInputPath = path.join(projectRoot, 'components/donation/amount-input.tsx');
let amountInputContent = fs.readFileSync(amountInputPath, 'utf-8');

// Generate smart preset amounts based on range
function generatePresets(min: number, max: number): number[] {
  const range = max - min;
  const presets: number[] = [];

  // Always include min and max
  presets.push(min);

  // Add intermediate values
  const steps = [0.1, 0.25, 0.5, 0.75];
  for (const step of steps) {
    const value = min + Math.round(range * step);
    // Round to nice numbers
    const rounded = Math.round(value / 500) * 500;
    if (rounded > min && rounded < max && !presets.includes(rounded)) {
      presets.push(rounded);
    }
  }

  presets.push(max);

  // Ensure we have exactly 6 presets
  while (presets.length < 6) {
    // Add more intermediate values
    const midPoint = Math.round((presets[presets.length - 2] + presets[presets.length - 1]) / 2 / 500) * 500;
    if (!presets.includes(midPoint)) {
      presets.splice(presets.length - 1, 0, midPoint);
    } else {
      break;
    }
  }

  return presets.slice(0, 6).sort((a, b) => a - b);
}

const newPresets = generatePresets(minDonation, maxDonation);
console.log(`   Generated presets: ${newPresets.map(p => `$${p.toLocaleString()}`).join(', ')}`);

const presetPattern = /const PRESET_AMOUNTS = \[[\d,\s]+\];/;
const presetReplacement = `const PRESET_AMOUNTS = [${newPresets.join(', ')}];`;

if (presetPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(presetPattern, presetReplacement);
  console.log('   ✓ Updated PRESET_AMOUNTS');
} else {
  console.log('   ⚠ Could not find PRESET_AMOUNTS array');
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

// Update the ACH/check threshold message
const achMessagePattern = /Donations over \$[\d,]+/g;
amountInputContent = amountInputContent.replace(achMessagePattern, `Donations over $${ccMax.toLocaleString()}`);

const ccLimitPattern = /Credit card payments are limited to \$[\d,]+ or less/g;
amountInputContent = amountInputContent.replace(ccLimitPattern, `Credit card payments are limited to $${ccMax.toLocaleString()} or less`);

// Generate slider tick amounts for comment reference
const sliderTickAmounts = [0, 1, 2, 3, 4, 5, 6].map(pos => {
  const range = maxDonation - minDonation;
  return Math.round((minDonation + (pos / 6) * range) / 100) * 100;
});
console.log(`   Slider tick amounts: ${sliderTickAmounts.map(a => `$${a.toLocaleString()}`).join(', ')}`);

// Update SLIDER_TICKS array with new amounts
const sliderTicksPattern = /const SLIDER_TICKS = \[[\s\S]*?\];/;
const newSliderTicks = `const SLIDER_TICKS = [
  { position: 0, amount: ${sliderTickAmounts[0]} },
  { position: 1, amount: ${sliderTickAmounts[1]} },
  { position: 2, amount: ${sliderTickAmounts[2]} },
  { position: 3, amount: ${sliderTickAmounts[3]} },
  { position: 4, amount: ${sliderTickAmounts[4]} },
  { position: 5, amount: ${sliderTickAmounts[5]} },
  { position: 6, amount: ${sliderTickAmounts[6]} },
];`;

if (sliderTicksPattern.test(amountInputContent)) {
  amountInputContent = amountInputContent.replace(sliderTicksPattern, newSliderTicks);
  console.log('   ✓ Updated SLIDER_TICKS array');
} else {
  console.log('   ⚠ Could not find SLIDER_TICKS array');
}

if (!isDryRun) {
  fs.writeFileSync(amountInputPath, amountInputContent);
}

// 3. Update donate-client.tsx default amount
console.log('\n📝 Updating app/donate/donate-client.tsx...');
const donateClientPath = path.join(projectRoot, 'app/donate/donate-client.tsx');
let donateClientContent = fs.readFileSync(donateClientPath, 'utf-8');

// Set default to mid-range
const defaultAmount = Math.round((minDonation + maxDonation) / 2 / 500) * 500;
console.log(`   Default amount will be: $${defaultAmount.toLocaleString()} (mid-range)`);

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
console.log('   - Test preset buttons');
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
