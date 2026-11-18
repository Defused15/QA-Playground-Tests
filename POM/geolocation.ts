import { Page, Locator, BrowserContext } from '@playwright/test';

export const LOCATION_MESSAGES = {
  initial: 'Click on the button to get your current location',
  permissionDenied: 'Please allow access to location',
  unavailable: 'Location Information unavailable',
  timeout: 'The request to get user location timed out',
  unsupported: 'The browser does not support geolocation',
};

export const REVERSE_GEOCODE_URL = '**/nominatim.openstreetmap.org/reverse**';

export type GeolocationErrorCode = 1 | 2 | 3;

export class Geolocation {
  readonly locationInfo: Locator;
  readonly getLocationButton: Locator;

  constructor(page: Page) {
    // Status text is a plain div with no role or label
    this.locationInfo = page.locator('#location-info');
    this.getLocationButton = page.getByRole('button', { name: 'Get Location' });
  }

  async getLocation() {
    await this.getLocationButton.click();
  }

  // The app reverse-geocodes via OpenStreetMap; stub it so results are
  // deterministic and independent of the browser locale.
  static async mockReverseGeocode(
    context: BrowserContext,
    address: Record<string, string>,
    requestedUrls: string[] = []
  ) {
    await context.route(REVERSE_GEOCODE_URL, (route) => {
      requestedUrls.push(route.request().url());
      return route.fulfill({ json: { address } });
    });
  }

  // Forces getCurrentPosition to fail with the given PositionError code.
  // Scripts are passed as strings because the project has no DOM typings.
  static async stubPositionError(page: Page, code: GeolocationErrorCode) {
    await page.addInitScript(`
      navigator.geolocation.getCurrentPosition = (success, error) =>
        error({
          code: ${code},
          message: 'stubbed',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
    `);
  }

  static async removeGeolocationApi(page: Page) {
    await page.addInitScript(`
      Object.defineProperty(Navigator.prototype, 'geolocation', {
        get: () => undefined,
        configurable: true,
      });
    `);
  }
}
