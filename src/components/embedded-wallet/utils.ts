import { setCustomHeaders } from "@leapwallet/embedded-wallet-sdk-react";

export const init = () => {
  if (process.env.NEXT_PUBLIC_LEAP_API_APP_TYPE) {
    setCustomHeaders({
      'x-app-type': process.env.NEXT_PUBLIC_LEAP_API_APP_TYPE
    })
  }
};
