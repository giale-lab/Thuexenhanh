const fs = require('fs');

const extractFunctions = (source, functionNames) => {
  let result = '';
  for (const name of functionNames) {
    const regex = new RegExp(`^function ${name}\\b[\\s\\S]*?\\n}\\n`, 'm');
    const match = source.match(regex);
    if (match) {
      result += match[0] + '\n';
    } else {
      console.warn(`Function ${name} not found!`);
    }
  }
  return result;
};

// --- SHARED ---
const sharedSrc = fs.readFileSync('src/shared.jsx', 'utf8');
const sharedHeader = sharedSrc.substring(0, sharedSrc.indexOf('function '));

const locationFuncs = ['SearchLocationPicker', 'LocationPicker', 'MapModal'];
const uiKitFuncs = ['AppLogo', 'LazyImage', 'SkeletonCard', 'ImageSlider', 'ModuleFrame', 'StatusBadge', 'Field', 'Toggle', 'DepositField', 'FilterCheckboxGroup', 'FilterToggle', 'FilterSelect', 'Stat', 'ImageUploadOptimizer', 'InfoPanel'];

fs.writeFileSync('src/modules/Shared/Location.jsx', sharedHeader + extractFunctions(sharedSrc, locationFuncs) + `\nexport { ${locationFuncs.join(', ')} };\n`);
fs.writeFileSync('src/modules/Shared/UIKit.jsx', sharedHeader + extractFunctions(sharedSrc, uiKitFuncs) + `\nexport { ${uiKitFuncs.join(', ')} };\n`);

// --- AUTH ---
const authSrc = fs.readFileSync('src/auth.jsx', 'utf8');
const authHeader = authSrc.substring(0, authSrc.indexOf('function '));

const loginFuncs = ['LoginScreen'];
const accountFuncs = ['AccountSettingsScreen'];
const onboardingFuncs = ['OwnerWizard', 'QuyCheModal', 'DataProtectionPolicy'];
const paymentFuncs = ['TopUpModal', 'UpgradeModal'];
const otherAuthFuncs = ['SetLocationPopup', 'FaqModal', 'CommunityModal'];

fs.writeFileSync('src/modules/Auth/Login.jsx', authHeader + extractFunctions(authSrc, loginFuncs) + `\nexport { ${loginFuncs.join(', ')} };\n`);
fs.writeFileSync('src/modules/Auth/Account.jsx', authHeader + extractFunctions(authSrc, accountFuncs) + `\nexport { ${accountFuncs.join(', ')} };\n`);
fs.writeFileSync('src/modules/Auth/Onboarding.jsx', authHeader + extractFunctions(authSrc, onboardingFuncs) + `\nexport { ${onboardingFuncs.join(', ')} };\n`);
fs.writeFileSync('src/modules/Payment/Tokens.jsx', authHeader + extractFunctions(authSrc, paymentFuncs) + `\nexport { ${paymentFuncs.join(', ')} };\n`);

// --- CARS ---
const carsSrc = fs.readFileSync('src/cars.jsx', 'utf8');
const carsHeader = carsSrc.substring(0, carsSrc.indexOf('function '));
// Overview contains some non-function constants at the top? Let's check cars.jsx top.
