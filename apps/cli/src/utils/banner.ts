import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getVersion(): string {
  try {
    // Read package.json to get version
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

function displayAsciiLogo(): void {
  // blockus uses a neutral, monochrome brand. Render the mark in a subtle
  // light-to-dark grayscale gradient.
  const gradientColors = [
    chalk.hex('#FFFFFF'),
    chalk.hex('#D4D4D4'),
    chalk.hex('#A3A3A3'),
    chalk.hex('#737373'),
    chalk.hex('#525252'),
  ];

  // Define the color for the inner part of the logo (the "kernel").
  const kernelColor = chalk.white.bold;

  // The ASCII art for the logo — a quarter-circle, the blockus mark.
  const logo = [
    '@@@@@@@@@@         ',
    '@@@@@@@@@@@@@      ',
    '@@@@@@@@@@@@@@@    ',
    '@@@@@@     @@@@@   ',
    '@@@@@        @@@@  ',
    '@@@@@         @@@  ',
    '@@@@@          @@  ',
    '@@@@@          @@  ',
    '@@@@@          @@  ',
  ];

  const textArt = [
    '                                      ',
    '                                      ',
    '   __    __           __              ',
    '  / /_  / /___  _____/ /____  _______ ',
    ' / __ \\/ / __ \\/ ___/ //_/ / / / ___/ ',
    '/ /_/ / / /_/ / /__/ ,< / /_/ (__  )  ',
    '/_.___/_/\\____/\\___/_/|_|\\__,_/____/  ',
    '                                      ',
    '                                      ',
  ];

  console.log('');

  // Display logo and text side by side
  for (let i = 0; i < Math.max(logo.length, textArt.length); i++) {
    let line = '';

    // Add the logo part
    if (i < logo.length) {
      const logoLine = logo[i]!;
      const outerColor =
        gradientColors[i] || gradientColors[gradientColors.length - 1]!;
      let coloredLogoLine = '';

      for (const char of logoLine) {
        if (char === '#' || char === '\\') {
          coloredLogoLine += kernelColor(char);
        } else {
          coloredLogoLine += outerColor(char);
        }
      }
      line += `  ${coloredLogoLine}`;
    } else {
      line += `  ${' '.repeat(12)}`; // Maintain spacing when logo is shorter
    }

    // Add spacing between logo and text
    line += '    ';

    // Add the text part
    if (i < textArt.length) {
      const textLine = textArt[i]!;
      // Apply gradient color to text as well
      const textColor = chalk.white.bold;
      // gradientColors[i] || gradientColors[gradientColors.length - 1]!;
      line += textColor(textLine);
    }

    console.log(line);
  }

  console.log('');
}

export function printBanner(silent: boolean): void {
  if (silent) {
    return;
  }

  const version = getVersion();

  /**
   * This function logs an ASCII art representation of the logo to the console.
   * It uses chalk to apply a blue and purple gradient, similar to the provided image,
   * with a white-filled center.
   */

  displayAsciiLogo();
  console.log();
  console.log(
    chalk.white.bold('     blockus IDE Extension') + chalk.gray(` v${version}`),
  );
  console.log();
  console.log();
}

export function printCompactBanner(silent: boolean): void {
  if (silent) {
    return;
  }

  const version = getVersion();

  console.log();
  console.log(chalk.white.bold('  blockus') + chalk.gray(` v${version}`));
  console.log();
}
