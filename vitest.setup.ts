import React from 'react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Make React available globally for components that don't explicitly import it
global.React = React;
