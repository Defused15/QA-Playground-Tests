import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import {
  Geolocation,
  LOCATION_MESSAGES,
  REVERSE_GEOCODE_URL,
} from '../POM/geolocation';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };

let geolocation: Geolocation;

test.describe('Geolocation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/geolocation/');
    geolocation = new Geolocation(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test.describe('Happy path', () => {
    test.use({ geolocation: PARIS, permissions: ['geolocation'] });

    test('Initial state prompts the user to click the button', async ({
      page,
    }) => {
      await test.step('Verify page title', async () => {
        await expect(page).toHaveTitle('Test Geolocation');
      });

      await test.step('Verify prompt and enabled button', async () => {
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.initial
        );
        await expect(geolocation.getLocationButton).toBeEnabled();
      });
    });

    test('Shows city and country for the current position', async ({
      context,
    }) => {
      const requests: string[] = [];

      await test.step('Stub reverse geocoding response', async () => {
        await Geolocation.mockReverseGeocode(
          context,
          { city: 'Paris', country: 'France' },
          requests
        );
      });

      await test.step('Click Get Location', async () => {
        await geolocation.getLocation();
      });

      await test.step('Verify location text and requested coordinates', async () => {
        await expect(geolocation.locationInfo).toHaveText('Paris, France');
        const url = new URL(requests[0]);
        expect(url.searchParams.get('lat')).toBe(String(PARIS.latitude));
        expect(url.searchParams.get('lon')).toBe(String(PARIS.longitude));
        expect(url.searchParams.get('format')).toBe('json');
      });
    });

    test('Updated position is used on the next request', async ({
      context,
    }) => {
      const requests: string[] = [];

      await test.step('Get location for the first position', async () => {
        await Geolocation.mockReverseGeocode(
          context,
          { city: 'Paris', country: 'France' },
          requests
        );
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText('Paris, France');
      });

      await test.step('Move the device and stub the new address', async () => {
        await context.unrouteAll();
        await context.setGeolocation(SYDNEY);
        await Geolocation.mockReverseGeocode(
          context,
          { city: 'Sydney', country: 'Australia' },
          requests
        );
      });

      await test.step('Get location again and verify update', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText('Sydney, Australia');
        const url = new URL(requests[1]);
        expect(url.searchParams.get('lat')).toBe(String(SYDNEY.latitude));
        expect(url.searchParams.get('lon')).toBe(String(SYDNEY.longitude));
      });
    });
  });

  test.describe('Edge cases', () => {
    test.use({ geolocation: PARIS, permissions: ['geolocation'] });

    test('Get location using the keyboard only', async ({ context, page }) => {
      await test.step('Stub reverse geocoding response', async () => {
        await Geolocation.mockReverseGeocode(context, {
          city: 'Paris',
          country: 'France',
        });
      });

      await test.step('Focus the button and press Enter', async () => {
        await geolocation.getLocationButton.focus();
        await page.keyboard.press('Enter');
      });

      await test.step('Verify location text', async () => {
        await expect(geolocation.locationInfo).toHaveText('Paris, France');
      });
    });

    test('Rapid repeated clicks settle on the same location', async ({
      context,
    }) => {
      const requests: string[] = [];

      await test.step('Stub reverse geocoding response', async () => {
        await Geolocation.mockReverseGeocode(
          context,
          { city: 'Paris', country: 'France' },
          requests
        );
      });

      await test.step('Click Get Location three times quickly', async () => {
        await geolocation.getLocationButton.click({ clickCount: 3 });
      });

      await test.step('Verify text and one lookup per click', async () => {
        await expect(geolocation.locationInfo).toHaveText('Paris, France');
        await expect.poll(() => requests.length).toBe(3);
      });
    });

    test('Boundary coordinates are passed through unchanged', async ({
      context,
    }) => {
      const requests: string[] = [];

      await test.step('Set position to the date line near the pole', async () => {
        await context.setGeolocation({ latitude: -90, longitude: 180 });
        await Geolocation.mockReverseGeocode(
          context,
          { city: 'Nowhere', country: 'Antarctica' },
          requests
        );
      });

      await test.step('Get location', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText(
          'Nowhere, Antarctica'
        );
      });

      await test.step('Verify boundary coordinates in the request', async () => {
        const url = new URL(requests[0]);
        expect(url.searchParams.get('lat')).toBe('-90');
        expect(url.searchParams.get('lon')).toBe('180');
      });
    });

    // The app reads address.city only; town/village results are not handled
    test('Address without a city shows "undefined"', async ({ context }) => {
      await test.step('Stub an address that only has a town', async () => {
        await Geolocation.mockReverseGeocode(context, {
          town: 'Smallville',
          country: 'France',
        });
      });

      await test.step('Get location and verify text', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText('undefined, France');
      });
    });

    test('Location works on a mobile-sized viewport', async ({
      context,
      page,
    }) => {
      await test.step('Resize viewport to mobile width', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(geolocation.getLocationButton).toBeInViewport();
      });

      await test.step('Get location and verify text', async () => {
        await Geolocation.mockReverseGeocode(context, {
          city: 'Paris',
          country: 'France',
        });
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText('Paris, France');
      });
    });
  });

  test.describe('Negative cases', () => {
    test('Permission not granted shows an allow-access message', async ({
      browserName,
    }) => {
      // eslint-disable-next-line playwright/no-skipped-test -- browser limitation, not a pending test
      test.skip(
        browserName === 'firefox',
        'Firefox leaves the permission prompt pending instead of denying'
      );

      await test.step('Click Get Location without permission', async () => {
        await geolocation.getLocation();
      });

      await test.step('Verify permission denied message', async () => {
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.permissionDenied
        );
      });
    });

    test('Permission denied error shows an allow-access message', async ({
      page,
    }) => {
      await test.step('Stub a PERMISSION_DENIED error', async () => {
        await Geolocation.stubPositionError(page, 1);
        await page.reload();
      });

      await test.step('Click Get Location', async () => {
        await geolocation.getLocation();
      });

      await test.step('Verify permission denied message', async () => {
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.permissionDenied
        );
      });
    });

    test('Position unavailable error shows an unavailable message', async ({
      page,
    }) => {
      await test.step('Stub a POSITION_UNAVAILABLE error', async () => {
        await Geolocation.stubPositionError(page, 2);
        await page.reload();
      });

      await test.step('Click Get Location and verify message', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.unavailable
        );
      });
    });

    test('Timeout error shows a timed-out message', async ({ page }) => {
      await test.step('Stub a TIMEOUT error', async () => {
        await Geolocation.stubPositionError(page, 3);
        await page.reload();
      });

      await test.step('Click Get Location and verify message', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.timeout
        );
      });
    });

    test('Missing Geolocation API shows an unsupported message', async ({
      page,
    }) => {
      await test.step('Remove navigator.geolocation', async () => {
        await Geolocation.removeGeolocationApi(page);
        await page.reload();
      });

      await test.step('Click Get Location and verify message', async () => {
        await geolocation.getLocation();
        await expect(geolocation.locationInfo).toHaveText(
          LOCATION_MESSAGES.unsupported
        );
      });
    });

    test.describe('Reverse geocoding failure', () => {
      test.use({ geolocation: PARIS, permissions: ['geolocation'] });

      // The app has no error handling for the lookup; text stays unchanged
      test('Network error leaves the initial prompt', async ({
        context,
        page,
      }) => {
        await test.step('Abort reverse geocoding requests', async () => {
          await context.route(REVERSE_GEOCODE_URL, (route) => route.abort());
        });

        const pageError = await test.step('Click Get Location', async () => {
          const errorPromise = page.waitForEvent('pageerror');
          await geolocation.getLocation();
          return errorPromise;
        });

        await test.step('Verify uncaught error and unchanged text', async () => {
          expect(pageError).toBeInstanceOf(Error);
          await expect(geolocation.locationInfo).toHaveText(
            LOCATION_MESSAGES.initial
          );
        });
      });

      test('Invalid JSON response leaves the initial prompt', async ({
        context,
        page,
      }) => {
        await test.step('Return a non-JSON server error', async () => {
          await context.route(REVERSE_GEOCODE_URL, (route) =>
            route.fulfill({ status: 500, body: 'Internal Server Error' })
          );
        });

        const pageError = await test.step('Click Get Location', async () => {
          const errorPromise = page.waitForEvent('pageerror');
          await geolocation.getLocation();
          return errorPromise;
        });

        await test.step('Verify uncaught error and unchanged text', async () => {
          expect(pageError).toBeInstanceOf(Error);
          await expect(geolocation.locationInfo).toHaveText(
            LOCATION_MESSAGES.initial
          );
        });
      });
    });
  });
});
