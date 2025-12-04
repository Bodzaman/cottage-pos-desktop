export enum Mode {
  DEV = "development",
  PROD = "production",
}

interface WithEnvMode {
  readonly env: {
    readonly MODE: Mode;
  };
}

export const mode = Mode.PROD; // Desktop app always runs in production mode

// Production API Configuration (connects to Databutton backend)
export const APP_ID = "88a315b0-faa2-491d-9215-cf1e283cdee2";

export const API_PATH = "/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

export const API_URL = "https://api.databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

export const API_HOST = "api.databutton.com";

export const API_PREFIX_PATH = "/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

export const WS_API_URL = "wss://api.databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

export const APP_BASE_PATH = "/cottage-tandoori-restaurant";

export const APP_TITLE = "Cottage Tandoori Restaurant";

export const APP_FAVICON_LIGHT = "";
export const APP_FAVICON_DARK = "";

export const APP_DEPLOY_USERNAME = "exoticcreations";
export const APP_DEPLOY_APPNAME = "cottage-tandoori-restaurant";
export const APP_DEPLOY_CUSTOM_DOMAIN = "";
